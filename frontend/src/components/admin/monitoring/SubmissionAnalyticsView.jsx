import React, { useState, useEffect } from 'react';
import {
    BarChart2,
    Calendar,
    Clock,
    RefreshCw,
    Code2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Layers,
    ArrowUpRight
} from 'lucide-react';
import { getSubmissionAnalytics } from '../../../services/monitoringService';

const TIME_RANGES = [
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'All Time', value: 'all' },
];

const VERDICT_THEMES = {
    ACCEPTED: { badgeClass: 'mac-badge-green', label: 'Accepted (AC)', barClass: 'bg-emerald-500' },
    WRONG_ANSWER: { badgeClass: 'mac-badge-red', label: 'Wrong Answer (WA)', barClass: 'bg-red-500' },
    TIME_LIMIT_EXCEEDED: { badgeClass: 'mac-badge-amber', label: 'Time Limit (TLE)', barClass: 'bg-[#ff9500]' },
    RUNTIME_ERROR: { badgeClass: 'mac-badge-purple', label: 'Runtime Error (RTE)', barClass: 'bg-[#af52de]' },
    COMPILATION_ERROR: { badgeClass: 'mac-badge-blue', label: 'Compile Error (CE)', barClass: 'bg-[#0071e3]' },
    PLATFORM_ERROR: { badgeClass: 'mac-badge-red', label: 'Platform Failure', barClass: 'bg-red-600' },
    PENDING: { badgeClass: 'mac-badge-blue', label: 'Pending in Queue', barClass: 'bg-gray-400' },
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

    const {
        totalSubmissions = 0,
        acceptedCount = 0,
        wrongAnswerCount = 0,
        compilationErrors = 0,
        runtimeErrors = 0,
        timeLimitExceeded = 0,
        platformErrors = 0,
        acceptanceRatePercent = 0,
        averageExecutionTimeMs = 0,
        averageMemoryKb = 0,
        languageBreakdown = {},
        verdictDistribution = {},
    } = analytics || {};

    const actualAcRate = totalSubmissions > 0
        ? ((acceptedCount / totalSubmissions) * 100).toFixed(1)
        : (acceptanceRatePercent || 0).toFixed(1);

    const safeVerdicts = Object.keys(verdictDistribution).length > 0
        ? verdictDistribution
        : {
            ACCEPTED: acceptedCount,
            WRONG_ANSWER: wrongAnswerCount,
            TIME_LIMIT_EXCEEDED: timeLimitExceeded,
            RUNTIME_ERROR: runtimeErrors,
            COMPILATION_ERROR: compilationErrors,
            PLATFORM_ERROR: platformErrors,
        };

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* Range Selector Bar */}
            <div className="mac-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="mac-segmented-control shrink-0">
                    {TIME_RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setTimeRange(r.value)}
                            className={`mac-segmented-item ${timeRange === r.value ? 'active' : ''}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => fetchAnalytics(timeRange)}
                    disabled={loading}
                    className="mac-btn-secondary text-xs self-end sm:self-auto"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin text-[#0071e3]' : ''} />
                    <span>Refresh Analytics</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Total Submissions
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1d1d1f] dark:text-white">
                        {totalSubmissions.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Evaluated by Judge0</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Acceptance Rate
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {actualAcRate}%
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{acceptedCount} passing solutions</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Avg Execution Time
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
                        {averageExecutionTimeMs.toFixed(0)} <span className="text-xs font-normal text-[#86868b]">ms</span>
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Sandbox run duration</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Platform Error Rate
                    </div>
                    <div className={`text-2xl font-bold font-mono ${platformErrors > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {totalSubmissions > 0 ? ((platformErrors / totalSubmissions) * 100).toFixed(2) : '0.00'}%
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">{platformErrors} infrastructure errors</div>
                </div>
            </div>

            {/* Verdicts and Language Distribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verdicts Progress Bars */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">Verdict Breakdown</span>
                        <span className="text-[11px] font-mono text-[#86868b]">{totalSubmissions} samples</span>
                    </div>

                    <div className="space-y-3.5">
                        {Object.entries(safeVerdicts).map(([verdictKey, count]) => {
                            const config = VERDICT_THEMES[verdictKey] || { badgeClass: 'mac-badge-blue', label: verdictKey, barClass: 'bg-gray-400' };
                            const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;

                            return (
                                <div key={verdictKey} className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-[#1d1d1f] dark:text-white">{config.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[#86868b]">{count}</span>
                                            <span className={`mac-badge ${config.badgeClass} text-[10px]`}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`${config.barClass} h-full rounded-full transition-all duration-300`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Language Breakdown */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">Language Breakdown</span>
                        <span className="text-[11px] font-mono text-[#86868b]">Compilers</span>
                    </div>

                    {Object.keys(languageBreakdown).length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#86868b]">
                            No language telemetry recorded for this timeframe.
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {Object.entries(languageBreakdown).map(([langId, count]) => {
                                const name = LANGUAGE_LABELS[langId] || `Language #${langId}`;
                                const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0;

                                return (
                                    <div key={langId} className="space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-[#1d1d1f] dark:text-white">{name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[#86868b]">{count}</span>
                                                <span className="mac-badge mac-badge-blue text-[10px]">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#0071e3] h-full rounded-full transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionAnalyticsView;
