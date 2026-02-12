import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { randomJoinRoom } from '../services/roomService';
import { getGlobalStats } from '../services/statsService';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joiningRandom, setJoiningRandom] = useState(false);
    const [stats, setStats] = useState({
        activePlayers: 0,
        activeRooms: 0,
        totalUsers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getGlobalStats();
                if (response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
        // Poll every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowCreateModal(true);
    };

    const handleJoinClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowJoinModal(true);
    };

    const handleRandomJoin = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            setJoiningRandom(true);
            const response = await randomJoinRoom();
            navigate(`/rooms/${response.data.id}/lobby`);
        } catch (error) {
            console.error('Failed to random join:', error);
            alert('Failed to find a room. Please try again or create one.');
        } finally {
            setJoiningRandom(false);
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

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-page)' }}>
            {/* Dotted Grid Background */}
            <div className="fixed inset-0 dotted-grid opacity-60" />

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Content - Hero Section */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Tags */}
                        <div className="flex items-center gap-3">
                            <span className="tag-pill bg-green-500/20 border-green-500/30 text-green-400 text-xs animate-pulse">
                                ⚡ Live Battles
                            </span>
                            <span className="tag-pill tag-pill-accent">
                                Battle Royale
                            </span>
                            <span className="tag-pill tag-pill-dark">
                                1v1 · 2v2 · Free-for-all
                            </span>
                        </div>

                        {/* Hero Text */}
                        <div className="space-y-6">
                            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Code. Battle. <br />
                                <span className="bg-gradient-to-r from-brand-blue via-cyan-400 to-purple-500 bg-clip-text text-transparent">Dominate.</span>
                            </h1>
                            <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                                CodeArena is the ultimate <span className="font-medium" style={{ color: 'var(--text-primary)' }}>coding battle royale</span>.
                                Compete head-to-head with developers worldwide in real-time coding battles.
                                Create rooms, challenge friends, or jump into random matches — last coder standing wins.
                            </p>
                        </div>

                        {/* Battle Mode Highlight */}
                        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <div className="p-3 rounded-full bg-brand-blue/20 border border-brand-blue/30">
                                <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Arena Mode is LIVE</div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{stats.activePlayers} coders battling right now</div>
                            </div>
                            <button
                                onClick={handleRandomJoin}
                                disabled={joiningRandom}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                {joiningRandom ? 'Finding...' : 'Join Battle'}
                            </button>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={handleCreateClick}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/25"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Battle Room
                            </button>
                            <button
                                onClick={handleJoinClick}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                Join with Code
                            </button>
                            <button
                                onClick={handleRandomJoin}
                                disabled={joiningRandom}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                                </svg>
                                {joiningRandom ? 'Matching...' : 'Quick Match'}
                            </button>
                        </div>

                        {/* Battle Stats Row */}
                        <div className="flex items-center gap-10 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/10 border border-green-500/20">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div>
                                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.activePlayers || 0}</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Online Now</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.activeRooms || 0}</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active Battles</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.totalUsers || 0}</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Coders</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Battle Cards */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Live Battles Card */}
                        <div className="focus-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>⚔️ Live Battles</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Jump into action now</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-green-400 text-xs font-medium">156 Active</span>
                                </div>
                            </div>

                            {/* Active Battle Rooms */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl hover:border-brand-blue/30 transition-colors cursor-pointer group" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue/20 to-purple-500/20 flex items-center justify-center border border-brand-blue/30">
                                            <span className="text-lg">🏆</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Elite Arena #47</div>
                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>8/10 players · Starting in 2m</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-full bg-brand-blue text-white text-xs font-medium hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                        Join
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl hover:border-cyan-500/30 transition-colors cursor-pointer group" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                                            <span className="text-lg">⚡</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Speed Round</div>
                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>4/4 players · In progress</div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                                        Spectate
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl hover:border-purple-500/30 transition-colors cursor-pointer group" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                                            <span className="text-lg">👥</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>1v1 Duel</div>
                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>1/2 players · Waiting</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-full bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors opacity-0 group-hover:opacity-100">
                                        Challenge
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleRandomJoin}
                                disabled={joiningRandom}
                                className="w-full mt-4 py-2.5 rounded-full font-medium transition-all"
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                {joiningRandom ? 'Finding Match...' : '🎮 Quick Match - Join Random Battle'}
                            </button>
                        </div>

                        {/* Battle Stats Card */}
                        <div className="focus-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>🎖️ Your Battle Stats</h3>
                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                    +5 wins today
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>47</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Wins</div>
                                </div>
                                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>#128</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Global Rank</div>
                                </div>
                                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    <div className="text-2xl font-bold text-cyan-400">🔥 7</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Win Streak</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Win rate: 68% · Avg. solve time: 8m 32s
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Bento Grid Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Everything you need to level up
                    </h2>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        From practice problems to real-time contests, CodeArena has all the tools for competitive coding mastery.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Feature 1 - Large Card */}
                    <div className="lg:col-span-2 focus-card p-8 group hover:border-brand-blue/30 transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 rounded-xl bg-brand-blue/10 border border-brand-blue/20">
                                <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="tag-pill tag-pill-accent">Popular</span>
                        </div>
                        <h3 className="font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Multiplayer Arena Mode</h3>
                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Compete head-to-head with other developers in real-time coding battles. Create rooms, invite friends, or jump into random matches.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleCreateClick} className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                                Create room
                            </button>
                            <button onClick={handleRandomJoin} disabled={joiningRandom} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                {joiningRandom ? 'Finding...' : 'Quick match'}
                            </button>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="focus-card p-6 group hover:border-green-500/30 transition-all">
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 w-fit mb-4">
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>500+ Problems</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Curated problem sets across all difficulty levels. From arrays to advanced graph algorithms.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="focus-card p-6 group hover:border-purple-500/30 transition-all">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit mb-4">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Instant Feedback</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Get real-time feedback on your code. See execution time, memory usage, and detailed test results.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="focus-card p-6 group hover:border-yellow-500/30 transition-all">
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 w-fit mb-4">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>ELO Rating System</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Track your progress with a competitive rating. Climb the leaderboard and earn badges.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="focus-card p-6 group hover:border-cyan-500/30 transition-all">
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-fit mb-4">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Monaco Editor</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            VS Code-powered editor with syntax highlighting, autocomplete, and keyboard shortcuts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upcoming Contests Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Upcoming Contests</h2>
                        <p style={{ color: 'var(--text-tertiary)' }}>Join live competitions and test your skills</p>
                    </div>
                    <Link to="/leaderboard" className="text-brand-blue hover:text-blue-400 text-sm font-medium transition-colors">
                        View all →
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Weekly Arena #113', time: 'Tomorrow, 8:00 PM', duration: '90 min', participants: '1.2K', difficulty: 'Mixed' },
                        { name: 'Speed Coding Sprint', time: 'Sat, 3:00 PM', duration: '30 min', participants: '856', difficulty: 'Easy' },
                        { name: 'Algorithm Masters', time: 'Sun, 6:00 PM', duration: '2 hours', participants: '2.1K', difficulty: 'Hard' },
                    ].map((contest, i) => (
                        <div key={i} className="focus-card p-5 hover:border-brand-blue/30 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${contest.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    contest.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                    {contest.difficulty}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{contest.duration}</span>
                            </div>
                            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{contest.name}</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{contest.time}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {contest.participants} registered
                                </div>
                                <button className="px-3 py-1.5 rounded-lg bg-brand-blue/10 text-brand-blue text-xs font-medium hover:bg-brand-blue/20 transition-colors">
                                    Register
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Languages & Tech Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="focus-card p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Code in your favorite language
                            </h2>
                            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                                We support all major programming languages with optimized runtimes and accurate test results.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust', 'TypeScript', 'C#'].map(lang => (
                                    <span key={lang} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>~50ms</div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Avg. compile time</div>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>99.9%</div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Uptime</div>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>8+</div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Languages</div>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>24/7</div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Community Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Loved by developers</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Join thousands of coders improving every day</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { name: 'Alex Chen', role: 'Software Engineer', avatar: '👨‍💻', quote: 'The cleanest coding platform I\'ve used. No clutter, just code.' },
                        { name: 'Sarah Kim', role: 'CS Student', avatar: '👩‍🎓', quote: 'Arena mode is addictive! I practice twice as much now.' },
                        { name: 'Mike Johnson', role: 'Tech Lead', avatar: '👨‍💼', quote: 'We use CodeArena for team assessments. It\'s been a game changer.' },
                    ].map((testimonial, i) => (
                        <div key={i} className="focus-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-purple-500 flex items-center justify-center text-xl">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{testimonial.name}</div>
                                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{testimonial.role}</div>
                                </div>
                            </div>
                            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>"{testimonial.quote}"</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Footer Section */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="focus-card p-8 md:p-12 text-center bg-gradient-to-br from-brand-blue/10 to-purple-500/10 border-brand-blue/20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        Ready to start coding?
                    </h2>
                    <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Join CodeArena today and start your journey to becoming a better developer.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to={isAuthenticated ? "/problems" : "/signup"}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/25"
                        >
                            {isAuthenticated ? "Start practicing" : "Create free account"}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            to="/discuss"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all"
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        >
                            Join the community
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                        <div>
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>CodeArena</div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fast, minimal competitive coding.</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Link to="/problems" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>Problems</Link>
                        <Link to="/leaderboard" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>Leaderboard</Link>
                        <Link to="/discuss" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>Discuss</Link>
                        <a href="#" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>Docs</a>
                        <a href="https://github.com/krupakargurije?tab=overview&from=2026-01-01&to=2026-01-31" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>
                <div className="text-center mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    © 2024 CodeArena. All rights reserved.
                </div>
            </footer>

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

export default Home;
