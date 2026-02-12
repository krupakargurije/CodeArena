import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as userService from '../services/userService';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sample problems data
    const problems = [
        { id: 901, difficulty: 'Easy', title: 'Two Sum (Streaming)', acceptance: '56.8%', points: 100, tags: ['arrays', 'hashmap'] },
        { id: 814, difficulty: 'Easy', title: 'Balanced Brackets — Editor Mode', acceptance: '61.2%', points: 120, tags: ['stack', 'strings'] },
        { id: 878, difficulty: 'Medium', title: 'Graph Paths: K Shortest', acceptance: '42.1%', points: 240, tags: ['graphs', 'dijkstra'] },
        { id: 133, difficulty: 'Medium', title: 'Intervals: Merge + Min Removals', acceptance: '39.4%', points: 280, tags: ['greedy', 'sorting'] },
        { id: 201, difficulty: 'Hard', title: 'Bitmask DP: Team Formation', acceptance: '21.9%', points: 420, tags: ['dp', 'bitmask'] },
        { id: 258, difficulty: 'Hard', title: 'Persistent Segment Tree Queries', acceptance: '17.4%', points: 460, tags: ['segment tree', 'persistence'] },
    ];

    // Sample contests data
    const contests = [
        { id: 1, name: 'Weekly Arena #112', code: 'C-Weekly-112', startsIn: '3h 12m', duration: '1h 30m', joined: '18K' },
        { id: 2, name: 'IO Sprint Qualifier', code: 'C-IO-Qual', startsIn: 'tomorrow', duration: '2h', joined: '9.2K' },
        { id: 3, name: 'Night Owl Blitz', code: 'C-Night-Owl', startsIn: 'Fri 21:00', duration: '45m', joined: '6.1K' },
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await userService.getLeaderboard();
                setLeaderboard(response.data?.slice(0, 5) || []);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
                // Fallback data
                setLeaderboard([
                    { id: 1, username: 'neo', problemsSolved: 1312, rating: 2710, streak: 19 },
                    { id: 2, username: 'byteForge', problemsSolved: 1208, rating: 2634, streak: 11 },
                    { id: 3, username: 'kotlin_kid', problemsSolved: 1104, rating: 2579, streak: 28 },
                    { id: 4, username: 'segTree', problemsSolved: 1040, rating: 2492, streak: 9 },
                    { id: 5, username: 'pointer', problemsSolved: 998, rating: 2448, streak: 15 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getDifficultyStyle = (difficulty) => {
        const styles = {
            Easy: 'text-green-400 border-green-400/30 bg-green-400/10',
            Medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
            Hard: 'text-red-400 border-red-400/30 bg-red-400/10',
        };
        return styles[difficulty] || styles.Medium;
    };

    const getRankStyle = (index) => {
        const styles = [
            'from-yellow-400 to-amber-600', // 1st
            'from-gray-300 to-gray-500',     // 2nd
            'from-orange-400 to-orange-600', // 3rd
            'from-gray-600 to-gray-700',     // 4th
            'from-gray-600 to-gray-700',     // 5th
        ];
        return styles[index] || styles[3];
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Problems Preview */}
                    <div className="lg:col-span-2">
                        <div className="backdrop-blur-xl rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Problems (preview)</h2>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Quick filter. Full list on the Problems page.</p>
                                </div>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Try: graph, dp, CA-..."
                                        className="pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/50 w-56"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Problem List */}
                            <div className="space-y-2">
                                {problems.map((problem) => (
                                    <div
                                        key={problem.id}
                                        className="flex items-center justify-between p-4 rounded-xl transition-all group"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>CA {problem.id}</span>
                                                <span className={`px-2 py-0.5 rounded border text-xs font-medium ${getDifficultyStyle(problem.difficulty)}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-sm mb-2 group-hover:text-brand-blue transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                {problem.id}. {problem.title}
                                            </h3>
                                            <div className="flex gap-2">
                                                {problem.tags.map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{problem.acceptance} acceptance</div>
                                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{problem.points} pts</div>
                                            </div>
                                            <Link
                                                to={`/problems/${problem.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                            >
                                                Open
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* View All */}
                            <div className="mt-6 text-center">
                                <Link to="/problems" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    View all problems
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Contests & Leaderboard */}
                    <div className="space-y-6">
                        {/* Contests */}
                        <div className="backdrop-blur-xl rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <div className="mb-4">
                                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contests</h2>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Upcoming events and quick joins.</p>
                            </div>

                            <div className="space-y-3">
                                {contests.map((contest) => (
                                    <div key={contest.id} className="p-4 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{contest.name}</h3>
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    Starts {contest.startsIn} · {contest.duration}
                                                </p>
                                            </div>
                                            <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{contest.code}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                {contest.joined} joined
                                            </div>
                                            <button className="px-3 py-1 rounded-lg text-xs font-medium transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                                Join
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="backdrop-blur-xl rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            <div className="mb-4">
                                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Leaderboard</h2>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Top performers this season.</p>
                            </div>

                            {loading ? (
                                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.map((user, index) => (
                                        <div key={user.id || index} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                            {/* Rank Badge */}
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankStyle(index)} flex items-center justify-center text-white font-bold text-sm`}>
                                                {index + 1}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1">
                                                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>@{user.username}</div>
                                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    {user.problemsSolved} solved · {user.streak || 0} day streak
                                                </div>
                                            </div>

                                            {/* Rating */}
                                            <div className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.312-.843-.416a1 1 0 10-1.114 1.662c.296.19.651.389 1.067.515A4.535 4.535 0 009.917 14.77V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C14.398 13.766 15 12.991 15 12c0-.99-.602-1.765-1.324-2.246A4.539 4.539 0 0012 9.092V7.151c.391.127.68.312.843.416a1 1 0 101.114-1.662A4.535 4.535 0 0012.083 5.23V5a1 1 0 10-1.083 0zM11 9.092c-.378-.066-.71-.186-.983-.357A2.126 2.126 0 019.5 8c0-.332.193-.574.458-.75.27-.18.67-.32 1.042-.39V9.092zm1.06 1.968v2.09c.378.066.71.186.983.358.265.176.458.418.458.75 0 .332-.193.574-.458.75-.27.18-.67.32-1.042.39v-2.188c-1.35 1.35-1.35 3.538 0 4.888a3.46 3.46 0 004.889 0l.001-.001a3.46 3.46 0 000-4.888zm-3.829 0a3.46 3.46 0 004.89 0 3.46 3.46 0 000-4.889L3.109 4.11a1 1 0 00-1.414 1.415L3.89 7.726a4.5 4.5 0 00-1.39 3.024 1 1 0 002 .01c.015-1.092.793-2.022 1.83-2.28.378-.066.71-.186.983-.357A2.126 2.126 0 018 7.5a2 2 0 011.025-1.733l3.036-3.035z" clipRule="evenodd" />

                                                </svg>
                                                <span className="font-semibold text-sm">{user.rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
