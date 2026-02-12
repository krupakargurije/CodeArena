import { Link } from 'react-router-dom';

const ProblemRow = ({ problem, isSolved = false, index }) => {
    const getDifficultyStyles = (difficulty) => {
        const styles = {
            CAKEWALK: {
                text: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/30',
            },
            EASY: {
                text: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/30',
            },
            MEDIUM: {
                text: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/30',
            },
            HARD: {
                text: 'text-red-400',
                bg: 'bg-red-500/10 border-red-500/30',
            },
        };
        return styles[difficulty] || styles.MEDIUM;
    };

    const difficultyStyles = getDifficultyStyles(problem.difficulty);

    // Generate CA-XXX format ID
    const problemId = `CA-${String(problem.id).padStart(3, '0')}`;

    return (
        <div className="group">
            <div className="flex items-center px-6 py-4 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Problem ID & Difficulty Badge */}
                <div className="flex items-center gap-3 w-40 flex-shrink-0">
                    <span className="text-sm font-mono" style={{ color: 'var(--text-tertiary)' }}>
                        {problemId}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${difficultyStyles.text} ${difficultyStyles.bg}`}>
                        {problem.difficulty}
                    </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0 px-4">
                    <h3 className="font-medium truncate group-hover:text-brand-blue transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {problem.id}. {problem.title}
                    </h3>
                </div>

                {/* Tags */}
                <div className="hidden lg:flex items-center gap-2 w-48 flex-shrink-0">
                    {problem.tags?.slice(0, 2).map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-md"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Acceptance Rate & Points */}
                <div className="w-32 text-right flex-shrink-0 hidden md:block">
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}% acceptance` : '—'}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {problem.points || (index + 1) * 100} pts
                    </div>
                </div>

                {/* Open Button */}
                <div className="w-24 flex justify-end flex-shrink-0">
                    <Link
                        to={`/problems/${problem.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all group/btn"
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                        Open
                        <svg className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProblemRow;
