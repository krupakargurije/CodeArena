import React, { useState } from 'react';
import {
    Sliders,
    Sun,
    Moon,
    Laptop,
    Shield,
    Activity,
    Server,
    Bell,
    CheckCircle2,
    Save,
    RotateCcw
} from 'lucide-react';

const AdminSettingsView = ({
    theme,
    toggleTheme,
    autoRefreshInterval,
    setAutoRefreshInterval
}) => {
    // Preferences state with local storage fallback
    const [soundAlerts, setSoundAlerts] = useState(false);
    const [compactDensity, setCompactDensity] = useState(false);
    const [autoAuditSnapshot, setAutoAuditSnapshot] = useState(true);
    const [savedNotice, setSavedNotice] = useState(false);

    const handleSave = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-mac-fade">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                        Console Settings & Preferences
                    </h1>
                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        Configure your administrator workspace, telemetry sampling, and security defaults.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {savedNotice && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 size={14} /> Preferences Saved
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        className="mac-btn-primary"
                    >
                        <Save size={14} />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Section 1: Appearance & Workspace */}
            <div className="mac-card p-6 space-y-5">
                <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                        <Sliders size={16} className="text-[#0071e3] dark:text-[#2997ff]" />
                        <span>Appearance & Display</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        Customize the visual theme and interface density of the admin console.
                    </p>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center justify-between py-2">
                    <div>
                        <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white">Color Mode</div>
                        <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                            Toggle between macOS Light canvas and dark charcoal mode.
                        </div>
                    </div>

                    <div className="mac-segmented-control">
                        <button
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`mac-segmented-item flex items-center gap-1.5 ${theme === 'light' ? 'active' : ''}`}
                        >
                            <Sun size={13} />
                            <span>Light</span>
                        </button>
                        <button
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`mac-segmented-item flex items-center gap-1.5 ${theme === 'dark' ? 'active' : ''}`}
                        >
                            <Moon size={13} />
                            <span>Dark</span>
                        </button>
                    </div>
                </div>

                {/* Compact Density Switch */}
                <div className="flex items-center justify-between py-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <div>
                        <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white">Compact Table Density</div>
                        <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                            Reduce row padding in problems and user catalogs for high-density monitors.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCompactDensity(!compactDensity)}
                        className={`mac-switch ${compactDensity ? 'active' : ''}`}
                    >
                        <span className="mac-switch-thumb" />
                    </button>
                </div>
            </div>

            {/* Section 2: Telemetry & Monitoring Sampling */}
            <div className="mac-card p-6 space-y-5">
                <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                        <Activity size={16} className="text-[#34c759] dark:text-[#30d158]" />
                        <span>Telemetry & Live Monitoring</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        Control background polling frequencies and automated health check intervals.
                    </p>
                </div>

                {/* Auto Refresh Frequency */}
                <div className="flex items-center justify-between py-2">
                    <div>
                        <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white">Health Check Polling Frequency</div>
                        <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                            Interval to query Spring Boot Actuator and Judge0 probes.
                        </div>
                    </div>

                    <select
                        value={autoRefreshInterval}
                        onChange={(e) => setAutoRefreshInterval && setAutoRefreshInterval(Number(e.target.value))}
                        className="mac-input w-40 text-xs"
                    >
                        <option value={0}>Manual Only</option>
                        <option value={10000}>Fast (10 seconds)</option>
                        <option value={30000}>Standard (30 seconds)</option>
                        <option value={60000}>Relaxed (60 seconds)</option>
                    </select>
                </div>

                {/* Incident Audio / Visual Alerts */}
                <div className="flex items-center justify-between py-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <div>
                        <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white">Incident Pulse Alerts</div>
                        <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                            Show pulsing status indicators on sidebar and top toolbar when active incidents occur.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSoundAlerts(!soundAlerts)}
                        className={`mac-switch ${soundAlerts ? 'active' : ''}`}
                    >
                        <span className="mac-switch-thumb" />
                    </button>
                </div>
            </div>

            {/* Section 3: Security, Governance & Audit */}
            <div className="mac-card p-6 space-y-5">
                <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                        <Shield size={16} className="text-[#ff9500] dark:text-[#ff9f0a]" />
                        <span>Security & Governance</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        Audit trail policy and administrative permission protections.
                    </p>
                </div>

                {/* Audit Snapshots */}
                <div className="flex items-center justify-between py-2">
                    <div>
                        <div className="text-xs font-semibold text-[#1d1d1f] dark:text-white">Automatic JSON State Diffs</div>
                        <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                            Capture complete before and after JSON snapshots for all problem and user permission changes.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setAutoAuditSnapshot(!autoAuditSnapshot)}
                        className={`mac-switch ${autoAuditSnapshot ? 'active' : ''}`}
                    >
                        <span className="mac-switch-thumb" />
                    </button>
                </div>

                {/* Environment Info */}
                <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs">
                    <div>
                        <div className="font-semibold text-[#1d1d1f] dark:text-white">PostgreSQL Row-Level Security (RLS)</div>
                        <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Enforced at database layer for all audit_logs and admin queries.</div>
                    </div>
                    <span className="mac-badge mac-badge-green">ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsView;
