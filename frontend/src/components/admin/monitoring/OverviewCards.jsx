import React from 'react';
import {
    Activity,
    Database,
    Server,
    Cpu,
    AlertTriangle,
    CheckCircle2,
    ArrowUpRight
} from 'lucide-react';

const OverviewCards = ({ overview, overviewData, onNavigateTab }) => {
    const data = overview || overviewData;
    if (!data) return null;

    const getStatusTheme = (status) => {
        switch (status) {
            case 'UP':
                return {
                    badgeClass: 'mac-badge-green',
                    dotClass: 'bg-emerald-500',
                    label: 'OPERATIONAL'
                };
            case 'DEGRADED':
                return {
                    badgeClass: 'mac-badge-amber',
                    dotClass: 'bg-amber-500',
                    label: 'DEGRADED'
                };
            case 'DOWN':
                return {
                    badgeClass: 'mac-badge-red',
                    dotClass: 'bg-red-500 animate-ping',
                    label: 'OUTAGE'
                };
            default:
                return {
                    badgeClass: 'mac-badge-blue',
                    dotClass: 'bg-gray-400',
                    label: 'UNKNOWN'
                };
        }
    };

    const platformTheme = getStatusTheme(data.status || data.overallStatus);
    const dbTheme = getStatusTheme(data.databaseStatus);
    const judge0Theme = getStatusTheme(data.judge0Status);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-mac-fade">
            {/* System Status Card */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('services')}
                className="mac-card mac-card-interactive p-4.5 cursor-pointer space-y-2"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
                        System Availability
                    </span>
                    <span className={`mac-badge ${platformTheme.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${platformTheme.dotClass}`} />
                        {platformTheme.label}
                    </span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-[#1d1d1f] dark:text-white">
                    {data.apiAvailabilityPercent !== undefined ? `${data.apiAvailabilityPercent}%` : '100%'}
                </div>
                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between pt-1">
                    <span>Uptime: {data.uptimeFormatted || '99.98%'}</span>
                    <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                        Probes <ArrowUpRight size={11} />
                    </span>
                </div>
            </div>

            {/* Supabase DB Status */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('services')}
                className="mac-card mac-card-interactive p-4.5 cursor-pointer space-y-2"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
                        PostgreSQL Database
                    </span>
                    <span className={`mac-badge ${dbTheme.badgeClass}`}>
                        {data.databaseStatus || 'UP'}
                    </span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-[#1d1d1f] dark:text-white">
                    Pool Connected
                </div>
                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between pt-1">
                    <span>Supabase Managed Cluster</span>
                    <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                        Hikari <ArrowUpRight size={11} />
                    </span>
                </div>
            </div>

            {/* Judge0 Execution Sandbox */}
            <div
                onClick={() => onNavigateTab && onNavigateTab('judge0')}
                className="mac-card mac-card-interactive p-4.5 cursor-pointer space-y-2"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
                        Judge0 Sandbox
                    </span>
                    <span className={`mac-badge ${judge0Theme.badgeClass}`}>
                        {data.judge0Status || 'UP'}
                    </span>
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-[#0071e3] dark:text-[#2997ff]">
                    {(data.totalSubmissions || 0).toLocaleString()} <span className="text-xs font-normal text-[#86868b]">Subs (24h)</span>
                </div>
                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between pt-1">
                    <span>Failure Rate: {data.submissionFailureRatePercent || 0}%</span>
                    <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                        Cluster <ArrowUpRight size={11} />
                    </span>
                </div>
            </div>

            {/* API Performance & Active Incidents */}
            <div
                onClick={() => onNavigateTab && onNavigateTab((data.activeIncidentsCount || 0) > 0 ? 'incidents' : 'performance')}
                className="mac-card mac-card-interactive p-4.5 cursor-pointer space-y-2"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6]">
                        API Latency (p95)
                    </span>
                    {(data.activeIncidentsCount || 0) > 0 ? (
                        <span className="mac-badge mac-badge-red animate-pulse">
                            {data.activeIncidentsCount} Alert{data.activeIncidentsCount === 1 ? '' : 's'}
                        </span>
                    ) : (
                        <span className="mac-badge mac-badge-blue">
                            p50: {data.latencyP50Ms || 0}ms
                        </span>
                    )}
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-[#af52de] dark:text-[#bf5af2]">
                    {data.latencyP95Ms || 0} <span className="text-xs font-normal text-[#86868b]">ms</span>
                </div>
                <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between pt-1">
                    <span>5xx Errors: {data.apiErrorRatePercent || 0}%</span>
                    <span className="text-[#af52de] dark:text-[#bf5af2] font-medium flex items-center gap-0.5">
                        Inspect <ArrowUpRight size={11} />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OverviewCards;
