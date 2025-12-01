import { Link } from 'react-router-dom';

const ProblemCard = ({ problem }) => {
    const getDifficultyBadge = (difficulty) => {
        const badges = {
            EASY: 'badge-easy',
            MEDIUM: 'badge-medium',
            HARD: 'badge-hard',
        };
        return badges[difficulty] || 'badge-medium';
    };

    return (
        <Link to={`/problems/${problem.id}`}>
            <div className="card group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-100 group-hover:text-primary-400 transition-colors">
                        {problem.title}
                    </h3>
                    <span className={getDifficultyBadge(problem.difficulty)}>
                        {problem.difficulty}
                    </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {problem.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {problem.tags?.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="text-sm text-gray-500">
                        {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '0%'}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProblemCard;
