import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '../store/problemSlice';
import { getUserSolvedProblemIds } from '../services/submissionService';
import ProblemRow from '../components/ProblemRow';

const Problems = () => {
    const dispatch = useDispatch();
    const { items: problems, loading, error } = useSelector((state) => state.problems);
    const { user } = useSelector((state) => state.auth);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [solvedProblemIds, setSolvedProblemIds] = useState([]);

    useEffect(() => {
        dispatch(fetchProblems());
    }, [dispatch]);

    // Fetch user's solved problems
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
        const matchesFilter = filter === 'ALL' || problem.difficulty === filter;
        const title = problem.title || '';
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header with Stats */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 dark:text-dark-text-primary text-light-text-primary">
                                Problems
                            </h1>
                            <p className="dark:text-dark-text-secondary text-light-text-secondary text-sm">
                                Practice makes perfect
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm
                                dark:bg-white/5 bg-white/60 border dark:border-white/10 border-gray-200/60">
                                <span className="text-lg font-bold dark:text-white text-gray-800">{problemsToDisplay.length}</span>
                                <span className="text-sm dark:text-gray-400 text-gray-500">Total</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm
                                dark:bg-emerald-500/10 bg-emerald-50/60 border dark:border-emerald-500/20 border-emerald-200/60">
                                <span className="text-lg font-bold text-emerald-500">{solvedProblemIds.length}</span>
                                <span className="text-sm dark:text-emerald-400/70 text-emerald-600/70">Solved</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input md:w-80 text-sm"
                        />

                        <div className="flex gap-2 flex-wrap">
                            {['ALL', 'CAKEWALK', 'EASY', 'MEDIUM', 'HARD'].map((difficulty) => (
                                <button
                                    key={difficulty}
                                    onClick={() => setFilter(difficulty)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${filter === difficulty
                                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                                        : 'dark:bg-dark-bg-tertiary bg-light-bg-tertiary dark:text-dark-text-secondary text-light-text-secondary dark:hover:bg-dark-bg-secondary hover:bg-light-bg-secondary'
                                        }`}
                                >
                                    {difficulty}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center text-sm backdrop-blur-sm">
                        Failed to load problems: {error}
                    </div>
                )}

                {/* Problems Container */}
                <div className="rounded-2xl overflow-hidden dark:bg-white/[0.02] bg-gray-50/50 border dark:border-white/5 border-gray-200/50 backdrop-blur-sm p-2">
                    {/* Column Labels */}
                    <div className="flex items-center px-7 py-3 mb-1">
                        <div className="w-10 flex justify-center flex-shrink-0">
                            <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                                Status
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 px-4">
                            <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                                Title
                            </span>
                        </div>
                        <div className="hidden md:block w-52 flex-shrink-0">
                            <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                                Tags
                            </span>
                        </div>
                        <div className="w-24 text-right hidden sm:block flex-shrink-0">
                            <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                                Acceptance
                            </span>
                        </div>
                        <div className="w-28 text-right flex-shrink-0">
                            <span className="text-[10px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                                Difficulty
                            </span>
                        </div>
                    </div>

                    {/* Problem Rows */}
                    {loading ? (
                        <div className="divide-y dark:divide-dark-border divide-light-border">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex items-center px-4 py-4">
                                    <div className="w-10 flex justify-center">
                                        <div className="w-5 h-5 rounded-full skeleton"></div>
                                    </div>
                                    <div className="flex-1 min-w-0 px-4">
                                        <div className="h-4 w-48 skeleton rounded"></div>
                                    </div>
                                    <div className="hidden md:flex w-48 gap-2">
                                        <div className="h-5 w-16 skeleton rounded"></div>
                                        <div className="h-5 w-12 skeleton rounded"></div>
                                    </div>
                                    <div className="w-20 hidden sm:flex justify-end">
                                        <div className="h-4 w-10 skeleton rounded"></div>
                                    </div>
                                    <div className="w-24 flex justify-end">
                                        <div className="h-4 w-14 skeleton rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProblems.length > 0 ? (
                        <div>
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
                        <div className="text-center py-16">
                            <svg className="mx-auto h-12 w-12 dark:text-dark-text-tertiary text-light-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-4 dark:text-dark-text-secondary text-light-text-secondary">
                                No problems found
                            </p>
                            <p className="mt-1 text-sm dark:text-dark-text-tertiary text-light-text-tertiary">
                                Try adjusting your search or filter
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats Footer - Showing filtered count */}
                {!loading && filteredProblems.length > 0 && filteredProblems.length !== problemsToDisplay.length && (
                    <div className="mt-4 text-center text-sm dark:text-gray-500 text-gray-400">
                        Showing {filteredProblems.length} of {problemsToDisplay.length} problems
                    </div>
                )}
            </div>
        </div>
    );
};

export default Problems;
