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
        <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 h-full flex flex-col">
            <h3 className="text-base font-medium text-dark-text-secondary mb-6 flex items-center gap-2 uppercase tracking-wider text-xs">
                <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progress Overview
            </h3>

            <div className="grid grid-cols-2 gap-8 items-center flex-1">
                {/* Acceptance Rate Circle */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
                    <div className="absolute inset-0 bg-brand-orange/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="#1e1e24"
                                strokeWidth="6"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="6"
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
                            <span className="text-2xl font-bold text-white tracking-tight">
                                {animatedRate}<span className="text-sm font-normal text-dark-text-tertiary">%</span>
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-dark-text-tertiary uppercase tracking-wider mt-3 font-medium">Acceptance Rate</span>
                </div>

                {/* Stats Grid */}
                <div className="flex flex-col justify-center space-y-6">
                    {/* Problems Solved */}
                    <div className="group">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-dark-text-secondary text-sm font-medium">Solved</span>
                        </div>
                        <div className="pl-11">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-white tracking-tight">{animatedSolved}</span>
                                <span className="text-xs text-dark-text-tertiary">/ {totalProblemsCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Streak */}
                    <div className="group">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                                </svg>
                            </div>
                            <span className="text-dark-text-secondary text-sm font-medium">Day Streak</span>
                        </div>
                        <div className="pl-11">
                            <span className="text-2xl font-bold text-white tracking-tight">{streak.current}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-dark-text-tertiary">
                <div>
                    Total Submissions: <span className="text-white font-medium ml-1">{totalSubmissions}</span>
                </div>
                <div>
                    Max Streak: <span className="text-white font-medium ml-1">{streak.max}</span>
                </div>
            </div>
        </div>
    );
};

export default ProgressStatsCard;
