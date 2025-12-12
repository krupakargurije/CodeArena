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
    console.log('createRoom: Starting...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get access token from localStorage
    // Log all localStorage keys for debugging
    console.log('createRoom: All localStorage keys:', Object.keys(localStorage));

    const authData = localStorage.getItem('supabase.auth.token');
    console.log('createRoom: Auth data found:', !!authData);

    let accessToken = supabaseAnonKey;
    let userId = null;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            console.log('createRoom: Parsed auth:', { hasToken: !!parsed.access_token, hasUser: !!parsed.user, userId: parsed.user?.id });
            accessToken = parsed.access_token || supabaseAnonKey;
            userId = parsed.user?.id;
            console.log('createRoom: Using authenticated token, userId:', userId);
        } catch (e) {
            console.warn('createRoom: Could not parse auth, using anon key', e);
        }
    } else {
        console.warn('createRoom: No auth data found in localStorage');
    }

    if (!userId) {
        console.error('createRoom: No userId - user not logged in');
        throw new Error('No user logged in');
    }

    // Get username from localStorage
    let username = 'User';
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            username = parsed.user?.user_metadata?.username || parsed.user?.email?.split('@')[0] || 'User';
        } catch (e) {
            console.warn('createRoom: Could not get username');
        }
    }

    // Generate unique room ID
    let roomId = generateRoomId();

    // Check if ID already exists (very rare) - skip for speed
    // Collision is extremely unlikely with 6-char alphanumeric (36^6 = 2.1 billion combinations)

    // Create room using direct fetch first
    try {
        console.log('Attempting direct REST POST for createRoom...');
        const roomPayload = {
            id: roomId,
            created_by: userId,
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

                // Add creator as first participant
                const participantResponse = await fetch(`${supabaseUrl}/rest/v1/room_participants`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        room_id: roomId,
                        user_id: userId,
                        username: username
                    })
                });

                if (!participantResponse.ok) {
                    console.error('Failed to add participant:', await participantResponse.text());
                }

                console.log('createRoom: Room and participant created successfully');
                return { data: room };
            }
        } else {
            const errorText = await fetchResponse.text();
            console.error('Direct POST createRoom FAILED:', fetchResponse.status, errorText);
            throw new Error('Failed to create room: ' + errorText);
        }
    } catch (e) {
        console.error('createRoom error:', e);
        throw e;
    }
};

// Join existing room
export const joinRoom = async (roomId) => {
    console.log('joinRoom: Called for room:', roomId);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const authData = localStorage.getItem('supabase.auth.token');
    let userId = null;
    let username = 'User';
    let accessToken = supabaseAnonKey;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            userId = parsed.user?.id;
            username = parsed.user?.user_metadata?.username || parsed.user?.email?.split('@')[0] || 'User';
            accessToken = parsed.access_token || supabaseAnonKey;
        } catch (e) {
            console.error('joinRoom: Could not parse auth');
        }
    }

    if (!userId) throw new Error('No user logged in');

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

        console.log('joinRoom: Fetch response status:', fetchResponse.status);

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('joinRoom: Fetch data:', fetchData);
            if (fetchData && fetchData.length > 0) {
                room = fetchData[0];
                console.log('Direct fetch joinRoom SUCCESS');
            } else {
                console.warn('joinRoom: Room not found or not in waiting status');
                throw new Error('Room not found or not available to join');
            }
        } else {
            const errorText = await fetchResponse.text();
            console.error('joinRoom: Failed to fetch room:', fetchResponse.status, errorText);
            throw new Error('Room not found');
        }
    } catch (e) {
        console.error('joinRoom: Error fetching room:', e);
        throw e;
    }

    if (!room) throw new Error('Room not found');

    // Count active participants (not left)
    const activeParticipants = room.room_participants.filter(p => !p.left_at);
    if (activeParticipants.length >= room.max_participants) {
        throw new Error('Room is full');
    }

    // Check if user already in room
    const alreadyJoined = activeParticipants.some(p => p.user_id === userId);
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
                user_id: userId,
                username: username
            })
        });

        if (fetchResponse.ok) {
            console.log('joinRoom: Successfully joined room');
            return { data: room };
        } else {
            const errorText = await fetchResponse.text();
            console.error('joinRoom: Failed to join:', errorText);
            throw new Error('Failed to join room');
        }
    } catch (e) {
        console.error('joinRoom: Error:', e);
        throw e;
    }
};

// Leave room
export const leaveRoom = async (roomId) => {
    console.log('leaveRoom: Called for room:', roomId);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const authData = localStorage.getItem('supabase.auth.token');
    let userId = null;
    let accessToken = supabaseAnonKey;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            userId = parsed.user?.id;
            accessToken = parsed.access_token || supabaseAnonKey;
        } catch (e) {
            console.error('leaveRoom: Could not parse auth');
        }
    }

    if (!userId) throw new Error('No user logged in');

    try {
        console.log('leaveRoom: Using REST API PATCH...');
        const response = await fetch(`${supabaseUrl}/rest/v1/room_participants?room_id=eq.${roomId}&user_id=eq.${userId}&left_at=is.null`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ left_at: new Date().toISOString() })
        });

        if (response.ok || response.status === 204) {
            console.log('leaveRoom: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('leaveRoom: Failed:', response.status, errorText);
            throw new Error('Failed to leave room');
        }
    } catch (e) {
        console.error('leaveRoom: Error:', e);
        throw e;
    }
};

// Delete room (creator only, waiting status only)
export const deleteRoom = async (roomId) => {
    console.log('deleteRoom: Called for room:', roomId);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get access token from localStorage
    const authData = localStorage.getItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
    let accessToken = supabaseAnonKey;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            accessToken = parsed.access_token || supabaseAnonKey;
            console.log('deleteRoom: Using authenticated token');
        } catch (e) {
            console.warn('deleteRoom: Using anon key');
        }
    }

    try {
        console.log('deleteRoom: Attempting delete via REST API...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`, {
            method: 'DELETE',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=minimal'
            }
        });

        if (fetchResponse.ok || fetchResponse.status === 204) {
            console.log('deleteRoom: Delete successful');
            return { data: { success: true } };
        } else {
            const errorText = await fetchResponse.text();
            console.error('deleteRoom: Delete FAILED:', fetchResponse.status, errorText);
            throw new Error(errorText || 'Failed to delete room');
        }
    } catch (e) {
        console.error('deleteRoom: Error:', e);
        throw e;
    }
};

// Get room details
export const getRoomDetails = async (roomId) => {
    console.log('getRoomDetails: Called for room:', roomId);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        console.log('Attempting direct REST fetch for getRoomDetails...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}&select=*,room_participants(id,user_id,username,joined_at,is_ready,left_at),problems(id,title,difficulty)`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData && fetchData.length > 0) {
                const data = fetchData[0];
                console.log('Direct fetch getRoomDetails SUCCESS:', data);

                // Filter out participants who left
                if (data) {
                    data.room_participants = data.room_participants?.filter(p => !p.left_at) || [];
                }

                return { data };
            } else {
                console.error('getRoomDetails: Room not found');
                throw new Error('Room not found');
            }
        } else {
            const errorText = await fetchResponse.text();
            console.error('Direct fetch FAILED:', fetchResponse.status, errorText);
            throw new Error('Failed to fetch room details');
        }
    } catch (e) {
        console.error('Error fetching room details:', e);
        throw e;
    }
};

// Update ready status
export const updateReadyStatus = async (roomId, isReady) => {
    console.log('updateReadyStatus: Called for room:', roomId, 'isReady:', isReady);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const authData = localStorage.getItem('supabase.auth.token');
    let userId = null;
    let accessToken = supabaseAnonKey;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            userId = parsed.user?.id;
            accessToken = parsed.access_token || supabaseAnonKey;
        } catch (e) {
            console.error('updateReadyStatus: Could not parse auth');
        }
    }

    if (!userId) throw new Error('No user logged in');

    try {
        console.log('updateReadyStatus: Using REST API PATCH...');
        const response = await fetch(`${supabaseUrl}/rest/v1/room_participants?room_id=eq.${roomId}&user_id=eq.${userId}&left_at=is.null`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ is_ready: isReady })
        });

        if (response.ok || response.status === 204) {
            console.log('updateReadyStatus: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('updateReadyStatus: Failed:', response.status, errorText);
            throw new Error('Failed to update ready status');
        }
    } catch (e) {
        console.error('updateReadyStatus: Error:', e);
        throw e;
    }
};

// Start room (creator only)
export const startRoom = async (roomId) => {
    console.log('Starting room:', roomId);

    const authData = localStorage.getItem('supabase.auth.token');
    let userId = null;

    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            userId = parsed.user?.id;
        } catch (e) {
            console.error('startRoom: Could not parse auth');
        }
    }

    if (!userId) throw new Error('No user logged in');

    // Get room to verify creator - using REST API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const authData2 = localStorage.getItem('supabase.auth.token');
    let accessToken = supabaseAnonKey;
    if (authData2) {
        try {
            const parsed = JSON.parse(authData2);
            accessToken = parsed.access_token || supabaseAnonKey;
        } catch (e) { }
    }

    console.log('Fetching room details via REST API...');
    const roomResponse = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}&select=created_by,problem_selection_mode,problem_id`, {
        headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!roomResponse.ok) {
        const errorText = await roomResponse.text();
        console.error('Error fetching room:', errorText);
        throw new Error('Failed to fetch room details');
    }

    const roomData = await roomResponse.json();
    if (!roomData || roomData.length === 0) {
        throw new Error('Room not found');
    }

    const room = roomData[0];
    console.log('Room data:', room);

    if (room.created_by !== userId) {
        throw new Error('Only room creator can start the room');
    }

    // If random mode, select a random problem
    let problemId = null;
    if (room.problem_selection_mode === 'random') {
        console.log('Selecting random problem via REST API...');
        const problemsResponse = await fetch(`${supabaseUrl}/rest/v1/problems?select=id`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!problemsResponse.ok) {
            console.error('Error fetching problems');
            throw new Error('Failed to fetch problems for random selection');
        }

        const problems = await problemsResponse.json();
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

    // Reuse accessToken from earlier in function
    const response = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`, {
        method: 'PATCH',
        headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error('Error updating room:', errorText);
        throw new Error('Failed to start room');
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
export const getUserRooms = async (userId) => {
    console.log('getUserRooms: Function called with userId:', userId);

    if (!userId) {
        console.error('getUserRooms: No userId provided');
        throw new Error('No user ID provided');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
        console.log('Attempting direct REST fetch for user rooms...');
        const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/room_participants?user_id=eq.${userId}&select=room_id,joined_at,rooms(id,status,max_participants,created_at,created_by,problem_selection_mode,problems(title,difficulty))&left_at=is.null&order=joined_at.desc`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            console.log('Direct fetch user rooms SUCCESS:', fetchData);
            const rooms = fetchData.map(p => p.rooms);
            console.log('Extracted rooms:', rooms);
            return { data: rooms };
        } else {
            const errorText = await fetchResponse.text();
            console.error('Direct fetch FAILED:', fetchResponse.status, errorText);
            throw new Error('Failed to fetch rooms');
        }
    } catch (e) {
        console.error('Error fetching user rooms:', e);
        throw e;
    }
};
