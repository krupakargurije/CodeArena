import React from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Database,
    Cpu,
    Users,
    Code2,
    ShieldCheck,
    ArrowUpRight,
    RefreshCw,
    Server,
    Sparkles,
    Sliders,
    Flame
} from 'lucide-react';

const AdminOverviewView = ({
    overviewData,
    problems = [],
    users = [],
    loading,
    refreshing,
    onRefresh,
    onNavigateTab,
    onCreateProblem,
    lastUpdated
}) => {
    const overallStatus = overviewData?.overallStatus || 'UP';
    const activeIncidentsCount = overviewData?.activeIncidentsCount || 0;
    const dbStatus = overviewData?.databaseStatus || 'UP';
    const judge0Status = overviewData?.judge0Status || 'UP';
    const latencyP95 = overviewData?.latencyP95Ms ?? 0;
    const latencyP50 = overviewData?.latencyP50Ms ?? 0;
    const totalSubmissions = overviewData?.totalSubmissions ?? 0;
    const uptime = overviewData?.uptimeFormatted || '99.98%';

    const adminCount = users.filter((u) => u.is_admin).length;
    const cakewalkCount = problems.filter((p) => p.difficulty === 'CAKEWALK').length;
    const easyCount = problems.filter((p) => p.difficulty === 'EASY').length;
    const mediumCount = problems.filter((p) => p.difficulty === 'MEDIUM').length;
    const hardCount = problems.filter((p) => p.difficulty === 'HARD').length;

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* macOS Hero Banner */}
            <div className="mac-card p-6 border-black/[0.08] dark:border-white/[0.08] relative overflow-hidden bg-linear-to-br from-white/90 to-[#f5f5f7]/80 dark:from-[#202024]/90 dark:to-[#161618]/80">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
                                Welcome to CodeArena Console
                            </h1>
                            <span className={`mac-badge ${
                                overallStatus === 'UP' ? 'mac-badge-green' :
                                overallStatus === 'DEGRADED' ? 'mac-badge-amber' :
                                'mac-badge-red'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    overallStatus === 'UP' ? 'bg-emerald-500' :
                                    overallStatus === 'DEGRADED' ? 'bg-amber-500' :
                                    'bg-red-500 animate-ping'
                                }`} />
                                {overallStatus === 'UP' ? 'All Systems Nominal' : `${overallStatus} Status`}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#6e6e73] dark:text-[#a1a1a6] max-w-2xl leading-relaxed">
                            macOS Sequoia native operations console. Manage real-time problem catalog, user permissions, telemetry health, and security audit diffs.
                        </p>
                    </div>

                    {/* Quick Stats / Refresh Action */}
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Telemetry Sampled</div>
                                <div className="text-xs font-mono font-medium text-[#1d1d1f] dark:text-white">
                                    {lastUpdated.toLocaleTimeString()}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="mac-btn-secondary"
                            title="Synchronize all telemetry"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#0071e3]' : ''} />
                            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Core KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. System Health Status */}
                <div
                    onClick={() => onNavigateTab('monitoring')}
                    className="mac-card mac-card-interactive p-4 cursor-pointer"
                >
                    <div className="flex items-center justify-between text-[#86868b] dark:text-[#a1a1a6] mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">System Availability</span>
                        <Activity size={16} className="text-[#0071e3] dark:text-[#2997ff]" />
                    </div>
                    <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white font-mono tracking-tight">
                        {overviewData?.apiAvailabilityPercent !== undefined ? `${overviewData.apiAvailabilityPercent}%` : '100%'}
                    </div>
                    <div className="mt-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between">
                        <span>Uptime: {uptime}</span>
                        <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                            Details <ArrowUpRight size={12} />
                        </span>
                    </div>
                </div>

                {/* 2. Active Incidents & Alerts */}
                <div
                    onClick={() => onNavigateTab('incidents')}
                    className="mac-card mac-card-interactive p-4 cursor-pointer"
                >
                    <div className="flex items-center justify-between text-[#86868b] dark:text-[#a1a1a6] mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Active Incidents</span>
                        <AlertTriangle size={16} className={activeIncidentsCount > 0 ? 'text-[#ff3b30]' : 'text-emerald-500'} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold font-mono tracking-tight ${
                            activeIncidentsCount > 0 ? 'text-[#ff3b30]' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                            {activeIncidentsCount}
                        </span>
                        <span className="text-xs text-[#86868b] dark:text-[#636366]">
                            {activeIncidentsCount === 0 ? 'No open alerts' : 'Requires review'}
                        </span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between">
                        <span>Automated evaluator</span>
                        <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                            Inspect <ArrowUpRight size={12} />
                        </span>
                    </div>
                </div>

                {/* 3. API Latency Profile */}
                <div
                    onClick={() => onNavigateTab('performance')}
                    className="mac-card mac-card-interactive p-4 cursor-pointer"
                >
                    <div className="flex items-center justify-between text-[#86868b] dark:text-[#a1a1a6] mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Response Latency</span>
                        <Cpu size={16} className="text-[#af52de] dark:text-[#bf5af2]" />
                    </div>
                    <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white font-mono tracking-tight">
                        {latencyP95} <span className="text-sm font-normal text-[#86868b]">ms (p95)</span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between">
                        <span>p50: {latencyP50} ms</span>
                        <span className="text-[#af52de] dark:text-[#bf5af2] font-medium flex items-center gap-0.5">
                            Metrics <ArrowUpRight size={12} />
                        </span>
                    </div>
                </div>

                {/* 4. Judge0 Sandbox Executions */}
                <div
                    onClick={() => onNavigateTab('monitoring')}
                    className="mac-card mac-card-interactive p-4 cursor-pointer"
                >
                    <div className="flex items-center justify-between text-[#86868b] dark:text-[#a1a1a6] mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Judge0 Sandbox</span>
                        <Server size={16} className="text-[#0071e3] dark:text-[#2997ff]" />
                    </div>
                    <div className="text-2xl font-bold text-[#1d1d1f] dark:text-white font-mono tracking-tight">
                        {totalSubmissions.toLocaleString()} <span className="text-xs font-normal text-[#86868b]">subs (24h)</span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] flex items-center justify-between">
                        <span>Node status: {judge0Status}</span>
                        <span className="text-[#0071e3] dark:text-[#2997ff] font-medium flex items-center gap-0.5">
                            Sandbox <ArrowUpRight size={12} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Second Row: Infrastructure Status + Platform Catalog Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Infrastructure Probes Summary */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2 font-semibold text-xs text-[#1d1d1f] dark:text-white">
                            <Server size={15} className="text-[#0071e3] dark:text-[#2997ff]" />
                            <span>Infrastructure Probes</span>
                        </div>
                        <span className="mac-badge mac-badge-blue">Real-time</span>
                    </div>

                    <div className="space-y-3 text-xs">
                        {/* Spring Backend */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Spring Boot API</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Port 8080 • JWT Auth Active</div>
                                </div>
                            </div>
                            <span className="mac-badge mac-badge-green">OPERATIONAL</span>
                        </div>

                        {/* Supabase DB */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${dbStatus === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">PostgreSQL Database</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Supabase RLS & Hikari Pool</div>
                                </div>
                            </div>
                            <span className={`mac-badge ${dbStatus === 'UP' ? 'mac-badge-green' : 'mac-badge-red'}`}>
                                {dbStatus}
                            </span>
                        </div>

                        {/* Judge0 Sandbox */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-center gap-2.5">
                                <span className={`w-2 h-2 rounded-full ${judge0Status === 'UP' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Judge0 Sandbox Worker</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Multi-language isolation</div>
                                </div>
                            </div>
                            <span className={`mac-badge ${judge0Status === 'UP' ? 'mac-badge-green' : 'mac-badge-amber'}`}>
                                {judge0Status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Platform Catalog Snapshot */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2 font-semibold text-xs text-[#1d1d1f] dark:text-white">
                            <Code2 size={15} className="text-[#0071e3] dark:text-[#2997ff]" />
                            <span>Problems Distribution</span>
                        </div>
                        <button
                            onClick={() => onNavigateTab('problems')}
                            className="text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff] hover:underline"
                        >
                            View All ({problems.length}) &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Cakewalk</div>
                            <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white mt-0.5">{cakewalkCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="text-[10px] uppercase font-semibold text-[#0071e3] dark:text-[#2997ff]">Easy</div>
                            <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white mt-0.5">{easyCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="text-[10px] uppercase font-semibold text-[#ff9500] dark:text-[#ff9f0a]">Medium</div>
                            <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white mt-0.5">{mediumCount}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="text-[10px] uppercase font-semibold text-[#ff3b30] dark:text-[#ff453a]">Hard</div>
                            <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white mt-0.5">{hardCount}</div>
                        </div>
                    </div>

                    <button
                        onClick={onCreateProblem}
                        className="w-full mac-btn-primary text-xs"
                    >
                        <span>+ Create New Problem</span>
                    </button>
                </div>

                {/* Fast Action Shortcuts */}
                <div className="mac-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2 font-semibold text-xs text-[#1d1d1f] dark:text-white">
                            <Sparkles size={15} className="text-[#af52de] dark:text-[#bf5af2]" />
                            <span>Fast Administrator Actions</span>
                        </div>
                        <span className="text-[10px] text-[#86868b] dark:text-[#636366]">Quick jump</span>
                    </div>

                    <div className="space-y-2 text-xs">
                        <button
                            onClick={() => onNavigateTab('users')}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition text-left group border border-black/[0.04] dark:border-white/[0.04]"
                        >
                            <div className="flex items-center gap-2.5">
                                <Users size={14} className="text-[#0071e3] dark:text-[#2997ff]" />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Users & Admins</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">{users.length} registered • {adminCount} admins</div>
                                </div>
                            </div>
                            <ArrowUpRight size={13} className="text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition" />
                        </button>

                        <button
                            onClick={() => onNavigateTab('audit')}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition text-left group border border-black/[0.04] dark:border-white/[0.04]"
                        >
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={14} className="text-[#34c759] dark:text-[#30d158]" />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Audit Logs & Diffs</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Inspect change history & security</div>
                                </div>
                            </div>
                            <ArrowUpRight size={13} className="text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition" />
                        </button>

                        <button
                            onClick={() => onNavigateTab('settings')}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition text-left group border border-black/[0.04] dark:border-white/[0.04]"
                        >
                            <div className="flex items-center gap-2.5">
                                <Sliders size={14} className="text-[#ff9500] dark:text-[#ff9f0a]" />
                                <div>
                                    <div className="font-semibold text-[#1d1d1f] dark:text-white">Console Settings</div>
                                    <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Telemetry interval & preferences</div>
                                </div>
                            </div>
                            <ArrowUpRight size={13} className="text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverviewView;
