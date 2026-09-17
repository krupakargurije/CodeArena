import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as userService from '../services/userService';
import { getProblems } from '../services/problemService';
import { mockProblems, mockLeaderboard } from '../utils/mockData';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
    const [loadingProblems, setLoadingProblems] = useState(true);
    const [problemSearch, setProblemSearch] = useState('');

    // Sample contests data
    const contests = [
        { id: 1, name: 'Weekly Arena #112', code: 'C-Weekly-112', startsIn: '3h 12m', duration: '1h 30m', joined: '18K' },
        { id: 2, name: 'IO Sprint Qualifier', code: 'C-IO-Qual', startsIn: 'tomorrow', duration: '2h', joined: '9.2K' },
        { id: 3, name: 'Night Owl Blitz', code: 'C-Night-Owl', startsIn: 'Fri 21:00', duration: '45m', joined: '6.1K' },
    ];

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const response = await userService.getLeaderboard();
                if (response?.data && response.data.length > 0) {
                    setLeaderboard(response.data.slice(0, 10));
                } else {
                    setLeaderboard(mockLeaderboard.slice(0, 10));
                }
            } catch (error) {
                console.warn('Failed to fetch leaderboard, using fallback:', error);
                setLeaderboard(mockLeaderboard.slice(0, 10));
            } finally {
                setLoadingLeaderboard(false);
            }
        };

        const fetchProblemsData = async () => {
            try {
                const response = await getProblems();
                if (response?.data && response.data.length > 0) {
                    setProblems(response.data);
                } else {
                    setProblems(mockProblems);
                }
            } catch (error) {
                console.warn('Failed to fetch problems, using fallback:', error);
                setProblems(mockProblems);
            } finally {
                setLoadingProblems(false);
            }
        };

        fetchLeaderboardData();
        fetchProblemsData();
    }, []);

    const formatDifficulty = (difficulty) => {
        if (!difficulty) return 'Medium';
        const d = difficulty.toUpperCase();
        if (d === 'EASY' || d === 'CAKEWALK') return 'Easy';
        if (d === 'HARD') return 'Hard';
        return 'Medium';
    };

    const getDifficultyStyle = (difficulty) => {
        const d = formatDifficulty(difficulty);
        const styles = {
            Easy: 'text-green-400 border-green-400/30 bg-green-400/10',
            Medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
            Hard: 'text-red-400 border-red-400/30 bg-red-400/10',
        };
        return styles[d] || styles.Medium;
    };

    const formatAcceptance = (rate) => {
        if (rate === undefined || rate === null || isNaN(rate)) return '50.0%';
        return `${Number(rate).toFixed(1)}%`;
    };

    const getRankStyle = (index) => {
        const styles = [
            'from-yellow-400 to-amber-600', // 1st
            'from-gray-300 to-gray-500',     // 2nd
            'from-orange-400 to-orange-600', // 3rd
            'from-gray-600 to-gray-700',     // 4th
            'from-gray-600 to-gray-700',     // 5th
        ];
        return styles[index] || 'from-gray-700 to-gray-800';
    };

    // Filter problems for the preview box
    const filteredProblems = useMemo(() => {
        return (problems || []).filter((problem) => {
            if (!problem) return false;
            const title = problem.title || '';
            const idStr = String(problem.id);
            const tags = Array.isArray(problem.tags) ? problem.tags.join(' ') : '';
            const q = problemSearch.toLowerCase();
            return title.toLowerCase().includes(q) || idStr.includes(q) || tags.toLowerCase().includes(q);
        }).slice(0, 6);
    }, [problems, problemSearch]);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ══════════════════════════════════════════════════════════
                        BOX 1: Left Column (2/3 width) - LEADERBOARD
                       ══════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-2">
                        <div
                            className="backdrop-blur-xl rounded-xl p-5"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        >
                            {/* Header */}
                            <div className="mb-4">
                                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Leaderboard</h2>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Top performers this season.</p>
                            </div>

                            {/* Leaderboard Table (Original size, no scroll view) */}
                            {loadingLeaderboard ? (
                                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
                            ) : (
                                <div className="space-y-2">
                                    {leaderboard.slice(0, 10).map((user, index) => {
                                        const username = user.username || user.email?.split('@')[0] || 'Anonymous';

                                        return (
                                            <div
                                                key={user.id || index}
                                                className="flex items-center gap-3 p-3 rounded-xl"
                                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                                            >
                                                {/* Rank Badge */}
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankStyle(index)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                    {index + 1}
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                            @{username}
                                                        </span>
                                                        {user.is_admin && (
                                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                                                STAFF
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                        {user.problemsSolved ?? user.problems_solved ?? 0} solved · {user.streak || 0} day streak
                                                    </div>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.312-.843-.416a1 1 0 10-1.114 1.662c.296.19.651.389 1.067.515A4.535 4.535 0 009.917 14.77V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C14.398 13.766 15 12.991 15 12c0-.99-.602-1.765-1.324-2.246A4.539 4.539 0 0012 9.092V7.151c.391.127.68.312.843.416a1 1 0 101.114-1.662A4.535 4.535 0 0012.083 5.23V5a1 1 0 10-1.083 0zM11 9.092c-.378-.066-.71-.186-.983-.357A2.126 2.126 0 019.5 8c0-.332.193-.574.458-.75.27-.18.67-.32 1.042-.39V9.092zm1.06 1.968v2.09c.378.066.71.186.983.358.265.176.458.418.458.75 0 .332-.193.574-.458.75-.27.18-.67.32-1.042.39v-2.188c-1.35 1.35-1.35 3.538 0 4.888a3.46 3.46 0 004.889 0l.001-.001a3.46 3.46 0 000-4.888zm-3.829 0a3.46 3.46 0 004.89 0 3.46 3.46 0 000-4.889L3.109 4.11a1 1 0 00-1.414 1.415L3.89 7.726a4.5 4.5 0 00-1.39 3.024 1 1 0 002 .01c.015-1.092.793-2.022 1.83-2.28.378-.066.71-.186.983-.357A2.126 2.126 0 018 7.5a2 2 0 011.025-1.733l3.036-3.035z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-semibold text-sm">{user.rating || 1200}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════
                        Right Column (1/3 width): CONTESTS (Box 2) & PROBLEMS (Box 3)
                       ══════════════════════════════════════════════════════════ */}
                    <div className="space-y-4">

                        {/* ─── BOX 2: Contests ─── */}
                        <div
                            className="backdrop-blur-xl rounded-xl p-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Contests</h2>
                                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Upcoming events and quick joins.</p>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                    3 upcoming
                                </span>
                            </div>

                            <div className="space-y-2">
                                {contests.map((contest) => (
                                    <div
                                        key={contest.id}
                                        className="p-2.5 px-3 rounded-lg transition-all group flex items-center justify-between gap-3"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <h3 className="font-medium text-xs truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                    {contest.name}
                                                </h3>
                                                <span className="text-[10px] font-mono px-1 rounded flex-shrink-0" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                                                    {contest.code}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                                <span>Starts {contest.startsIn}</span>
                                                <span>·</span>
                                                <span>{contest.duration}</span>
                                                <span>·</span>
                                                <span>{contest.joined}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-brand-blue hover:text-white flex-shrink-0"
                                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                        >
                                            Join
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── BOX 3: Problems (preview) ─── */}
                        <div
                            className="backdrop-blur-xl rounded-xl p-4"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        >
                            {/* Header */}
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        Problems (preview)
                                    </h2>
                                    <Link
                                        to="/problems"
                                        className="text-[11px] font-medium transition-colors hover:text-blue-400"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        View all →
                                    </Link>
                                </div>
                                <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                    Existing platform problems. Quick practice and solve.
                                </p>

                                {/* Search input */}
                                <div className="relative">
                                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={problemSearch}
                                        onChange={(e) => setProblemSearch(e.target.value)}
                                        placeholder="Filter: Two Sum, Array, CA 1..."
                                        className="w-full pl-7 pr-2.5 py-1 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>

                            {/* Problems List */}
                            {loadingProblems ? (
                                <div className="text-center py-6 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Loading problems...
                                </div>
                            ) : filteredProblems.length === 0 ? (
                                <div className="text-center py-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    No problems matched.
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {filteredProblems.map((problem) => {
                                        const diff = formatDifficulty(problem.difficulty);
                                        const diffStyle = getDifficultyStyle(diff);
                                        const acceptance = formatAcceptance(problem.acceptanceRate ?? problem.acceptance);
                                        const primaryTag = Array.isArray(problem.tags) && problem.tags.length > 0 ? problem.tags[0] : null;

                                        return (
                                            <div
                                                key={problem.id}
                                                className="p-2 px-3 rounded-lg transition-all group flex items-center justify-between gap-2.5"
                                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                                            #{problem.id}
                                                        </span>
                                                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${diffStyle}`}>
                                                            {diff}
                                                        </span>
                                                        <Link
                                                            to={`/problems/${problem.id}`}
                                                            className="font-medium text-xs truncate group-hover:text-blue-400 transition-colors"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {problem.title}
                                                        </Link>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                                        <span>{acceptance}</span>
                                                        {primaryTag && <span>· {primaryTag}</span>}
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/problems/${problem.id}`}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors hover:bg-brand-blue hover:text-white flex-shrink-0"
                                                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                                >
                                                    Open
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* View all footer */}
                            <div className="mt-3 pt-2 text-center border-t border-[var(--border-subtle)]">
                                <Link
                                    to="/problems"
                                    className="text-[11px] transition-colors hover:text-blue-400"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Browse all problems ({problems.length})
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
