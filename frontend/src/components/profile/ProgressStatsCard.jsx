import { useEffect, useState } from 'react';

const ProgressStatsCard = ({ submissions = [], problems = [] }) => {
    const [animatedSolved, setAnimatedSolved] = useState(0);
    const [animatedRate, setAnimatedRate] = useState(0);

    console.log('ProgressStatsCard - Submissions received:', submissions.length);
    console.log('ProgressStatsCard - Problems received:', problems.length);
    console.log('ProgressStatsCard - Sample submission:', submissions[0]);

    // Calculate stats from actual data
    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted' || s.status === 'ACCEPTED').length;
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    // Get unique accepted problem IDs for accurate solved count
    const acceptedProblemIds = new Set();
    submissions.forEach(s => {
        if (s.status === 'Accepted' || s.status === 'ACCEPTED') {
            const problemId = s.problemId || s.problem_id;
            console.log('ProgressStatsCard - Accepted submission problemId:', problemId);
            if (problemId) {
                acceptedProblemIds.add(String(problemId));
            }
        }
    });
    const problemsSolved = acceptedProblemIds.size;
    const totalProblemsCount = problems.length;

    console.log('ProgressStatsCard - Accepted problem IDs:', [...acceptedProblemIds]);
    console.log('ProgressStatsCard - Problems solved:', problemsSolved);

    // Calculate streak
    const calculateStreak = () => {
        if (submissions.length === 0) return { current: 0, max: 0 };

        const sortedSubmissions = [...submissions]
            .filter(s => s.status === 'Accepted' || s.status === 'ACCEPTED')
            .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));

        if (sortedSubmissions.length === 0) return { current: 0, max: 0 };

        const dates = [...new Set(sortedSubmissions.map(s => {
            const d = new Date(s.submittedAt || s.createdAt);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }))];

        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 1;

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

        if (dates[0] === todayStr || dates[0] === yesterdayStr) {
            currentStreak = 1;
            for (let i = 1; i < dates.length; i++) {
                const curr = new Date(dates[i - 1].split('-').join('/'));
                const prev = new Date(dates[i].split('-').join('/'));
                const diff = (curr - prev) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        for (let i = 1; i < dates.length; i++) {
            const curr = new Date(dates[i - 1].split('-').join('/'));
            const prev = new Date(dates[i].split('-').join('/'));
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                tempStreak++;
                maxStreak = Math.max(maxStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        maxStreak = Math.max(maxStreak, currentStreak, 1);

        return { current: currentStreak, max: maxStreak };
    };

    const streak = calculateStreak();

    // Animate numbers on mount and when data changes
    useEffect(() => {
        setAnimatedSolved(0);
        setAnimatedRate(0);

        const solvedDuration = 1000;
        const solvedStep = problemsSolved / (solvedDuration / 16);
        let solvedCurrent = 0;

        const solvedInterval = setInterval(() => {
            solvedCurrent += solvedStep;
            if (solvedCurrent >= problemsSolved) {
                setAnimatedSolved(problemsSolved);
                clearInterval(solvedInterval);
            } else {
                setAnimatedSolved(Math.floor(solvedCurrent));
            }
        }, 16);

        const rateDuration = 1000;
        const rateStep = acceptanceRate / (rateDuration / 16);
        let rateCurrent = 0;

        const rateInterval = setInterval(() => {
            rateCurrent += rateStep;
            if (rateCurrent >= acceptanceRate) {
                setAnimatedRate(acceptanceRate);
                clearInterval(rateInterval);
            } else {
                setAnimatedRate(Math.floor(rateCurrent));
            }
        }, 16);

        return () => {
            clearInterval(solvedInterval);
            clearInterval(rateInterval);
        };
    }, [problemsSolved, acceptanceRate, submissions.length]);

    // SVG circle properties
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedRate / 100) * circumference;

    // Progress percentage for solved problems
    const solvedPercentage = totalProblemsCount > 0 ? Math.round((problemsSolved / totalProblemsCount) * 100) : 0;

    return (
        <div className="glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-orange/10">
            <h3 className="text-lg font-semibold dark:text-dark-text-primary text-light-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progress Overview
            </h3>

            <div className="grid grid-cols-2 gap-6">
                {/* Acceptance Rate Circle */}
                <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="56"
                                cy="56"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="dark:text-dark-bg-tertiary text-light-bg-tertiary"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r={radius}
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ffa116" />
                                    <stop offset="100%" stopColor="#ff6b35" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold dark:text-dark-text-primary text-light-text-primary">
                                {animatedRate}%
                            </span>
                            <span className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                                Accept
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="flex flex-col justify-center space-y-4">
                    {/* Problems Solved */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold dark:text-dark-text-primary text-light-text-primary">
                                    {animatedSolved}
                                </span>
                                <span className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">
                                    /{totalProblemsCount}
                                </span>
                            </div>
                            <div className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">Solved ({solvedPercentage}%)</div>
                        </div>
                    </div>

                    {/* Current Streak */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                            <span className="text-lg">🔥</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold dark:text-dark-text-primary text-light-text-primary">
                                {streak.current}
                            </div>
                            <div className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">Day Streak</div>
                        </div>
                    </div>

                    {/* Max Streak */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <span className="text-lg">⭐</span>
                        </div>
                        <div>
                            <div className="text-xl font-bold dark:text-dark-text-primary text-light-text-primary">
                                {streak.max}
                            </div>
                            <div className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">Max Streak</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Submissions */}
            <div className="mt-6 pt-4 border-t dark:border-dark-border-primary border-light-border-primary">
                <div className="flex justify-between items-center">
                    <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">
                        Total Submissions
                    </span>
                    <span className="text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">
                        {totalSubmissions}
                    </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">
                        Accepted Submissions
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                        {acceptedSubmissions}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProgressStatsCard;
