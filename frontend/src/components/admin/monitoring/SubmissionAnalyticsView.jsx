import React, { useState, useEffect } from 'react';
import { getSubmissionAnalytics } from '../../../services/monitoringService';

const TIME_RANGES = [
    { label: 'Last 1 Hour', value: '1h' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'All Time', value: 'all' },
];

const VERDICT_COLORS = {
    ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
    WRONG_ANSWER: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', bar: 'bg-rose-500' },
    TIME_LIMIT_EXCEEDED: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', bar: 'bg-amber-500' },
    RUNTIME_ERROR: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', bar: 'bg-purple-500' },
    COMPILATION_ERROR: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', bar: 'bg-sky-500' },
    PLATFORM_ERROR: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', bar: 'bg-red-500' },
    PENDING: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', bar: 'bg-slate-500' },
};

const LANGUAGE_LABELS = {
    '62': 'Java 17',
    '71': 'Python 3',
    '54': 'C++ 17',
    '50': 'C (GCC)',
    '63': 'JavaScript',
    '74': 'TypeScript',
    'DEFAULT': 'Other'
};

const SubmissionAnalyticsView = ({ autoRefreshInterval }) => {
    const [timeRange, setTimeRange] = useState('24h');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const fetchAnalytics = async (range) => {
        try {
            setError(null);
            const data = await getSubmissionAnalytics(range || timeRange);
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to load submission analytics:', err);
            setError(err.message || 'Failed to fetch submission analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAnalytics(timeRange);
    }, [timeRange]);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(() => {
            fetchAnalytics(timeRange);
        }, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval, timeRange]);

    // Calculate max value for chart scaling
    const buckets = analytics?.timeSeriesBuckets || [];
    const maxSubmissionsInBucket = Math.max(...buckets.map(b => b.totalCount), 5);

    if (loading && !analytics) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-white/5 rounded-lg w-48" />
                    <div className="h-10 bg-white/5 rounded-lg w-72" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-panel p-5 h-28 rounded-2xl bg-white/5" />
                    ))}
                </div>
                <div className="glass-panel p-6 h-72 rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (error && !analytics) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Failed to Load Submission Analytics</h3>
                <p className="text-dark-text-secondary text-sm max-w-md mx-auto">{error}</p>
                <button
                    onClick={() => fetchAnalytics(timeRange)}
                    className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-sm font-semibold transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    const totalSubmissions = analytics?.totalSubmissions || 0;
    const acceptedCount = analytics?.acceptedSubmissions || 0;
    const rejectedCount = analytics?.rejectedSubmissions || 0;
    const platformErrorCount = analytics?.platformErrorSubmissions || 0;
    const successRate = analytics?.successRate !== undefined ? analytics.successRate.toFixed(1) : '0.0';
    const avgLatency = analytics?.avgProcessingTimeMs !== undefined ? Math.round(analytics.avgProcessingTimeMs) : 0;
    const verdictCounts = analytics?.verdictCounts || {};
    const languageCounts = analytics?.languageCounts || {};

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>Submission Performance & Analytics</span>
                    </h2>
                    <p className="text-xs text-dark-text-secondary mt-0.5">
                        Historical and aggregated code execution activity across configured time windows.
                    </p>
                </div>

                {/* Range Filter Selector */}
                <div className="flex items-center bg-dark-bg-secondary p-1 rounded-xl border border-white/5">
                    {TIME_RANGES.map(range => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeRange === range.value
                                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                                : 'text-dark-text-secondary hover:text-white'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="text-xs font-semibold text-dark-text-tertiary uppercase tracking-wider mb-1">Total Submissions</div>
                    <div className="text-2xl font-bold text-white font-mono">{totalSubmissions.toLocaleString()}</div>
                    <div className="text-[11px] text-dark-text-secondary mt-1">Window: {timeRange.toUpperCase()}</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider mb-1">Accepted Solutions</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">{acceptedCount.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-400/70 mt-1">{successRate}% Acceptance Rate</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-amber-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-1">User Code Errors</div>
                    <div className="text-2xl font-bold text-amber-400 font-mono">{rejectedCount.toLocaleString()}</div>
                    <div className="text-[11px] text-amber-400/70 mt-1">WA, TLE, RE, CE</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-red-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-red-400/90 uppercase tracking-wider mb-1">Platform Failures</div>
                    <div className="text-2xl font-bold text-red-400 font-mono">{platformErrorCount.toLocaleString()}</div>
                    <div className="text-[11px] text-red-400/70 mt-1">Sandbox/Network Faults</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-sky-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-sky-400/90 uppercase tracking-wider mb-1">Avg Execution Time</div>
                    <div className="text-2xl font-bold text-sky-400 font-mono">{avgLatency} <span className="text-xs font-normal text-sky-300">ms</span></div>
                    <div className="text-[11px] text-sky-400/70 mt-1">Queue + Judge0 run</div>
                </div>
            </div>

            {/* Time-Series Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-white">Submission Volume Over Time</h3>
                        <p className="text-xs text-dark-text-secondary">Distribution of total vs accepted submissions</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-brand-orange inline-block" />
                            <span className="text-dark-text-secondary">Total Submissions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                            <span className="text-dark-text-secondary">Accepted</span>
                        </div>
                    </div>
                </div>

                {buckets.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-xl border border-dashed border-white/10">
                        <svg className="w-10 h-10 text-dark-text-tertiary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm font-semibold text-dark-text-secondary">No submission data available in this time window</p>
                        <p className="text-xs text-dark-text-tertiary mt-1">Try selecting a broader time range such as 'Last 30 Days' or 'All Time'</p>
                    </div>
                ) : (
                    <div className="relative h-64 w-full bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-end">
                        {/* Hover Tooltip */}
                        {hoveredPoint && (
                            <div
                                className="absolute z-20 bg-dark-bg-secondary/95 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl text-xs space-y-1 pointer-events-none transition-all"
                                style={{
                                    left: `${Math.min(Math.max(hoveredPoint.x, 15), 85)}%`,
                                    top: '10px',
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <div className="font-bold text-white border-b border-white/10 pb-1">{hoveredPoint.label}</div>
                                <div className="text-brand-orange font-mono">Total: <span className="font-bold">{hoveredPoint.total}</span></div>
                                <div className="text-emerald-400 font-mono">Accepted: <span className="font-bold">{hoveredPoint.accepted}</span></div>
                                <div className="text-red-400 font-mono">Platform Errors: <span className="font-bold">{hoveredPoint.errors}</span></div>
                            </div>
                        )}

                        {/* SVG Area / Bars Chart */}
                        <div className="h-48 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-2">
                            {buckets.map((bucket, index) => {
                                const totalHeightPct = Math.min(100, Math.max(4, (bucket.totalCount / maxSubmissionsInBucket) * 100));
                                const acceptedHeightPct = bucket.totalCount > 0
                                    ? Math.min(100, (bucket.acceptedCount / bucket.totalCount) * 100)
                                    : 0;

                                const xPercent = ((index + 0.5) / buckets.length) * 100;

                                return (
                                    <div
                                        key={index}
                                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                                        onMouseEnter={() => setHoveredPoint({
                                            x: xPercent,
                                            label: bucket.timestampLabel || `Bucket #${index + 1}`,
                                            total: bucket.totalCount,
                                            accepted: bucket.acceptedCount,
                                            errors: bucket.errorCount || 0
                                        })}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    >
                                        <div
                                            className="w-full max-w-[28px] rounded-t-lg bg-brand-orange/40 hover:bg-brand-orange/70 transition-all relative overflow-hidden flex flex-col justify-end"
                                            style={{ height: `${totalHeightPct}%` }}
                                        >
                                            {/* Accepted overlay bar */}
                                            <div
                                                className="w-full bg-emerald-500/80 rounded-t-sm transition-all"
                                                style={{ height: `${acceptedHeightPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* X-Axis labels */}
                        <div className="flex justify-between items-center text-[10px] text-dark-text-tertiary mt-2 border-t border-white/5 pt-2 px-1">
                            <span>{buckets[0]?.timestampLabel || 'Start'}</span>
                            <span>{buckets[Math.floor(buckets.length / 2)]?.timestampLabel || 'Mid'}</span>
                            <span>{buckets[buckets.length - 1]?.timestampLabel || 'Now'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Verdicts and Languages Two-Column Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verdict Distribution */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-base font-bold text-white">Verdict Distribution</h3>
                    <p className="text-xs text-dark-text-secondary">Execution result status breakdown across window</p>

                    <div className="space-y-3 pt-2">
                        {Object.entries(verdictCounts).length === 0 ? (
                            <div className="text-center py-6 text-xs text-dark-text-tertiary">No verdict data in current window</div>
                        ) : (
                            Object.entries(verdictCounts).map(([verdict, count]) => {
                                const style = VERDICT_COLORS[verdict] || VERDICT_COLORS.PENDING;
                                const percentage = totalSubmissions > 0 ? ((count / totalSubmissions) * 100).toFixed(1) : 0;

                                return (
                                    <div key={verdict} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className={`px-2 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}>
                                                {verdict.replace(/_/g, ' ')}
                                            </span>
                                            <div className="flex items-center gap-2 font-mono">
                                                <span className="text-white font-bold">{count.toLocaleString()}</span>
                                                <span className="text-dark-text-tertiary text-[11px]">({percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Language Share */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-base font-bold text-white">Language Share</h3>
                    <p className="text-xs text-dark-text-secondary">Programming language popularity for submissions</p>

                    <div className="space-y-3 pt-2">
                        {Object.entries(languageCounts).length === 0 ? (
                            <div className="text-center py-6 text-xs text-dark-text-tertiary">No language data recorded</div>
                        ) : (
                            Object.entries(languageCounts).map(([langId, count]) => {
                                const label = LANGUAGE_LABELS[langId] || `Language #${langId}`;
                                const percentage = totalSubmissions > 0 ? ((count / totalSubmissions) * 100).toFixed(1) : 0;

                                return (
                                    <div key={langId} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-white">{label}</span>
                                            <div className="flex items-center gap-2 font-mono">
                                                <span className="text-brand-orange font-bold">{count.toLocaleString()}</span>
                                                <span className="text-dark-text-tertiary text-[11px]">({percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full bg-brand-orange/80 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionAnalyticsView;
