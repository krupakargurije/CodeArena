import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserRooms, deleteRoom } from '../services/roomService';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Rooms = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState(null);
    const [roomToDelete, setRoomToDelete] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        fetchUserRooms();
    }, [isAuthenticated, navigate]);

    const fetchUserRooms = async () => {
        try {
            console.log('fetchUserRooms: Starting...');
            console.log('fetchUserRooms: User from Redux:', user);
            const response = await getUserRooms(user?.id);
            console.log('fetchUserRooms: Got response:', response);
            setRooms(response.data || []);
            console.log('fetchUserRooms: Set rooms:', response.data);
        } catch (error) {
            console.error('fetchUserRooms: Failed to fetch rooms:', error);
            console.error('fetchUserRooms: Error details:', error.message);
        } finally {
            console.log('fetchUserRooms: Setting loading to false');
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

    const handleDeleteRoom = async (roomId, e) => {
        e.stopPropagation();
        console.log('handleDeleteRoom: Called for room:', roomId);
        setRoomToDelete(roomId);
    };

    const confirmDelete = async () => {
        if (!roomToDelete) return;

        console.log('confirmDelete: Deleting room:', roomToDelete);
        setDeletingRoom(roomToDelete);
        try {
            await deleteRoom(roomToDelete);
            console.log('confirmDelete: Delete successful');
            await fetchUserRooms();
        } catch (error) {
            console.error('confirmDelete: Error:', error);
            alert(error.message || 'Failed to delete room');
        } finally {
            setDeletingRoom(null);
            setRoomToDelete(null);
        }
    };

    const cancelDelete = () => {
        console.log('cancelDelete: User cancelled');
        setRoomToDelete(null);
    };

    // Separate rooms into created and joined
    const createdRooms = rooms.filter(room => room.created_by === user?.id);
    const joinedRooms = rooms.filter(room => room.created_by !== user?.id);

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

                {/* My Created Rooms */}
                {createdRooms.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-primary mb-6">My Created Rooms ({createdRooms.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {createdRooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="card relative"
                                >
                                    {/* Creator Badge */}
                                    <div className="absolute top-4 right-4 px-2 py-1 rounded text-xs font-semibold bg-brand-orange/20 text-brand-orange">
                                        Creator
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-2xl font-bold text-primary">
                                            {room.id}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'waiting' ? 'dark:text-dark-text-primary text-light-text-primary border dark:border-dark-border-primary border-light-border-primary' :
                                            room.status === 'active' ? 'text-difficulty-easy border border-difficulty-easy' :
                                                'dark:text-dark-text-secondary text-light-text-secondary border dark:border-dark-border-primary border-light-border-primary'
                                            }`}>
                                            {room.status.toUpperCase()}
                                        </div>
                                    </div>

                                    {room.problems && (
                                        <div className="mb-4">
                                            <div className="font-semibold text-primary">{room.problems.title}</div>
                                            <div className={`text-sm ${room.problems.difficulty === 'EASY' ? 'text-difficulty-easy' :
                                                room.problems.difficulty === 'MEDIUM' ? 'text-difficulty-medium' :
                                                    'text-difficulty-hard'
                                                }`}>
                                                {room.problems.difficulty}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-secondary text-sm mb-4">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Max {room.max_participants} players</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                console.log('Rejoin button clicked for room:', room.id);
                                                console.log('Navigating to:', `/rooms/${room.id}/lobby`);
                                                try {
                                                    navigate(`/rooms/${room.id}/lobby`);
                                                    console.log('Navigate function called successfully');
                                                } catch (error) {
                                                    console.error('Navigation error:', error);
                                                }
                                            }}
                                            className="btn-primary flex-1 py-2 text-sm"
                                        >
                                            {room.status === 'waiting' ? 'Enter Lobby' : 'Rejoin'}
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteRoom(room.id, e)}
                                            disabled={deletingRoom === room.id}
                                            className="btn-secondary px-3 py-2 text-difficulty-hard hover:bg-difficulty-hard/10 disabled:opacity-50"
                                            title="Delete room"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Joined Rooms */}
                {joinedRooms.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-primary mb-6">Joined Rooms ({joinedRooms.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {joinedRooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => navigate(`/rooms/${room.id}/lobby`)}
                                    className="card cursor-pointer hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-2xl font-bold text-primary">
                                            {room.id}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'waiting' ? 'dark:text-dark-text-primary text-light-text-primary border dark:border-dark-border-primary border-light-border-primary' :
                                            room.status === 'active' ? 'text-difficulty-easy border border-difficulty-easy' :
                                                'dark:text-dark-text-secondary text-light-text-secondary border dark:border-dark-border-primary border-light-border-primary'
                                            }`}>
                                            {room.status.toUpperCase()}
                                        </div>
                                    </div>

                                    {room.problems && (
                                        <div className="mb-3">
                                            <div className="font-semibold text-primary">{room.problems.title}</div>
                                            <div className={`text-sm ${room.problems.difficulty === 'EASY' ? 'text-difficulty-easy' :
                                                room.problems.difficulty === 'MEDIUM' ? 'text-difficulty-medium' :
                                                    'text-difficulty-hard'
                                                }`}>
                                                {room.problems.difficulty}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-secondary text-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span>Max {room.max_participants} players</span>
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

            {/* Delete Confirmation Modal */}
            {roomToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-2xl p-8 max-w-md w-full border dark:border-dark-border-primary border-light-border-primary">
                        <h2 className="text-2xl font-bold text-primary mb-4">Delete Room?</h2>
                        <p className="text-secondary mb-6">
                            Are you sure you want to delete room <span className="font-bold text-primary">{roomToDelete}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={cancelDelete}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deletingRoom === roomToDelete}
                                className="btn-primary flex-1 bg-difficulty-hard hover:bg-difficulty-hard/80"
                            >
                                {deletingRoom === roomToDelete ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
