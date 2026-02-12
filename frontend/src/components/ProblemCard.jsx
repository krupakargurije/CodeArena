import { Link } from 'react-router-dom';

const ProblemCard = ({ problem, isSolved = false }) => {
    const getDifficultyBadge = (difficulty) => {
        const badges = {
            CAKEWALK: 'badge-cakewalk',
            EASY: 'badge-easy',
            MEDIUM: 'badge-medium',
            HARD: 'badge-hard',
        };
        return badges[difficulty] || 'badge-medium';
    };

    return (
        <Link to={`/problems/${problem.id}`}>
            <div className={`card group cursor-pointer relative ${isSolved ? 'ring-1 ring-green-500/30' : ''}`}>
                {/* Solved Badge */}
                {isSolved && (
                    <div className="absolute -top-2 -right-2 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow-lg shadow-green-500/30">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Solved
                        </div>
                    </div>
                )}

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {isSolved && (
                            <span className="text-green-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </span>
                        )}
                        <h3 className={`text-xl font-semibold dark:text-dark-text-primary text-light-text-primary group-hover:text-brand-orange transition-colors ${isSolved ? 'text-green-500 dark:text-green-400' : ''}`}>
                            {problem.id}. {problem.title}
                        </h3>
                    </div>
                    <span className={getDifficultyBadge(problem.difficulty)}>
                        {problem.difficulty}
                    </span>
                </div>

                <p className="dark:text-dark-text-secondary text-light-text-secondary text-sm mb-4 line-clamp-2">
                    {problem.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {problem.tags?.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-md bg-brand-orange/10 text-brand-orange border border-brand-orange/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {isSolved && (
                            <span className="text-xs text-green-500 font-medium">✓ Completed</span>
                        )}
                        <span className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">
                            {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '0%'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProblemCard;
