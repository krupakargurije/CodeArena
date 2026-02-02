import { supabase } from './supabaseClient';

// Spring backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper to get current user info from localStorage
const getCurrentUser = () => {
    const authData = localStorage.getItem('supabase.auth.token');
    if (!authData) return null;

    try {
        const parsed = JSON.parse(authData);
        return {
            id: parsed.user?.id,
            username: parsed.user?.user_metadata?.username || parsed.user?.email?.split('@')[0] || 'User'
        };
    } catch (e) {
        console.error('Could not parse auth data');
        return null;
    }
};

// Generate unique 6-character room ID (kept for compatibility, but backend generates it now)
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
    console.log('createRoom: Starting via Spring backend...');

    const user = getCurrentUser();
    if (!user?.id) {
        console.error('createRoom: No user logged in');
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms?userId=${user.id}&username=${encodeURIComponent(user.username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                problemId: roomData.problemId || null,
                problemSelectionMode: roomData.problemSelectionMode,
                maxParticipants: roomData.maxParticipants,
                isPrivate: roomData.isPrivate
            })
        });

        if (response.ok) {
            const room = await response.json();
            console.log('createRoom: Success', room);
            return { data: room };
        } else {
            const errorText = await response.text();
            console.error('createRoom: Failed:', response.status, errorText);
            throw new Error('Failed to create room: ' + errorText);
        }
    } catch (e) {
        console.error('createRoom error:', e);
        throw e;
    }
};

// Random join room
export const randomJoinRoom = async (preferences = {}) => {
    console.log('randomJoinRoom: Called', preferences);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/random-join?userId=${user.id}&username=${encodeURIComponent(user.username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferences)
        });

        if (response.ok) {
            const room = await response.json();
            console.log('randomJoinRoom: Success', room);
            return { data: room };
        } else {
            const errorText = await response.text();
            console.error('randomJoinRoom: Failed:', response.status, errorText);
            throw new Error('Failed to join random room: ' + errorText);
        }
    } catch (e) {
        console.error('randomJoinRoom error:', e);
        throw e;
    }
};

// Join existing room
export const joinRoom = async (roomId) => {
    console.log('joinRoom: Called for room:', roomId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId.toUpperCase()}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: user.id,
                username: user.username
            })
        });

        if (response.ok) {
            const room = await response.json();
            console.log('joinRoom: Success', room);
            return { data: room };
        } else {
            const errorText = await response.text();
            console.error('joinRoom: Failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to join room');
        }
    } catch (e) {
        console.error('joinRoom error:', e);
        throw e;
    }
};

// Leave room
export const leaveRoom = async (roomId) => {
    console.log('leaveRoom: Called for room:', roomId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
        });

        if (response.ok) {
            console.log('leaveRoom: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('leaveRoom: Failed:', response.status, errorText);
            throw new Error('Failed to leave room');
        }
    } catch (e) {
        console.error('leaveRoom error:', e);
        throw e;
    }
};

// Delete room (creator only, waiting status only)
export const deleteRoom = async (roomId) => {
    console.log('deleteRoom: Called for room:', roomId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}?userId=${user.id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('deleteRoom: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('deleteRoom: Failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to delete room');
        }
    } catch (e) {
        console.error('deleteRoom error:', e);
        throw e;
    }
};

// Get room details
export const getRoomDetails = async (roomId) => {
    console.log('getRoomDetails: Called for room:', roomId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`);

        if (response.ok) {
            const room = await response.json();
            console.log('getRoomDetails: Success', room);

            // Transform participants from camelCase to snake_case
            const transformedParticipants = (room.roomParticipants || []).map(p => ({
                ...p,
                user_id: p.userId,
                is_ready: p.isReady,
                joined_at: p.joinedAt,
                left_at: p.leftAt
            }));

            // Transform response to match expected frontend format
            const data = {
                ...room,
                room_participants: transformedParticipants,
                created_by: room.createdBy,
                problem_id: room.problemId,
                problem_selection_mode: room.problemSelectionMode,
                max_participants: room.maxParticipants,
                is_private: room.isPrivate,
                started_at: room.startedAt,
                created_at: room.createdAt
            };

            return { data };
        } else {
            const errorText = await response.text();
            console.error('getRoomDetails: Failed:', response.status, errorText);
            throw new Error('Room not found');
        }
    } catch (e) {
        console.error('getRoomDetails error:', e);
        throw e;
    }
};

// Update ready status
export const updateReadyStatus = async (roomId, isReady) => {
    console.log('updateReadyStatus: Called for room:', roomId, 'isReady:', isReady);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/ready`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id, isReady })
        });

        if (response.ok) {
            console.log('updateReadyStatus: Success');
            return { data: { success: true } };
        } else {
            const errorText = await response.text();
            console.error('updateReadyStatus: Failed:', response.status, errorText);
            throw new Error('Failed to update ready status');
        }
    } catch (e) {
        console.error('updateReadyStatus error:', e);
        throw e;
    }
};

// Start room (creator only)
export const startRoom = async (roomId) => {
    console.log('Starting room:', roomId);

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
        });

        if (response.ok) {
            const room = await response.json();
            console.log('startRoom: Success', room);
            return { data: { success: true, problemId: room.problemId } };
        } else {
            const errorText = await response.text();
            console.error('startRoom: Failed:', response.status, errorText);
            throw new Error(errorText || 'Failed to start room');
        }
    } catch (e) {
        console.error('startRoom error:', e);
        throw e;
    }
};

// Subscribe to room updates (Realtime) - Still uses Supabase
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

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/user/${userId}`);

        if (response.ok) {
            const rooms = await response.json();
            console.log('getUserRooms: Success', rooms);

            // Transform to match expected format
            const transformedRooms = rooms.map(room => ({
                ...room,
                created_by: room.createdBy,
                problem_id: room.problemId,
                max_participants: room.maxParticipants,
                problem_selection_mode: room.problemSelectionMode,
                is_private: room.isPrivate,
                created_at: room.createdAt
            }));

            return { data: transformedRooms };
        } else {
            const errorText = await response.text();
            console.error('getUserRooms: Failed:', response.status, errorText);
            throw new Error('Failed to fetch rooms');
        }
    } catch (e) {
        console.error('getUserRooms error:', e);
        throw e;
    }
};

// Get all public rooms
export const getPublicRooms = async () => {
    console.log('getPublicRooms: Called');

    const user = getCurrentUser();
    if (!user?.id) {
        throw new Error('No user logged in');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/public`);

        if (response.ok) {
            const rooms = await response.json();
            console.log('getPublicRooms: Success', rooms);

            // Transform to match expected format
            const transformedRooms = rooms.map(room => ({
                ...room,
                created_by: room.createdBy,
                problem_id: room.problemId,
                max_participants: room.maxParticipants,
                problem_selection_mode: room.problemSelectionMode,
                is_private: room.isPrivate,
                created_at: room.createdAt
            }));

            return { data: transformedRooms };
        } else {
            const errorText = await response.text();
            console.error('getPublicRooms: Failed:', response.status, errorText);
            throw new Error('Failed to fetch public rooms');
        }
    } catch (e) {
        console.error('getPublicRooms error:', e);
        throw e;
    }
};
