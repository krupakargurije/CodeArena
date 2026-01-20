import { Link } from 'react-router-dom';

const ProblemRow = ({ problem, isSolved = false, index }) => {
    const getDifficultyStyles = (difficulty) => {
        const styles = {
            CAKEWALK: {
                text: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
            },
            EASY: {
                text: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            MEDIUM: {
                text: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
            },
            HARD: {
                text: 'text-red-400',
                bg: 'bg-red-500/10 border-red-500/20',
            },
        };
        return styles[difficulty] || styles.MEDIUM;
    };

    const difficultyStyles = getDifficultyStyles(problem.difficulty);

    return (
        <Link to={`/problems/${problem.id}`} className="block group">
            <div className={`
                relative flex items-center px-5 py-4 my-2 mx-2 rounded-xl
                transition-all duration-300 ease-out
                
                /* Glass effect base */
                backdrop-blur-sm
                
                /* Light theme */
                bg-white/60 hover:bg-white/80
                border border-gray-200/60 hover:border-gray-300/80
                shadow-sm hover:shadow-md hover:shadow-gray-200/50
                
                /* Dark theme */
                dark:bg-white/5 dark:hover:bg-white/10
                dark:border-white/10 dark:hover:border-white/20
                dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/20
                
                /* Solved state */
                ${isSolved ? 'dark:bg-emerald-500/5 bg-emerald-50/60 dark:border-emerald-500/20 border-emerald-200/60' : ''}
                
                /* Hover transform */
                hover:translate-x-1 hover:-translate-y-0.5
            `}>
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-orange/5 via-transparent to-transparent pointer-events-none" />

                {/* Status Icon */}
                <div className="w-10 flex justify-center flex-shrink-0">
                    {isSolved ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200/60" />
                    )}
                </div>

                {/* Problem Number & Title */}
                <div className="flex-1 min-w-0 px-4">
                    <div className="flex items-center gap-3">
                        <span className="dark:text-dark-text-tertiary text-gray-400 text-sm font-mono">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className={`
                            text-sm font-semibold truncate transition-colors duration-200
                            ${isSolved
                                ? 'dark:text-emerald-400 text-emerald-600'
                                : 'dark:text-white text-gray-800 group-hover:text-brand-orange dark:group-hover:text-brand-orange'
                            }
                        `}>
                            {problem.title}
                        </h3>
                    </div>
                </div>

                {/* Tags */}
                <div className="hidden md:flex items-center gap-2 w-52 flex-shrink-0">
                    {problem.tags?.slice(0, 2).map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-full 
                                dark:bg-white/10 bg-gray-100 
                                dark:text-gray-300 text-gray-600
                                border dark:border-white/10 border-gray-200/60"
                        >
                            {tag}
                        </span>
                    ))}
                    {problem.tags?.length > 2 && (
                        <span className="text-xs dark:text-gray-500 text-gray-400 font-medium">
                            +{problem.tags.length - 2}
                        </span>
                    )}
                </div>

                {/* Acceptance Rate */}
                <div className="w-24 text-right hidden sm:block flex-shrink-0">
                    <span className="text-sm dark:text-gray-400 text-gray-500 font-medium">
                        {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '—'}
                    </span>
                </div>

                {/* Difficulty Badge */}
                <div className="w-28 flex justify-end flex-shrink-0">
                    <span className={`
                        px-3 py-1.5 text-xs font-bold rounded-lg border
                        ${difficultyStyles.text} ${difficultyStyles.bg}
                    `}>
                        {problem.difficulty}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ProblemRow;
