import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '../store/problemSlice';
import { getUserSolvedProblemIds } from '../services/submissionService';
import ProblemRow from '../components/ProblemRow';

const Problems = () => {
    const dispatch = useDispatch();
    const { items: problems, loading, error } = useSelector((state) => state.problems);
    const { user } = useSelector((state) => state.auth);
    const [difficultyFilter, setDifficultyFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [solvedProblemIds, setSolvedProblemIds] = useState([]);

    useEffect(() => {
        dispatch(fetchProblems());
    }, [dispatch]);

    useEffect(() => {
        const fetchSolvedProblems = async () => {
            if (user?.id) {
                const result = await getUserSolvedProblemIds(user.id);
                setSolvedProblemIds(result.data);
            }
        };
        fetchSolvedProblems();
    }, [user]);

    const problemsToDisplay = problems || [];

    const filteredProblems = problemsToDisplay.filter((problem) => {
        if (!problem) return false;

        // Difficulty Filter
        const matchesDifficulty = difficultyFilter === 'ALL' || (problem.difficulty || '').toUpperCase() === difficultyFilter.toUpperCase();

        // Status Filter
        let matchesStatus = true;
        if (statusFilter === 'SOLVED') {
            matchesStatus = solvedProblemIds.includes(problem.id);
        } else if (statusFilter === 'UNSOLVED') {
            matchesStatus = !solvedProblemIds.includes(problem.id);
        }

        // Search Filter
        const title = problem.title || '';
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesDifficulty && matchesStatus && matchesSearch;
    }).sort((a, b) => a.id - b.id);

    const activeFiltersCount = (difficultyFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }} onClick={() => setShowFilters(false)}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Problems
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Practice with a clean list view — filter by id, title, or tag.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search problems (e.g, dp, graph, CA-...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFilters(!showFilters);
                            }}
                            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border font-medium transition-all ${showFilters || activeFiltersCount > 0
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-dark-bg-secondary border-white/10 text-white hover:bg-dark-bg-tertiary'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20 text-white">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {showFilters && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
                            >
                                {/* Difficulty Section */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Difficulty</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['ALL', 'Cakewalk', 'Easy', 'Medium', 'Hard'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setDifficultyFilter(level)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${difficultyFilter === level
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/5 text-dark-text-secondary hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {level === 'ALL' ? 'All' : level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Status</h3>
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { id: 'ALL', label: 'All Problems' },
                                            { id: 'SOLVED', label: 'Solved' },
                                            { id: 'UNSOLVED', label: 'Unsolved' }
                                        ].map((status) => (
                                            <button
                                                key={status.id}
                                                onClick={() => setStatusFilter(status.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === status.id
                                                    ? 'bg-white/5 text-white border border-white/10'
                                                    : 'text-dark-text-secondary hover:bg-white/5 hover:text-white border border-transparent'
                                                    }`}
                                            >
                                                {status.label}
                                                {statusFilter === status.id && (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset Row */}
                                {(difficultyFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                    <div className="mt-4 pt-3 border-t border-white/5">
                                        <button
                                            onClick={() => {
                                                setDifficultyFilter('ALL');
                                                setStatusFilter('ALL');
                                            }}
                                            className="w-full text-center text-xs text-dark-text-tertiary hover:text-white transition-colors"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Problems List */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    {error && (
                        <div className="p-8 text-center">
                            <p className="text-red-400">Failed to load problems: {error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredProblems.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {filteredProblems.map((problem, index) => (
                                <ProblemRow
                                    key={problem.id}
                                    problem={problem}
                                    index={index}
                                    isSolved={solvedProblemIds.includes(problem.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-3xl">
                                🔍
                            </div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No problems found</h3>
                            <p className="text-dark-text-secondary text-sm">Try adjusting your search or filters</p>
                            <button
                                onClick={() => {
                                    setDifficultyFilter('ALL');
                                    setStatusFilter('ALL');
                                    setSearchTerm('');
                                }}
                                className="mt-4 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Problems;
