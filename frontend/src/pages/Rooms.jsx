import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserRooms, deleteRoom, randomJoinRoom, getPublicRooms, joinRoom } from '../services/roomService';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Rooms = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [rooms, setRooms] = useState([]);
    const [publicRooms, setPublicRooms] = useState([]);
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState(null);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const [joiningRandom, setJoiningRandom] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        // Update time every second for live countdown
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user, navigate]);

    const getExpiryTime = (createdAt) => {
        if (!createdAt) return null;
        const created = new Date(createdAt).getTime();
        const expires = created + 75 * 60 * 1000; // 75 minutes
        const diff = expires - currentTime;

        if (diff <= 0) return 'Expired';

        const totalSeconds = Math.floor(diff / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchUserRooms(), fetchPublicRooms()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicRooms = async () => {
        try {
            const response = await getPublicRooms();
            setPublicRooms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch public rooms:', error);
        }
    };

    const fetchUserRooms = async () => {
        try {
            if (!user?.id) return;
            const response = await getUserRooms(user?.id);
            setRooms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
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
        setRoomToDelete(roomId);
    };

    const confirmDelete = async () => {
        if (!roomToDelete) return;
        setDeletingRoom(roomToDelete);
        try {
            await deleteRoom(roomToDelete);
            await Promise.all([fetchUserRooms(), fetchPublicRooms()]);
        } catch (error) {
            alert(error.message || 'Failed to delete room');
        } finally {
            setDeletingRoom(null);
            setRoomToDelete(null);
        }
    };

    const cancelDelete = () => {
        setRoomToDelete(null);
    };

    const handleRandomJoin = async () => {
        try {
            setJoiningRandom(true);
            const response = await randomJoinRoom();
            navigate(`/rooms/${response.data.id}/lobby`);
        } catch (error) {
            alert('Failed to find a room. Please try again or create one.');
        } finally {
            setJoiningRandom(false);
        }
    };

    const handleJoinPublicRoom = async (roomId) => {
        try {
            await joinRoom(roomId);
            navigate(`/rooms/${roomId}/lobby`);
        } catch (error) {
            alert(error.message || 'Failed to join room');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>My Rooms</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Private spaces for group practice and mini-contests (mock UI).
                    </p>
                </div>

                {/* Main Content - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Rooms List - 2 columns */}
                    <div className="lg:col-span-2">
                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/20"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Room
                            </button>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Join with Code
                            </button>
                            <button
                                onClick={handleRandomJoin}
                                disabled={joiningRandom}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {joiningRandom ? 'Finding...' : 'Random Join'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-6 mb-6 border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'my'
                                    ? ''
                                    : 'hover:opacity-100'
                                    }`}
                                style={{ color: activeTab === 'my' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                            >
                                My Rooms
                                {activeTab === 'my' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('global')}
                                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'global'
                                    ? ''
                                    : 'hover:opacity-100'
                                    }`}
                                style={{ color: activeTab === 'global' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                            >
                                Global Rooms
                                {activeTab === 'global' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
                                )}
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                            {activeTab === 'my' ? (
                                /* MY ROOMS LIST */
                                rooms.length > 0 ? (
                                    rooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className="rounded-xl p-3 transition-all group"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                            R-{String(room.id).slice(0, 4).toUpperCase()}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.status === 'waiting'
                                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            }`}>
                                                            {room.problem_selection_mode === 'random' ? 'Practice' : 'Contest'}
                                                        </span>
                                                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.is_private
                                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            : ''
                                                            }`}
                                                            style={!room.is_private ? { background: 'var(--bg-primary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' } : {}}
                                                        >
                                                            {room.is_private ? (
                                                                <>
                                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                    Private
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Public
                                                                </>
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {getExpiryTime(room.created_at) || 'Active'}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-medium text-sm truncate pr-4" style={{ color: 'var(--text-primary)' }}>
                                                        {room.problems?.title || 'Room ' + room.id.slice(0, 8)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                            {room.participants?.length || 1}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {String(room.created_by) === String(user?.id) && (
                                                        <button
                                                            onClick={(e) => handleDeleteRoom(room.id, e)}
                                                            className="p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            style={{ color: 'var(--text-tertiary)' }}
                                                            title="Delete Room"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/rooms/${room.id}/lobby`)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                                    >
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                        <div className="text-4xl mb-4">🚀</div>
                                        <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No rooms yet</h3>
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Create your first room to get started!</p>
                                    </div>
                                )
                            ) : (
                                /* GLOBAL ROOMS LIST */
                                publicRooms.length > 0 ? (
                                    publicRooms.map((room) => {
                                        const isMyRoom = rooms.some(r => r.id === room.id);
                                        // Find host username from participants list
                                        const host = room.roomParticipants?.find(p => String(p.userId) === String(room.createdBy));
                                        const hostName = host ? host.username : (room.createdBy === user?.id ? 'You' : 'Unknown');

                                        return (
                                            <div
                                                key={room.id}
                                                className="rounded-xl p-3 transition-all"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                                R-{String(room.id).slice(0, 4).toUpperCase()}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.status === 'waiting'
                                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                }`}>
                                                                {room.problem_selection_mode === 'random' ? 'Practice' : 'Contest'}
                                                            </span>
                                                            {isMyRoom && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                                    Joined
                                                                </span>
                                                            )}
                                                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${room.is_private
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                : ''
                                                                }`}
                                                                style={!room.is_private ? { background: 'var(--bg-primary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' } : {}}
                                                            >
                                                                {room.is_private ? (
                                                                    <>
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                        </svg>
                                                                        Private
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Public
                                                                    </>
                                                                )}
                                                            </span>
                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {getExpiryTime(room.created_at) || 'Active'}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-medium text-sm truncate pr-4" style={{ color: 'var(--text-primary)' }}>
                                                            {room.problems?.title || 'Room ' + room.id.slice(0, 8)}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                                </svg>
                                                                {room.participants?.length || room.roomParticipants?.length || 1}
                                                            </div>
                                                            <span style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>|</span>
                                                            <span>
                                                                Host: <span className="opacity-80" style={{ color: 'var(--text-secondary)' }}>{hostName}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isMyRoom ? (
                                                        <button
                                                            onClick={() => navigate(`/rooms/${room.id}/lobby`)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                                        >
                                                            Open
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleJoinPublicRoom(room.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-medium hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/20"
                                                        >
                                                            Join
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                        <div className="text-4xl mb-4">🌍</div>
                                        <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No global rooms</h3>
                                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Create a public room to see it here!</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Room Tips Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl p-6 sticky top-24" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Room tips</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Keep it fast and focused.</p>

                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                    Use sprints (25m) for warmups.
                                </li>
                                <li className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                    Share a single template per topic.
                                </li>
                                <li className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                    Review wrong submissions together.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="CodeArena" className="w-6 h-6" />
                            <div>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>CodeArena</span>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fast, minimal competitive coding.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            <a href="#" className="hover:text-white transition-colors">Docs</a>
                            <a href="#" className="hover:text-white transition-colors">Status</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="https://github.com/krupakargurije?tab=overview&from=2026-01-01&to=2026-01-31" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                GitHub
                            </a>
                        </div>
                    </div>
                </footer>
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
                    <div className="rounded-2xl p-8 max-w-md w-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Delete Room?</h2>
                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Are you sure you want to delete this room? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deletingRoom === roomToDelete}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50"
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
