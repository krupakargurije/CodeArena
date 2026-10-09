import React from 'react';

const OverviewCards = ({ overview, overviewData, onNavigateTab }) => {
    const data = overview || overviewData;
    if (!data) return null;

    const getStatusTheme = (status) => {
        switch (status) {
            case 'UP':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    text: 'text-emerald-400',
                    indicator: 'bg-emerald-400',
                    label: 'OPERATIONAL'
                };
            case 'DEGRADED':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    text: 'text-amber-400',
                    indicator: 'bg-amber-400',
                    label: 'DEGRADED'
                };
            case 'DOWN':
                return {
                    bg: 'bg-rose-500/10',
                    border: 'border-rose-500/20',
                    text: 'text-rose-400',
                    indicator: 'bg-rose-400',
                    label: 'OUTAGE'
                };
            default:
                return {
                    bg: 'bg-gray-500/10',
                    border: 'border-gray-500/20',
                    text: 'text-gray-400',
                    indicator: 'bg-gray-400',
                    label: 'UNKNOWN'
                };
        }
    };

    const platformTheme = getStatusTheme(data.status);
    const dbTheme = getStatusTheme(data.databaseStatus);
    const judge0Theme = getStatusTheme(data.judge0Status);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* System Status Card */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('services')}
                className={`glass-panel p-5 rounded-xl border ${platformTheme.border} cursor-pointer hover:border-brand-orange/40 transition-all`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-tertiary">
                        System Health
                    </span>
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${platformTheme.bg} ${platformTheme.text}`}>
                        <span className={`w-2 h-2 rounded-full ${platformTheme.indicator} animate-pulse`}></span>
                        {platformTheme.label}
                    </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                    {data.apiAvailabilityPercent !== undefined ? `${data.apiAvailabilityPercent}%` : '100%'}
                </div>
                <div className="text-xs text-dark-text-secondary flex items-center justify-between">
                    <span>Uptime: {data.uptimeFormatted || 'N/A'}</span>
                    <span className="text-brand-orange text-[11px] font-medium">Services &rarr;</span>
                </div>
            </div>

            {/* Supabase DB Status */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('services')}
                className="glass-panel p-5 rounded-xl border border-white/5 cursor-pointer hover:border-brand-orange/40 transition-all"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-tertiary">
                        PostgreSQL Database
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dbTheme.bg} ${dbTheme.text}`}>
                        {data.databaseStatus || 'UNKNOWN'}
                    </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                    Pool Connected
                </div>
                <div className="text-xs text-dark-text-secondary">
                    Supabase Managed Cluster
                </div>
            </div>

            {/* Judge0 Execution Sandbox */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('judge0')}
                className="glass-panel p-5 rounded-xl border border-white/5 cursor-pointer hover:border-brand-orange/40 transition-all"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-tertiary">
                        Judge0 Sandbox
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${judge0Theme.bg} ${judge0Theme.text}`}>
                        {data.judge0Status || 'UNKNOWN'}
                    </span>
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                    {(data.totalSubmissions || 0).toLocaleString()} Subs (24h)
                </div>
                <div className="text-xs text-dark-text-secondary flex items-center justify-between">
                    <span>Platform Err: {data.submissionFailureRatePercent || 0}%</span>
                    <span className="text-blue-400 text-[11px] font-medium">Ops &rarr;</span>
                </div>
            </div>

            {/* API Performance & Active Incidents */}
            <div
                onClick={() => onNavigateTab && onNavigateTab((data.activeIncidentsCount || 0) > 0 ? 'incidents' : 'performance')}
                className="glass-panel p-5 rounded-xl border border-white/5 cursor-pointer hover:border-brand-orange/40 transition-all"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-dark-text-tertiary">
                        API Latency (p95)
                    </span>
                    {(data.activeIncidentsCount || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                            {data.activeIncidentsCount} Alert{data.activeIncidentsCount === 1 ? '' : 's'}
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-gray-300">
                            p50: {data.latencyP50Ms || 0}ms
                        </span>
                    )}
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                    {data.latencyP95Ms || 0} ms
                </div>
                <div className="text-xs text-dark-text-secondary flex items-center justify-between">
                    <span>5xx Error Rate: {data.apiErrorRatePercent || 0}%</span>
                    <span className="text-purple-400 text-[11px] font-medium">Inspect &rarr;</span>
                </div>
            </div>
        </div>
    );
};

export default OverviewCards;
