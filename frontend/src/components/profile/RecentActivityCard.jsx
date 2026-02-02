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
            <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
                    <p className="text-dark-text-secondary">
                        No submissions yet
                    </p>
                    <p className="text-sm text-dark-text-tertiary mt-1">
                        Start solving problems to see your activity here!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium text-dark-text-secondary flex items-center gap-2 uppercase tracking-wider text-xs">
                    <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent Activity
                </h3>
                <span className="text-[10px] font-medium text-dark-text-tertiary px-2 py-0.5 rounded border border-white/5 bg-white/[0.02]">
                    Last {recentSubmissions.length}
                </span>
            </div>

            <div className="space-y-1">
                {recentSubmissions.map((submission, index) => {
                    const statusStyle = getStatusStyle(submission.status);
                    const langStyle = getLanguageStyle(submission.language);

                    return (
                        <div
                            key={submission.id || index}
                            className={`
                                group relative flex items-center px-4 py-3 rounded-lg
                                transition-all duration-200
                                hover:bg-white/[0.03]
                                border border-transparent hover:border-white/5
                            `}
                        >
                            {/* Status Icon - Minimal */}
                            <div className={`w-2 h-2 rounded-full mr-4 ${statusStyle.text.replace('text-', 'bg-')}`} />

                            {/* Problem Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                        {submission.problemTitle || `Problem #${submission.problemId || submission.problem_id}`}
                                    </h4>
                                    <span className="text-xs text-dark-text-tertiary font-mono">
                                        {formatTimeAgo(submission.submittedAt || submission.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase tracking-wide font-medium ${statusStyle.text}`}>
                                        {statusStyle.label}
                                    </span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-dark-text-tertiary/50" />
                                    <span className={`text-[10px] font-medium text-dark-text-tertiary capitalize`}>
                                        {submission.language}
                                    </span>
                                    {submission.executionTime && (
                                        <>
                                            <span className="w-0.5 h-0.5 rounded-full bg-dark-text-tertiary/50" />
                                            <span className="text-[10px] text-dark-text-tertiary flex items-center gap-0.5">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                {submission.executionTime}ms
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentActivityCard;
