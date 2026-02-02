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

        // Subscribe to real-time updates (Supabase)
        const channel = subscribeToRoom(roomId, () => {
            fetchRoomDetails();
        });

        // POLLING: Fetch updates every 3 seconds to sync with backend (H2)
        // This is necessary because Supabase Realtime doesn't see H2 updates
        const pollInterval = setInterval(() => {
            fetchRoomDetails();
        }, 3000);

        return () => {
            channel.unsubscribe();
            clearInterval(pollInterval);
        };
    }, [roomId]);

    useEffect(() => {
        // Redirect to problem if room becomes active
        if (room?.status === 'active') {
            navigate(`/rooms/${roomId}/problem`);
        }
    }, [room?.status, roomId, navigate]);

    const fetchRoomDetails = async () => {
        // ... existing code ...
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
            // Refresh room data to update participants list
            await fetchRoomDetails();
        } catch (error) {
            console.error('handleToggleReady: Failed:', error);
        }
    };

    const handleStart = async () => {
        console.log('handleStart: Clicked');
        setStarting(true);
        try {
            console.log('handleStart: Calling startRoom...');
            const response = await startRoom(roomId);
            console.log('handleStart: Success', response);

            // Navigate immediately if successful
            if (response.data && response.data.success) {
                navigate(`/rooms/${roomId}/problem`);
            }
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
        <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Room Header */}
                <div className="glass-panel rounded-2xl p-8 mb-8 border border-white/5 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                    <div className="relative text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-blue/20 mb-6 shadow-lg shadow-black/20">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                            Room {roomId}
                        </h1>
                        <p className="text-dark-text-secondary text-lg">Waiting for players to join...</p>
                    </div>

                    {/* Room Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                            <div>
                                <div className="text-dark-text-tertiary text-sm font-medium mb-1">Participants</div>
                                <div className="text-2xl font-bold text-white">
                                    {participants.length} <span className="text-dark-text-tertiary text-lg font-normal">/ {room.max_participants}</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-dark-bg-tertiary flex items-center justify-center text-dark-text-secondary group-hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                            <div>
                                <div className="text-dark-text-tertiary text-sm font-medium mb-1">Mode</div>
                                <div className="text-2xl font-bold text-white capitalize">
                                    {room.problem_selection_mode === 'random' ? 'Random Problem' : 'Single Problem'}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-dark-bg-tertiary flex items-center justify-center text-dark-text-secondary group-hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Selected Problem */}
                    {room.problems && (
                        <div className="bg-gradient-to-r from-brand-blue/10 to-transparent rounded-xl p-5 border border-brand-blue/20 mb-6">
                            <div className="text-brand-blue text-xs font-bold uppercase tracking-wider mb-2">Selected Challenge</div>
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-bold text-white">
                                    {room.problems.title}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${room.problems.difficulty === 'EASY' ? 'bg-difficulty-easy/10 text-difficulty-easy border-difficulty-easy/20' :
                                        room.problems.difficulty === 'MEDIUM' ? 'bg-difficulty-medium/10 text-difficulty-medium border-difficulty-medium/20' :
                                            'bg-difficulty-hard/10 text-difficulty-hard border-difficulty-hard/20'
                                    }`}>
                                    {room.problems.difficulty}
                                </div>
                            </div>
                        </div>
                    )}

                    {room.problem_selection_mode === 'random' && !room.problems && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">A random problem will be auto-selected when you start.</span>
                        </div>
                    )}
                </div>

                {/* Participants List */}
                <div className="glass-panel rounded-2xl p-8 mb-8 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Lobby</h2>
                        <span className="text-sm text-dark-text-tertiary bg-white/5 px-3 py-1 rounded-full">
                            {participants.filter(p => p.is_ready).length} / {participants.length} Ready
                        </span>
                    </div>
                    <div className="space-y-3">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center shadow-lg shadow-brand-orange/10 text-white font-bold text-lg">
                                        {participant.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {participant.username}
                                            {participant.user_id === room.created_by && (
                                                <span className="text-[10px] font-bold bg-brand-orange/20 text-brand-orange px-1.5 py-0.5 rounded border border-brand-orange/20 uppercase tracking-wide">HOST</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-dark-text-tertiary">
                                            Joined {new Date(participant.joined_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {participant.is_ready ? (
                                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/10 font-medium text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Ready
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-dark-text-tertiary bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-medium text-sm">
                                            <div className="w-2 h-2 rounded-full bg-dark-text-tertiary animate-pulse" />
                                            Waiting...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={handleToggleReady}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isReady
                            ? 'bg-dark-bg-tertiary hover:bg-dark-bg-elevated border border-white/5'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-lg shadow-green-500/20'
                            }`}
                    >
                        {isReady ? 'Cancel Ready' : 'I\'m Ready'}
                    </button>

                    {isCreator && (
                        <button
                            onClick={handleStart}
                            disabled={!canStart || starting}
                            className={`w-full sm:w-auto btn-primary py-3.5 px-10 text-lg ${!canStart && 'opacity-50 cursor-not-allowed filter grayscale'}`}
                        >
                            {starting ? 'Starting...' : 'Start Game'}
                        </button>
                    )}

                    <button
                        onClick={handleLeave}
                        className="w-full sm:w-auto px-8 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                    >
                        Leave Room
                    </button>
                </div>

                {!allReady && isCreator && (
                    <div className="text-center mt-6 text-dark-text-tertiary text-sm animate-pulse">
                        Waiting for all players to be ready...
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomLobby;
