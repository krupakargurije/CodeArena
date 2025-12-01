import { supabase } from './supabaseClient';

// Generate unique 6-character room ID
export const generateRoomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Create new room
export const createRoom = async (roomData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const accessToken = session.access_token;

    // Generate unique room ID
    let roomId = generateRoomId();

    // Check if ID already exists (very rare)
    // Use direct fetch for this check to avoid client timeout
    let existing = null;
    try {
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}&select=id`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData.length > 0) existing = fetchData[0];
        } else {
            // Fallback to client if fetch fails
            const { data } = await supabase
                .from('rooms')
                .select('id')
                .eq('id', roomId)
                .maybeSingle();
            existing = data;
        }
    } catch (e) {
        const { data } = await supabase
            .from('rooms')
            .select('id')
            .eq('id', roomId)
            .maybeSingle();
        existing = data;
    }

    // Regenerate if collision
    while (existing) {
        roomId = generateRoomId();
        // Repeat check
        try {
            const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}&select=id`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (fetchResponse.ok) {
                const fetchData = await fetchResponse.json();
                existing = fetchData.length > 0 ? fetchData[0] : null;
            } else {
                const { data } = await supabase.from('rooms').select('id').eq('id', roomId).maybeSingle();
                existing = data;
            }
        } catch (e) {
            const { data } = await supabase.from('rooms').select('id').eq('id', roomId).maybeSingle();
            existing = data;
        }
    }

    // Create room using direct fetch first
    try {
        console.log('Attempting direct REST POST for createRoom...');
        const roomPayload = {
            id: roomId,
            created_by: session.user.id,
            problem_id: roomData.problemId || null,
            problem_selection_mode: roomData.problemSelectionMode,
            max_participants: roomData.maxParticipants
        };

        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms`, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(roomPayload)
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData && fetchData.length > 0) {
                console.log('Direct POST createRoom SUCCESS');
                const room = fetchData[0];

                // Add creator as first participant via direct fetch
                try {
                    await fetch(`${supabaseUrl}/rest/v1/room_participants`, {
                        method: 'POST',
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            room_id: roomId,
                            user_id: session.user.id,
                            username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
                        })
                    });
                } catch (pError) {
                    console.error('Direct participant add failed', pError);
                    // Try fallback for participant
                    await supabase.from('room_participants').insert({
                        room_id: roomId,
                        user_id: session.user.id,
                        username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
                    });
                }

                return { data: room };
            }
        } else {
            console.error('Direct POST createRoom FAILED', fetchResponse.status, await fetchResponse.text());
        }
    } catch (e) {
        console.warn('Direct POST createRoom failed, falling back to client', e);
    }

    // Fallback to client
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
            id: roomId,
            created_by: session.user.id,
            problem_id: roomData.problemId || null,
            problem_selection_mode: roomData.problemSelectionMode,
            max_participants: roomData.maxParticipants
        })
        .select()
        .single();

    if (roomError) throw roomError;

    // Add creator as first participant
    const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
            room_id: roomId,
            user_id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
        });

    if (participantError) throw participantError;

    return { data: room };
};

// Join existing room
export const joinRoom = async (roomId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const accessToken = session.access_token;

    let room = null;
    let roomError = null;

    // Try direct fetch for room details first
    try {
        console.log('Attempting direct REST fetch for joinRoom...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId.toUpperCase()}&status=eq.waiting&select=*,room_participants(*)`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData && fetchData.length > 0) {
                room = fetchData[0];
                console.log('Direct fetch joinRoom SUCCESS');
            }
        }
    } catch (e) {
        console.warn('Direct fetch failed, falling back to client', e);
    }

    if (!room) {
        // Fallback to client
        const { data, error } = await supabase
            .from('rooms')
            .select('*, room_participants(*)')
            .eq('id', roomId.toUpperCase())
            .eq('status', 'waiting')
            .single();

        room = data;
        roomError = error;
    }

    if (roomError) throw new Error('Room not found');
    if (!room) throw new Error('Room not found');

    // Count active participants (not left)
    const activeParticipants = room.room_participants.filter(p => !p.left_at);
    if (activeParticipants.length >= room.max_participants) {
        throw new Error('Room is full');
    }

    // Check if user already in room
    const alreadyJoined = activeParticipants.some(p => p.user_id === session.user.id);
    if (alreadyJoined) {
        return { data: room };
    }

    // Add user to room via direct fetch
    try {
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/room_participants`, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_id: roomId.toUpperCase(),
                user_id: session.user.id,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
            })
        });

        if (fetchResponse.ok) {
            return { data: room };
        }
    } catch (e) {
        console.warn('Direct POST joinRoom failed, falling back', e);
    }

    // Add user to room fallback
    const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
            room_id: roomId.toUpperCase(),
            user_id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
        });

    if (joinError) throw joinError;

    return { data: room };
};

// Leave room
export const leaveRoom = async (roomId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const { error } = await supabase
        .from('room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', session.user.id)
        .is('left_at', null);

    if (error) throw error;
    return { data: { success: true } };
};

// Get room details
export const getRoomDetails = async (roomId) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Try to get session for authenticated request if possible
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || supabaseAnonKey;

    let data = null;
    let error = null;

    try {
        console.log('Attempting direct REST fetch for getRoomDetails...');
        // Complex select: *,room_participants!inner(...),problems(...)
        // REST syntax for inner join is tricky, usually !inner is implied if we filter on it, but here we just want the data.
        // We'll try a standard select.
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}&select=*,room_participants(id,user_id,username,joined_at,is_ready,left_at),problems(id,title,difficulty)`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData && fetchData.length > 0) {
                data = fetchData[0];
                console.log('Direct fetch getRoomDetails SUCCESS');
            }
        }
    } catch (e) {
        console.warn('Direct fetch failed, falling back to client', e);
    }

    if (!data) {
        const result = await supabase
            .from('rooms')
            .select(`
                *,
                room_participants!inner(
                    id,
                    user_id,
                    username,
                    joined_at,
                    is_ready,
                    left_at
                ),
                problems(
                    id,
                    title,
                    difficulty
                )
            `)
            .eq('id', roomId)
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) throw error;

    // Filter out participants who left
    if (data) {
        data.room_participants = data.room_participants.filter(p => !p.left_at);
    }

    return { data };
};

// Update ready status
export const updateReadyStatus = async (roomId, isReady) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const { error } = await supabase
        .from('room_participants')
        .update({ is_ready: isReady })
        .eq('room_id', roomId)
        .eq('user_id', session.user.id)
        .is('left_at', null);

    if (error) throw error;
    return { data: { success: true } };
};

// Start room (creator only)
export const startRoom = async (roomId) => {
    console.log('Starting room:', roomId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    // Get room to verify creator
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('created_by, problem_selection_mode, problem_id')
        .eq('id', roomId)
        .single();

    if (roomError) {
        console.error('Error fetching room:', roomError);
        throw roomError;
    }

    console.log('Room data:', room);

    if (room.created_by !== session.user.id) {
        throw new Error('Only room creator can start the room');
    }

    // If random mode, select a random problem
    let problemId = null;
    if (room.problem_selection_mode === 'random') {
        console.log('Selecting random problem...');
        const { data: problems, error: problemsError } = await supabase
            .from('problems')
            .select('id');

        if (problemsError) {
            console.error('Error fetching problems:', problemsError);
            throw new Error('Failed to fetch problems for random selection');
        }

        console.log('Available problems:', problems);

        if (problems && problems.length > 0) {
            const randomIndex = Math.floor(Math.random() * problems.length);
            problemId = problems[randomIndex].id;
            console.log('Selected random problem ID:', problemId);
        } else {
            console.error('No problems found in database');
            throw new Error('No problems available in the database');
        }
    } else {
        // Single mode - use existing problem_id
        problemId = room.problem_id;
        console.log('Using existing problem ID:', problemId);
    }

    if (!problemId && room.problem_selection_mode === 'single') {
        // If single mode but no problem ID (shouldn't happen if created correctly)
        console.log('Fetching problem ID for single mode...');
        const { data: currentRoom } = await supabase
            .from('rooms')
            .select('problem_id')
            .eq('id', roomId)
            .single();
        problemId = currentRoom?.problem_id;
        console.log('Fetched problem ID:', problemId);
    }

    if (!problemId) {
        console.error('Could not determine problem ID');
        throw new Error('Could not determine problem for this room');
    }

    // Update room status
    const updateData = {
        status: 'active',
        started_at: new Date().toISOString(),
        problem_id: problemId // Ensure problem_id is set
    };

    console.log('Updating room with:', updateData);

    const { error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', roomId);

    if (error) {
        console.error('Error updating room:', error);
        throw error;
    }

    console.log('Room started successfully');
    return { data: { success: true, problemId } };
};

// Subscribe to room updates (Realtime)
export const subscribeToRoom = (roomId, callback) => {
    const channel = supabase
        .channel(`room:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`
            },
            callback
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'room_participants',
                filter: `room_id=eq.${roomId}`
            },
            callback
        )
        .subscribe();

    return channel;
};

// Get user's active rooms
export const getUserRooms = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No user logged in');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const accessToken = session.access_token;

    try {
        // DEBUG: Try direct fetch
        console.log('Attempting direct REST fetch for user rooms...');
        // Note: This is a complex query with joins, so we might just fetch room_participants and then rooms if needed,
        // or just rely on the fact that we need room_participants.
        // For simplicity in REST, we'll just fetch room_participants and assume we can't easily join without more work.
        // But let's try to construct the join query:
        // room_participants?user_id=eq.ID&select=*,rooms(*)
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/room_participants?user_id=eq.${session.user.id}&select=room_id,joined_at,rooms(id,status,max_participants,created_at,problem_selection_mode,problems(title,difficulty))&left_at=is.null&order=joined_at.desc`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('Direct fetch user rooms SUCCESS');
            return { data: fetchData.map(p => p.rooms) };
        }
    } catch (e) {
        console.warn('Direct fetch failed, falling back to client', e);
    }

    const { data, error } = await supabase
        .from('room_participants')
        .select(`
            room_id,
            joined_at,
            rooms(
                id,
                status,
                max_participants,
                created_at,
                problem_selection_mode,
                problems(title, difficulty)
            )
        `)
        .eq('user_id', session.user.id)
        .is('left_at', null)
        .order('joined_at', { ascending: false });

    if (error) throw error;
    return { data: data.map(p => p.rooms) };
};
