import { useMemo } from 'react';

const RecentActivityCard = ({ submissions = [] }) => {
    // Format time ago
    const formatTimeAgo = (date) => {
        const now = new Date();
        const submittedAt = new Date(date);
        const diffMs = now - submittedAt;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffMonths > 0) return `${diffMonths}mo ago`;
        if (diffWeeks > 0) return `${diffWeeks}w ago`;
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMinutes > 0) return `${diffMinutes}m ago`;
        return 'Just now';
    };

    // Get status styling
    const getStatusStyle = (status) => {
        const normalizedStatus = status?.toLowerCase();
        if (normalizedStatus === 'accepted') {
            return {
                bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
                border: 'border-green-500/30',
                text: 'text-green-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                label: 'Accepted'
            };
        }
        if (normalizedStatus === 'wrong_answer' || normalizedStatus === 'wrong answer') {
            return {
                bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
                border: 'border-red-500/30',
                text: 'text-red-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
                label: 'Wrong Answer'
            };
        }
        if (normalizedStatus === 'runtime_error' || normalizedStatus === 'runtime error') {
            return {
                bg: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20',
                border: 'border-orange-500/30',
                text: 'text-orange-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                ),
                label: 'Runtime Error'
            };
        }
        if (normalizedStatus === 'compilation_error' || normalizedStatus === 'compilation error') {
            return {
                bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
                border: 'border-yellow-500/30',
                text: 'text-yellow-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                label: 'Compile Error'
            };
        }
        if (normalizedStatus === 'time_limit_exceeded' || normalizedStatus === 'time limit exceeded' || normalizedStatus === 'tle') {
            return {
                bg: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20',
                border: 'border-purple-500/30',
                text: 'text-purple-400',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                label: 'Time Limit'
            };
        }
        return {
            bg: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20',
            border: 'border-gray-500/30',
            text: 'text-gray-400',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: status || 'Pending'
        };
    };

    // Get language icon/color
    const getLanguageStyle = (language) => {
        const lang = language?.toLowerCase();
        if (lang === 'javascript' || lang === 'js') {
            return { color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
        }
        if (lang === 'python' || lang === 'py') {
            return { color: 'text-blue-400', bg: 'bg-blue-500/20' };
        }
        if (lang === 'java') {
            return { color: 'text-red-400', bg: 'bg-red-500/20' };
        }
        if (lang === 'cpp' || lang === 'c++') {
            return { color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
        }
        return { color: 'text-gray-400', bg: 'bg-gray-500/20' };
    };

    const recentSubmissions = useMemo(() => {
        return submissions.slice(0, 10);
    }, [submissions]);

    if (recentSubmissions.length === 0) {
        return (
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold dark:text-dark-text-primary text-light-text-primary mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Submissions
                </h3>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange/20 to-orange-500/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="dark:text-dark-text-secondary text-light-text-secondary">
                        No submissions yet
                    </p>
                    <p className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary mt-1">
                        Start solving problems to see your activity here!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold dark:text-dark-text-primary text-light-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Submissions
            </h3>

            <div className="space-y-3">
                {recentSubmissions.map((submission, index) => {
                    const statusStyle = getStatusStyle(submission.status);
                    const langStyle = getLanguageStyle(submission.language);

                    return (
                        <div
                            key={submission.id || index}
                            className={`group relative p-4 rounded-xl border ${statusStyle.border} ${statusStyle.bg} 
                                       backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Problem Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium dark:text-dark-text-primary text-light-text-primary truncate">
                                        {submission.problemTitle || `Problem #${submission.problemId || submission.problem_id}`}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        {/* Language Badge */}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${langStyle.bg} ${langStyle.color}`}>
                                            {submission.language}
                                        </span>
                                        {/* Time */}
                                        <span className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                                            {formatTimeAgo(submission.submittedAt || submission.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusStyle.bg} ${statusStyle.text}`}>
                                    {statusStyle.icon}
                                    <span className="text-sm font-medium hidden sm:inline">
                                        {statusStyle.label}
                                    </span>
                                </div>
                            </div>

                            {/* Execution Stats */}
                            {(submission.executionTime || submission.memoryUsed) && (
                                <div className="flex gap-4 mt-3 pt-3 border-t dark:border-dark-border-primary/30 border-light-border-primary/30">
                                    {submission.executionTime && (
                                        <div className="flex items-center gap-1 text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            {submission.executionTime}ms
                                        </div>
                                    )}
                                    {submission.memoryUsed && (
                                        <div className="flex items-center gap-1 text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                            </svg>
                                            {(submission.memoryUsed / 1024).toFixed(1)}MB
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentActivityCard;
