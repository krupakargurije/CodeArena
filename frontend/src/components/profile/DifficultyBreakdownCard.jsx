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
        <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 h-full flex flex-col">
            <h3 className="text-base font-medium text-dark-text-secondary mb-6 flex items-center gap-2 uppercase tracking-wider text-xs">
                <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Difficulty Breakdown
            </h3>

            {/* Total Progress Circle */}
            <div className="flex items-center justify-center mb-8">
                <div className="relative group">
                    <div className="absolute inset-0 bg-brand-orange/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#1e1e24"
                            strokeWidth="6"
                        />
                        {/* Progress segments */}
                        {difficulties.map((diff, index) => {
                            const prevSolved = difficulties.slice(0, index).reduce((acc, d) => acc + d.solved, 0);
                            const startPercent = totalSolved > 0 ? (prevSolved / totalSolved) * 100 : 0;
                            const percent = totalSolved > 0 ? (diff.solved / totalSolved) * 100 : 0;
                            const circumference = 2 * Math.PI * 42;
                            const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
                            const rotation = (startPercent / 100) * 360; // Base rotation handled by svg transform

                            if (diff.solved === 0) return null;

                            return (
                                <circle
                                    key={diff.name}
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke={diff.ringColor}
                                    strokeWidth="6"
                                    strokeDasharray={animated ? strokeDasharray : '0 263.8'}
                                    strokeLinecap="round"
                                    transform={`rotate(${rotation} 50 50)`}
                                    className="transition-all duration-1000 ease-out hover:opacity-80"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white tracking-tight">
                            {totalSolved}
                        </span>
                        <span className="text-[10px] text-dark-text-tertiary uppercase tracking-widest mt-0.5">
                            Solved
                        </span>
                    </div>
                </div>
            </div>

            {/* Difficulty Progress Bars */}
            <div className="space-y-5 flex-1">
                {difficulties.map((diff) => {
                    const percentage = diff.total > 0 ? (diff.solved / diff.total) * 100 : 0;

                    return (
                        <div key={diff.name} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${diff.bgColor.replace('/20', '')}`} style={{ backgroundColor: diff.ringColor }}></div>
                                    <span className={`text-sm font-medium text-gray-300`}>
                                        {diff.name}
                                    </span>
                                </div>
                                <div className="text-xs">
                                    <span className="font-bold text-white text-sm">{diff.solved}</span>
                                    <span className="text-dark-text-tertiary mx-1">/</span>
                                    <span className="text-dark-text-tertiary">{diff.total}</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#1e1e24] overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                                    style={{
                                        width: animated ? `${percentage}%` : '0%',
                                        backgroundColor: diff.ringColor
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ content: '""' }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DifficultyBreakdownCard;
