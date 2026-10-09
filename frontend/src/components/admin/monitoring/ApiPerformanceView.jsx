import React, { useState, useEffect } from 'react';
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
                        <div key={i} className="glass-panel p-5 h-28 rounded-2xl bg-white/5" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 h-64 rounded-2xl bg-white/5" />
                    <div className="glass-panel p-6 h-64 rounded-2xl bg-white/5 lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (error && !performance) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Failed to Load API Performance Metrics</h3>
                <p className="text-dark-text-secondary text-sm max-w-md mx-auto">{error}</p>
                <button
                    onClick={fetchPerformance}
                    className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-sm font-semibold transition"
                >
                    Retry Loading
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

    const actualMaxLatency = maxLatencyMs || p99LatencyMs || avgLatencyMs || 0;

    const filteredEndpoints = slowEndpoints.filter(ep => {
        const path = ep.path || ep.uriPattern || '';
        const method = ep.method || '';
        return path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            method.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>API Gateway & Runtime Performance</span>
                    </h2>
                    <p className="text-xs text-dark-text-secondary mt-0.5">
                        Latency percentiles, HTTP status code distributions, JVM heap usage, and endpoint profiles.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-dark-text-secondary">
                        Uptime: <span className="text-white font-bold">{formatUptime(uptimeSeconds)}</span>
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-dark-text-secondary">
                        Threads: <span className="text-white font-bold">{actualThreads}</span>
                    </span>
                </div>
            </div>

            {/* Latency Percentile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="text-xs font-semibold text-dark-text-tertiary uppercase tracking-wider mb-1">p50 Latency (Median)</div>
                    <div className="text-3xl font-bold text-white font-mono">
                        {p50LatencyMs.toFixed(1)} <span className="text-sm font-normal text-dark-text-tertiary">ms</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 mt-1">Normal user experience</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-sky-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-sky-400/90 uppercase tracking-wider mb-1">p95 Latency</div>
                    <div className="text-3xl font-bold text-sky-400 font-mono">
                        {p95LatencyMs.toFixed(1)} <span className="text-sm font-normal text-sky-300">ms</span>
                    </div>
                    <div className="text-[11px] text-sky-400/70 mt-1">95% of calls faster than this</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-amber-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-1">p99 Latency (Tail)</div>
                    <div className="text-3xl font-bold text-amber-400 font-mono">
                        {p99LatencyMs.toFixed(1)} <span className="text-sm font-normal text-amber-300">ms</span>
                    </div>
                    <div className="text-[11px] text-amber-400/70 mt-1">Tail latency outlier bound</div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-red-500/10 relative overflow-hidden">
                    <div className="text-xs font-semibold text-red-400/90 uppercase tracking-wider mb-1">Max Observed Latency</div>
                    <div className="text-3xl font-bold text-red-400 font-mono">
                        {actualMaxLatency.toFixed(1)} <span className="text-sm font-normal text-red-300">ms</span>
                    </div>
                    <div className="text-[11px] text-red-400/70 mt-1">Peak execution duration</div>
                </div>
            </div>

            {/* Runtime & HTTP Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* JVM Heap Utilization */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-white">JVM Memory Utilization</h3>
                        <span className="text-xs font-mono font-bold text-brand-orange">{heapUsedPct}%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${heapUsedPct > 85 ? 'bg-red-500' : heapUsedPct > 70 ? 'bg-amber-500' : 'bg-brand-orange'
                                    }`}
                                style={{ width: `${heapUsedPct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-dark-text-secondary font-mono">
                            <span>Used: {formatBytes(usedBytes)}</span>
                            <span>Max: {formatBytes(maxBytes)}</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-dark-text-secondary">
                            <span>Committed Heap:</span>
                            <span className="text-white font-mono">{formatBytes(committedBytes)}</span>
                        </div>
                        <div className="flex justify-between text-dark-text-secondary">
                            <span>Total HTTP Requests:</span>
                            <span className="text-white font-mono">{totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-dark-text-secondary">
                            <span>Throughput:</span>
                            <span className="text-white font-mono">{actualRpm.toFixed(1)} req/min</span>
                        </div>
                    </div>
                </div>

                {/* HTTP Status Code Distribution */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
                    <h3 className="text-base font-bold text-white">HTTP Status Code Distribution</h3>
                    <p className="text-xs text-dark-text-secondary">Categorized HTTP response codes from the API gateway</p>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">2xx Success</div>
                            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                                {actual2xx.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-400/70 mt-1">Healthy Responses</div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">4xx Client Error</div>
                            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                                {actual4xx.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-400/70 mt-1">{errorRate4xx.toFixed(2)}% of requests</div>
                        </div>

                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">5xx Server Error</div>
                            <div className="text-2xl font-bold text-red-400 font-mono mt-1">
                                {actual5xx.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-red-400/70 mt-1">{actualErr5xx.toFixed(2)}% of requests</div>
                        </div>
                    </div>

                    <div className="text-[11px] text-dark-text-tertiary pt-2 border-t border-white/5">
                        * Note: High-cardinality URI paths (UUIDs and IDs) are normalized to <code className="text-brand-orange bg-black/40 px-1 py-0.5 rounded">&#123;id&#125;</code> to prevent unbounded memory usage.
                    </div>
                </div>
            </div>

            {/* Slow Endpoints Table */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-base font-bold text-white">Endpoint Performance Profiles</h3>
                        <p className="text-xs text-dark-text-secondary">Monitored routes ranked by request volume and latency</p>
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Filter endpoints..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-dark-bg-secondary border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-dark-text-tertiary focus:outline-none focus:border-brand-orange transition"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-dark-text-tertiary uppercase font-semibold">
                                <th className="py-3 px-3">Method</th>
                                <th className="py-3 px-3">Endpoint Path</th>
                                <th className="py-3 px-3 text-right">Total Calls</th>
                                <th className="py-3 px-3 text-right">Avg Latency</th>
                                <th className="py-3 px-3 text-right">Max Latency</th>
                                <th className="py-3 px-3 text-right">5xx Errors</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {filteredEndpoints.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-dark-text-tertiary">
                                        No API endpoints recorded yet in current process uptime.
                                    </td>
                                </tr>
                            ) : (
                                filteredEndpoints.map((ep, idx) => {
                                    const path = ep.path || ep.uriPattern || '/';
                                    const avgLatency = ep.avgLatencyMs ?? ep.avgDurationMs ?? 0;
                                    const maxLatency = ep.maxLatencyMs ?? ep.maxDurationMs ?? 0;
                                    const err5xx = ep.errorCount5xx ?? 0;

                                    return (
                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.method === 'GET' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                                    ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        ep.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {ep.method}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 font-semibold text-white truncate max-w-xs">{path}</td>
                                            <td className="py-3 px-3 text-right text-dark-text-secondary">{(ep.requestCount || 0).toLocaleString()}</td>
                                            <td className="py-3 px-3 text-right text-white">
                                                {avgLatency.toFixed(1)} ms
                                            </td>
                                            <td className="py-3 px-3 text-right text-dark-text-secondary">
                                                {maxLatency.toFixed(1)} ms
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                {err5xx > 0 ? (
                                                    <span className="text-red-400 font-bold">{err5xx}</span>
                                                ) : (
                                                    <span className="text-emerald-400/80">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApiPerformanceView;
