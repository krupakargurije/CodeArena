import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserRooms } from '../services/roomService';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Rooms = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        fetchUserRooms();
    }, [isAuthenticated, navigate]);

    const fetchUserRooms = async () => {
        try {
            const response = await getUserRooms();
            setRooms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomCreated = (roomId) => {
        setShowCreateModal(false);
        navigate(`/rooms/${roomId}/lobby`);
    };

    const handleRoomJoined = (roomId) => {
        setShowJoinModal(false);
        navigate(`/rooms/${roomId}/lobby`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-primary-400 text-xl">Loading rooms...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-primary">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold gradient-text mb-4">
                        Multiplayer Rooms
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Create or join a room to solve problems with friends
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-6 justify-center mb-12">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary text-lg px-8 py-4 flex items-center gap-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Room
                    </button>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="btn-secondary text-lg px-8 py-4 flex items-center gap-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Join Room
                    </button>
                </div>

                {/* Active Rooms */}
                {rooms.length > 0 && (
                    <div className="glass rounded-2xl p-8 border border-primary-500/20">
                        <h2 className="text-2xl font-bold text-gray-100 mb-6">Your Active Rooms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => navigate(`/rooms/${room.id}/lobby`)}
                                    className="bg-dark-tertiary rounded-xl p-6 cursor-pointer hover:bg-dark-tertiary/80 transition-all border border-primary-500/20 hover:border-primary-500/40"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-2xl font-bold text-primary-400">
                                            {room.id}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                                                room.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {room.status.toUpperCase()}
                                        </div>
                                    </div>

                                    {room.problems && (
                                        <div className="mb-3">
                                            <div className="text-gray-100 font-semibold">{room.problems.title}</div>
                                            <div className={`text-sm ${room.problems.difficulty === 'EASY' ? 'text-accent-green' :
                                                    room.problems.difficulty === 'MEDIUM' ? 'text-yellow-400' :
                                                        'text-accent-red'
                                                }`}>
                                                {room.problems.difficulty}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Max {room.max_participants} players</span>
                                    </div>

                                    <div className="mt-4 text-xs text-gray-500">
                                        Created {new Date(room.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {rooms.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-4">
                            You haven't joined any rooms yet
                        </div>
                        <div className="text-gray-500">
                            Create a new room or join an existing one to get started!
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    onRoomCreated={handleRoomCreated}
                />
            )}

            {showJoinModal && (
                <JoinRoomModal
                    onClose={() => setShowJoinModal(false)}
                    onRoomJoined={handleRoomJoined}
                />
            )}
        </div>
    );
};

export default Rooms;
