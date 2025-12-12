import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomDetails, leaveRoom, updateReadyStatus, startRoom, subscribeToRoom } from '../services/roomService';
import { useSelector } from 'react-redux';

const RoomLobby = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        fetchRoomDetails();

        // Subscribe to real-time updates
        const channel = subscribeToRoom(roomId, () => {
            fetchRoomDetails();
        });

        return () => {
            channel.unsubscribe();
        };
    }, [roomId]);

    useEffect(() => {
        // Redirect to problem if room becomes active
        if (room?.status === 'active') {
            navigate(`/rooms/${roomId}/problem`);
        }
    }, [room?.status, roomId, navigate]);

    const fetchRoomDetails = async () => {
        try {
            const response = await getRoomDetails(roomId);
            setRoom(response.data);
            setParticipants(response.data.room_participants || []);

            // Check if current user is ready
            const currentUser = response.data.room_participants?.find(p => p.user_id === user?.id);
            if (currentUser) {
                setIsReady(currentUser.is_ready);
            }
        } catch (error) {
            console.error('Failed to fetch room details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReady = async () => {
        console.log('handleToggleReady: Clicked, current isReady:', isReady);
        try {
            console.log('handleToggleReady: Calling updateReadyStatus...');
            await updateReadyStatus(roomId, !isReady);
            console.log('handleToggleReady: Success');
            setIsReady(!isReady);
        } catch (error) {
            console.error('handleToggleReady: Failed:', error);
        }
    };

    const handleStart = async () => {
        console.log('handleStart: Clicked');
        setStarting(true);
        try {
            console.log('handleStart: Calling startRoom...');
            await startRoom(roomId);
            console.log('handleStart: Success');
            // Will redirect via useEffect when room status changes
        } catch (error) {
            console.error('handleStart: Failed:', error);
            alert(error.message);
            setStarting(false);
        }
    };

    const handleLeave = async () => {
        console.log('handleLeave: Clicked');
        try {
            console.log('handleLeave: Calling leaveRoom...');
            await leaveRoom(roomId);
            console.log('handleLeave: Success, navigating to /rooms');
            navigate('/rooms');
        } catch (error) {
            console.error('handleLeave: Failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-primary-400 text-xl">Loading room...</div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">Room not found</div>
                    <button onClick={() => navigate('/rooms')} className="btn-primary">
                        Back to Rooms
                    </button>
                </div>
            </div>
        );
    }

    const isCreator = room.created_by === user?.id;
    const allReady = participants.length > 0 && participants.every(p => p.is_ready);
    const canStart = isCreator && allReady && participants.length >= 1;

    return (
        <div className="min-h-screen bg-dark-primary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Room Header */}
                <div className="glass rounded-2xl p-8 mb-8 border border-primary-500/20">
                    <div className="text-center mb-6">
                        <h1 className="text-5xl font-bold gradient-text mb-2">
                            Room {roomId}
                        </h1>
                        <p className="text-gray-400">Share this code with your friends to join</p>
                    </div>

                    {/* Room Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-dark-tertiary rounded-lg p-4 text-center">
                            <div className="text-gray-400 text-sm mb-1">Participants</div>
                            <div className="text-2xl font-bold text-primary-400">
                                {participants.length} / {room.max_participants}
                            </div>
                        </div>
                        <div className="bg-dark-tertiary rounded-lg p-4 text-center">
                            <div className="text-gray-400 text-sm mb-1">Mode</div>
                            <div className="text-2xl font-bold text-primary-400">
                                {room.problem_selection_mode === 'random' ? 'Random' : 'Single'}
                            </div>
                        </div>
                    </div>

                    {/* Selected Problem */}
                    {room.problems && (
                        <div className="bg-dark-tertiary rounded-lg p-4 mb-6">
                            <div className="text-gray-400 text-sm mb-2">Selected Problem</div>
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-semibold text-gray-100">
                                    {room.problems.title}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${room.problems.difficulty === 'EASY' ? 'bg-accent-green/20 text-accent-green' :
                                    room.problems.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-accent-red/20 text-accent-red'
                                    }`}>
                                    {room.problems.difficulty}
                                </div>
                            </div>
                        </div>
                    )}

                    {room.problem_selection_mode === 'random' && !room.problems && (
                        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg mb-6">
                            A random problem will be selected when the room starts
                        </div>
                    )}
                </div>

                {/* Participants List */}
                <div className="glass rounded-2xl p-8 mb-8 border border-primary-500/20">
                    <h2 className="text-2xl font-bold text-gray-100 mb-6">Participants</h2>
                    <div className="space-y-3">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="bg-dark-tertiary rounded-lg p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">
                                            {participant.username?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-100">
                                            {participant.username}
                                            {participant.user_id === room.created_by && (
                                                <span className="ml-2 text-xs bg-primary-600 px-2 py-1 rounded">HOST</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Joined {new Date(participant.joined_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {participant.is_ready ? (
                                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold">
                                            Ready
                                        </span>
                                    ) : (
                                        <span className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg">
                                            Not Ready
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleToggleReady}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all ${isReady
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isReady ? 'Not Ready' : 'Ready'}
                    </button>

                    {isCreator && (
                        <button
                            onClick={handleStart}
                            disabled={!canStart || starting}
                            className="btn-primary px-8 py-3 disabled:opacity-50"
                        >
                            {starting ? 'Starting...' : 'Start Game'}
                        </button>
                    )}

                    <button
                        onClick={handleLeave}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Leave Room
                    </button>
                </div>

                {!allReady && isCreator && (
                    <div className="text-center mt-4 text-gray-400">
                        Waiting for all participants to be ready...
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomLobby;
