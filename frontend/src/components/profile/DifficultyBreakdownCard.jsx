import { useEffect, useState } from 'react';

const DifficultyBreakdownCard = ({ submissions = [], problems = [] }) => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Calculate stats from actual problems and submissions data
    const calculateDifficultyStats = () => {
        // Count total problems by difficulty
        const totalByDifficulty = {
            cakewalk: 0,
            easy: 0,
            medium: 0,
            hard: 0
        };

        // Map problem IDs to their difficulties (convert to string for consistent comparison)
        const problemDifficultyMap = {};
        problems.forEach(problem => {
            const difficulty = (problem.difficulty || '').toLowerCase();
            const problemId = String(problem.id); // Convert to string for consistent comparison
            problemDifficultyMap[problemId] = difficulty;

            if (difficulty === 'cakewalk') totalByDifficulty.cakewalk++;
            else if (difficulty === 'easy') totalByDifficulty.easy++;
            else if (difficulty === 'medium') totalByDifficulty.medium++;
            else if (difficulty === 'hard') totalByDifficulty.hard++;
        });

        console.log('DifficultyBreakdown - Problem map:', problemDifficultyMap);
        console.log('DifficultyBreakdown - Total by difficulty:', totalByDifficulty);

        // Get unique accepted problem IDs and their difficulties
        const acceptedProblemIds = new Set();
        submissions.forEach(s => {
            if (s.status === 'Accepted' || s.status === 'ACCEPTED') {
                const problemId = String(s.problemId || s.problem_id); // Convert to string
                if (problemId && problemId !== 'undefined') {
                    acceptedProblemIds.add(problemId);
                }
            }
        });

        console.log('DifficultyBreakdown - Accepted problem IDs:', [...acceptedProblemIds]);
        console.log('DifficultyBreakdown - Submissions sample:', submissions.slice(0, 3));

        // Count solved problems by difficulty
        const solvedByDifficulty = {
            cakewalk: 0,
            easy: 0,
            medium: 0,
            hard: 0
        };

        acceptedProblemIds.forEach(problemId => {
            const difficulty = problemDifficultyMap[problemId];
            console.log(`DifficultyBreakdown - Problem ${problemId} has difficulty: ${difficulty}`);
            if (difficulty === 'cakewalk') solvedByDifficulty.cakewalk++;
            else if (difficulty === 'easy') solvedByDifficulty.easy++;
            else if (difficulty === 'medium') solvedByDifficulty.medium++;
            else if (difficulty === 'hard') solvedByDifficulty.hard++;
        });

        console.log('DifficultyBreakdown - Solved by difficulty:', solvedByDifficulty);

        return {
            cakewalk: { solved: solvedByDifficulty.cakewalk, total: totalByDifficulty.cakewalk },
            easy: { solved: solvedByDifficulty.easy, total: totalByDifficulty.easy },
            medium: { solved: solvedByDifficulty.medium, total: totalByDifficulty.medium },
            hard: { solved: solvedByDifficulty.hard, total: totalByDifficulty.hard }
        };
    };

    const stats = calculateDifficultyStats();
    const totalSolved = stats.cakewalk.solved + stats.easy.solved + stats.medium.solved + stats.hard.solved;
    const totalProblems = stats.cakewalk.total + stats.easy.total + stats.medium.total + stats.hard.total;

    const difficulties = [
        {
            name: 'Cakewalk',
            key: 'cakewalk',
            solved: stats.cakewalk.solved,
            total: stats.cakewalk.total,
            color: 'from-green-400 to-emerald-300',
            bgColor: 'bg-green-400/20',
            textColor: 'text-green-400',
            ringColor: '#4ade80'
        },
        {
            name: 'Easy',
            key: 'easy',
            solved: stats.easy.solved,
            total: stats.easy.total,
            color: 'from-difficulty-easy to-teal-400',
            bgColor: 'bg-difficulty-easy/20',
            textColor: 'text-difficulty-easy',
            ringColor: '#00b8a3'
        },
        {
            name: 'Medium',
            key: 'medium',
            solved: stats.medium.solved,
            total: stats.medium.total,
            color: 'from-difficulty-medium to-yellow-400',
            bgColor: 'bg-difficulty-medium/20',
            textColor: 'text-difficulty-medium',
            ringColor: '#ffc01e'
        },
        {
            name: 'Hard',
            key: 'hard',
            solved: stats.hard.solved,
            total: stats.hard.total,
            color: 'from-difficulty-hard to-red-400',
            bgColor: 'bg-difficulty-hard/20',
            textColor: 'text-difficulty-hard',
            ringColor: '#ff375f'
        }
    ];

    return (
        <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-orange/10">
            <h3 className="text-lg font-semibold dark:text-dark-text-primary text-light-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Difficulty Breakdown
            </h3>

            {/* Total Progress Circle */}
            <div className="flex items-center justify-center mb-6">
                <div className="relative">
                    <svg className="w-28 h-28" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="dark:text-dark-bg-tertiary text-light-bg-tertiary"
                        />
                        {/* Progress segments */}
                        {difficulties.map((diff, index) => {
                            const prevSolved = difficulties.slice(0, index).reduce((acc, d) => acc + d.solved, 0);
                            const startPercent = totalSolved > 0 ? (prevSolved / totalSolved) * 100 : 0;
                            const percent = totalSolved > 0 ? (diff.solved / totalSolved) * 100 : 0;
                            const circumference = 2 * Math.PI * 40;
                            const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
                            const rotation = -90 + (startPercent / 100) * 360;

                            if (diff.solved === 0) return null;

                            return (
                                <circle
                                    key={diff.name}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke={diff.ringColor}
                                    strokeWidth="8"
                                    strokeDasharray={animated ? strokeDasharray : '0 251.2'}
                                    strokeLinecap="round"
                                    transform={`rotate(${rotation} 50 50)`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold dark:text-dark-text-primary text-light-text-primary">
                            {totalSolved}
                        </span>
                        <span className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                            /{totalProblems}
                        </span>
                    </div>
                </div>
            </div>

            {/* Difficulty Progress Bars */}
            <div className="space-y-3">
                {difficulties.map((diff) => {
                    const percentage = diff.total > 0 ? (diff.solved / diff.total) * 100 : 0;

                    return (
                        <div key={diff.name} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: diff.ringColor }}
                                    />
                                    <span className={`text-sm font-medium ${diff.textColor}`}>
                                        {diff.name}
                                    </span>
                                </div>
                                <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">
                                    <span className="font-semibold dark:text-dark-text-primary text-light-text-primary">
                                        {diff.solved}
                                    </span>
                                    /{diff.total}
                                </span>
                            </div>
                            <div className="h-2 rounded-full dark:bg-dark-bg-tertiary bg-light-bg-tertiary overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${diff.color} transition-all duration-1000 ease-out`}
                                    style={{
                                        width: animated ? `${percentage}%` : '0%'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend Summary */}
            <div className="mt-6 pt-4 border-t dark:border-dark-border-primary border-light-border-primary">
                <div className="grid grid-cols-4 gap-2 text-center">
                    {difficulties.map((diff) => (
                        <div key={diff.name} className="flex flex-col items-center">
                            <span className={`text-lg font-bold ${diff.textColor}`}>{diff.solved}</span>
                            <span className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary truncate w-full">{diff.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DifficultyBreakdownCard;
