import React, { useState, useEffect } from 'react';
import {
    Activity,
    Cpu,
    Search,
    RefreshCw,
    Clock,
    Server,
    Layers,
    X,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import { getApiPerformance } from '../../../services/monitoringService';

const ApiPerformanceView = ({ autoRefreshInterval }) => {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPerformance = async () => {
        try {
            setError(null);
            const data = await getApiPerformance();
            setPerformance(data);
        } catch (err) {
            console.error('Failed to load API performance metrics:', err);
            setError(err.message || 'Failed to fetch API performance metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPerformance();
    }, []);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchPerformance, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
        return `${mb.toFixed(1)} MB`;
    };

    const formatUptime = (seconds) => {
        if (!seconds || seconds <= 0) return '0m';
        const days = Math.floor(seconds / 86400);
        const hrs = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hrs}h ${mins}m`;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m ${Math.floor(seconds % 60)}s`;
    };

    if (loading && !performance) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="mac-card p-5 h-28" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && !performance) {
        return (
            <div className="mac-card p-8 text-center space-y-3">
                <AlertCircle size={32} className="text-red-500 mx-auto" />
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Failed to Load API Performance</h3>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] max-w-md mx-auto">{error}</p>
                <button
                    onClick={fetchPerformance}
                    className="mac-btn-primary text-xs"
                >
                    Retry
                </button>
            </div>
        );
    }

    const {
        totalRequests = 0,
        requestsPerMinute = 0,
        requestsPerSecond = 0,
        errorRate4xx = 0,
        errorRate5xx = 0,
        errorRate5xxPercent = 0,
        p50LatencyMs = 0,
        p95LatencyMs = 0,
        p99LatencyMs = 0,
        maxLatencyMs = 0,
        avgLatencyMs = 0,
        statusCodeDistribution = {},
        status2xx = 0,
        status4xx = 0,
        status5xx = 0,
        slowEndpoints = [],
        jvmHeapUsedBytes = 0,
        jvmHeapMaxBytes = 0,
        jvmHeapCommittedBytes = 0,
        jvmMemoryUsedMb = 0,
        jvmMemoryMaxMb = 0,
        activeThreads = 0,
        jvmThreadsActive = 0,
        uptimeSeconds = 0,
    } = performance || {};

    const actual2xx = statusCodeDistribution['2xx'] ?? status2xx ?? 0;
    const actual4xx = statusCodeDistribution['4xx'] ?? status4xx ?? 0;
    const actual5xx = statusCodeDistribution['5xx'] ?? status5xx ?? 0;
    const actualThreads = activeThreads || jvmThreadsActive || 0;
    const actualRpm = requestsPerMinute || (requestsPerSecond * 60) || 0;
    const actualErr5xx = errorRate5xx || errorRate5xxPercent || 0;

    const usedBytes = jvmHeapUsedBytes || (jvmMemoryUsedMb * 1024 * 1024);
    const maxBytes = jvmHeapMaxBytes || (jvmMemoryMaxMb * 1024 * 1024);
    const committedBytes = jvmHeapCommittedBytes || usedBytes;

    const heapUsedPct = maxBytes > 0
        ? Math.min(100, Math.round((usedBytes / maxBytes) * 100))
        : 0;

    const filteredEndpoints = slowEndpoints.filter(ep => {
        const path = ep.path || ep.uriPattern || '';
        const method = ep.method || '';
        return path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            method.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* Header info strip */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                    Latency percentiles, HTTP status code distributions, JVM heap usage, and endpoint profiles.
                </div>
                <div className="flex items-center gap-2">
                    <span className="mac-badge bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#a1a1a6] font-mono">
                        Uptime: <strong className="text-[#1d1d1f] dark:text-white">{formatUptime(uptimeSeconds)}</strong>
                    </span>
                    <span className="mac-badge bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#a1a1a6] font-mono">
                        Threads: <strong className="text-[#1d1d1f] dark:text-white">{actualThreads}</strong>
                    </span>
                </div>
            </div>

            {/* Latency Percentile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        p50 Latency (Median)
                    </div>
                    <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white font-mono">
                        {p50LatencyMs.toFixed(1)} <span className="text-xs font-normal text-[#86868b]">ms</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Normal median flow</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        p95 Latency
                    </div>
                    <div className="text-2xl font-bold text-[#0071e3] dark:text-[#2997ff] font-mono">
                        {p95LatencyMs.toFixed(1)} <span className="text-xs font-normal text-[#86868b]">ms</span>
                    </div>
                    <div className="text-[11px] text-[#0071e3] dark:text-[#2997ff]">95% faster than threshold</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        p99 Latency (Tail)
                    </div>
                    <div className="text-2xl font-bold text-[#ff9500] dark:text-[#ff9f0a] font-mono">
                        {p99LatencyMs.toFixed(1)} <span className="text-xs font-normal text-[#86868b]">ms</span>
                    </div>
                    <div className="text-[11px] text-[#ff9500] dark:text-[#ff9f0a]">1% worst tail latency</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Average Latency
                    </div>
                    <div className="text-2xl font-bold text-[#af52de] dark:text-[#bf5af2] font-mono">
                        {avgLatencyMs.toFixed(1)} <span className="text-xs font-normal text-[#86868b]">ms</span>
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Max: {maxLatencyMs.toFixed(1)} ms</div>
                </div>
            </div>

            {/* Secondary Grid: Throughput, HTTP Status & JVM Memory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* HTTP Status Code Breakdown */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">HTTP Status Breakdown</span>
                        <span className="text-[11px] font-mono text-[#86868b]">{totalRequests} total reqs</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">2xx Success</span>
                            <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">{actual2xx}</span>
                        </div>
                        <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${totalRequests > 0 ? (actual2xx / totalRequests) * 100 : 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[#ff9500] dark:text-[#ff9f0a] font-semibold font-mono">4xx Client Errors</span>
                            <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">{actual4xx}</span>
                        </div>
                        <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[#ff9500] h-full rounded-full transition-all"
                                style={{ width: `${totalRequests > 0 ? (actual4xx / totalRequests) * 100 : 0}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-red-600 dark:text-red-400 font-semibold font-mono">5xx Server Failures</span>
                            <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">{actual5xx}</span>
                        </div>
                        <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-red-500 h-full rounded-full transition-all"
                                style={{ width: `${totalRequests > 0 ? (actual5xx / totalRequests) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* JVM Heap Runtime */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">JVM Heap Memory</span>
                        <span className="mac-badge mac-badge-blue font-mono">{heapUsedPct}% allocated</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[#6e6e73] dark:text-[#a1a1a6]">Heap Used</span>
                            <span className="font-mono font-bold text-[#1d1d1f] dark:text-white">{formatBytes(usedBytes)}</span>
                        </div>
                        <div className="w-full bg-black/[0.05] dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    heapUsedPct > 85 ? 'bg-red-500' :
                                    heapUsedPct > 70 ? 'bg-[#ff9500]' :
                                    'bg-[#0071e3]'
                                }`}
                                style={{ width: `${heapUsedPct}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-1">
                            <span>Committed: {formatBytes(committedBytes)}</span>
                            <span>Max Heap: {formatBytes(maxBytes)}</span>
                        </div>
                    </div>
                </div>

                {/* Throughput */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">Gateway Throughput</span>
                        <span className="mac-badge mac-badge-green font-mono">Active</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        <div>
                            <div className="text-2xl font-bold font-mono text-[#1d1d1f] dark:text-white">
                                {actualRpm.toFixed(0)} <span className="text-xs font-normal text-[#86868b]">req/min</span>
                            </div>
                            <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
                                Instantaneous: {(actualRpm / 60).toFixed(1)} req/sec
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                            <span className="text-[#6e6e73] dark:text-[#a1a1a6]">5xx Error Rate</span>
                            <span className={`font-mono font-bold ${actualErr5xx > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {actualErr5xx.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slow Endpoints Table */}
            <div className="mac-card overflow-hidden">
                <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-bold text-xs text-[#1d1d1f] dark:text-white">
                        Slow Endpoints Profile ({filteredEndpoints.length})
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                        <input
                            type="text"
                            placeholder="Filter endpoint URI..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mac-input pl-7 text-xs"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                            <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#6e6e73] dark:text-[#a1a1a6] font-semibold">
                                <th className="py-2.5 px-4 w-20">Method</th>
                                <th className="py-2.5 px-4 font-sans font-medium">Path / Route Pattern</th>
                                <th className="py-2.5 px-4">Calls</th>
                                <th className="py-2.5 px-4">Avg Latency</th>
                                <th className="py-2.5 px-4">p95</th>
                                <th className="py-2.5 px-4 text-right">Max</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                            {filteredEndpoints.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-[#86868b] font-sans">
                                        No endpoint metrics collected yet.
                                    </td>
                                </tr>
                            ) : (
                                filteredEndpoints.map((ep, idx) => (
                                    <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                                        <td className="py-2.5 px-4">
                                            <span className={`mac-badge ${
                                                ep.method === 'GET' ? 'mac-badge-blue' :
                                                ep.method === 'POST' ? 'mac-badge-green' :
                                                ep.method === 'DELETE' ? 'mac-badge-red' :
                                                'mac-badge-amber'
                                            }`}>
                                                {ep.method}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 font-sans text-[#1d1d1f] dark:text-white truncate max-w-xs">
                                            {ep.path || ep.uriPattern}
                                        </td>
                                        <td className="py-2.5 px-4 text-[#6e6e73] dark:text-[#a1a1a6]">{ep.requestCount || 0}</td>
                                        <td className="py-2.5 px-4 text-[#1d1d1f] dark:text-white font-bold">{(ep.avgLatencyMs ?? ep.avgDurationMs ?? 0).toFixed(1)} ms</td>
                                        <td className="py-2.5 px-4 text-[#0071e3] dark:text-[#2997ff]">{(ep.p95LatencyMs ?? ep.p95DurationMs ?? ep.avgLatencyMs ?? 0).toFixed(1)} ms</td>
                                        <td className="py-2.5 px-4 text-right text-[#af52de] dark:text-[#bf5af2]">{(ep.maxLatencyMs ?? ep.maxDurationMs ?? 0).toFixed(1)} ms</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApiPerformanceView;
