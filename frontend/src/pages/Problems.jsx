import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '../store/problemSlice';
import { getUserSolvedProblemIds } from '../services/submissionService';
import ProblemCard from '../components/ProblemCard';

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

    console.log('Problems State:', { problems, loading, error });

    const problemsToDisplay = problems || [];

    const filteredProblems = problemsToDisplay.filter((problem) => {
        if (!problem) return false;
        const matchesFilter = filter === 'ALL' || problem.difficulty === filter;
        const title = problem.title || '';
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    console.log('Filtered Problems:', filteredProblems);

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 dark:text-dark-text-primary text-light-text-primary">
                        Problem Set
                    </h1>
                    <p className="dark:text-dark-text-secondary text-light-text-secondary">
                        Choose a problem and start coding
                    </p>
                </div>

                <div className="panel p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input md:w-96"
                        />

                        <div className="flex gap-2">
                            {['ALL', 'CAKEWALK', 'EASY', 'MEDIUM', 'HARD'].map((difficulty) => (
                                <button
                                    key={difficulty}
                                    onClick={() => setFilter(difficulty)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${filter === difficulty
                                        ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30'
                                        : 'dark:bg-dark-bg-tertiary bg-light-bg-tertiary dark:text-dark-text-secondary text-light-text-secondary dark:hover:bg-dark-bg-tertiary/80 hover:bg-light-bg-tertiary/80'
                                        }`}
                                >
                                    {difficulty}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-center">
                        Failed to load problems: {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card skeleton h-48" />
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProblems.length > 0 ? (
                            filteredProblems.map((problem) => (
                                <ProblemCard
                                    key={problem.id}
                                    problem={problem}
                                    isSolved={solvedProblemIds.includes(problem.id)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="dark:text-dark-text-secondary text-light-text-secondary text-lg">No problems found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Problems;
