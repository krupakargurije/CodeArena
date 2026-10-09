import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Clock,
    RefreshCw,
    X,
    Filter,
    MessageSquare,
    Activity,
    Check,
    ChevronRight,
    CheckCheck,
    Database,
    Cpu,
    Server
} from 'lucide-react';
import { getIncidents, acknowledgeIncident, resolveIncident } from '../../../services/monitoringService';

const SEVERITY_CONFIG = {
    CRITICAL: {
        badgeClass: 'mac-badge-red',
        dot: 'bg-red-500',
        label: 'CRITICAL',
    },
    WARNING: {
        badgeClass: 'mac-badge-amber',
        dot: 'bg-amber-500',
        label: 'WARNING',
    },
    INFO: {
        badgeClass: 'mac-badge-blue',
        dot: 'bg-blue-500',
        label: 'INFO',
    },
};

const STATUS_CONFIG = {
    OPEN: { badgeClass: 'mac-badge-red', label: 'OPEN' },
    ACKNOWLEDGED: { badgeClass: 'mac-badge-amber', label: 'ACKNOWLEDGED' },
    RESOLVED: { badgeClass: 'mac-badge-green', label: 'RESOLVED' },
};

const getIncidentFriendlyDetails = (incident) => {
    const key = incident.incidentKey || '';
    let fallbackTitle = incident.title;
    let fallbackDesc = incident.description;

    if (!fallbackTitle) {
        if (key === 'DATABASE_UNAVAILABLE') fallbackTitle = 'PostgreSQL Database Connectivity Failure';
        else if (key === 'ELEVATED_API_LATENCY') fallbackTitle = 'Elevated API Response Latency';
        else if (key === 'JUDGE0_DOWN') fallbackTitle = 'Judge0 Sandbox Engine Unreachable';
        else if (key === 'HIGH_5XX_ERROR_RATE') fallbackTitle = 'High 5xx HTTP Server Error Rate';
        else fallbackTitle = key.replace(/_/g, ' ');
    }

    if (!fallbackDesc) {
        if (key === 'DATABASE_UNAVAILABLE') fallbackDesc = 'Validation probe to Supabase PostgreSQL cluster failed or timed out.';
        else if (key === 'ELEVATED_API_LATENCY') fallbackDesc = 'API request response time exceeded the p95 latency threshold of 2,000 ms.';
        else if (key === 'JUDGE0_DOWN') fallbackDesc = 'Code evaluation sandbox worker is offline or failing health probes.';
        else if (key === 'HIGH_5XX_ERROR_RATE') fallbackDesc = 'Server returned 5xx status codes on more than 5% of incoming API requests.';
        else fallbackDesc = 'Operational anomaly flagged by system background health monitors.';
    }

    return { title: fallbackTitle, description: fallbackDesc };
};

const IncidentsManager = ({ autoRefreshInterval }) => {
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [ackTarget, setAckTarget] = useState(null);
    const [ackNote, setAckNote] = useState('');
    const [resolveTarget, setResolveTarget] = useState(null);
    const [resolveNote, setResolveNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [resolvingAll, setResolvingAll] = useState(false);

    const fetchIncidents = async () => {
        try {
            setError(null);
            const data = await getIncidents(statusFilter, 0, 50);
            setIncidents(data.content || []);
        } catch (err) {
            console.error('Failed to load incidents:', err);
            setError(err.message || 'Failed to fetch incident log');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchIncidents();
    }, [statusFilter]);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchIncidents, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval, statusFilter]);

    const handleAcknowledge = async (e) => {
        e.preventDefault();
        if (!ackTarget) return;
        setActionLoading(true);
        try {
            await acknowledgeIncident(ackTarget.id, ackNote);
            setAckTarget(null);
            setAckNote('');
            // Optimistic update
            setIncidents((prev) =>
                prev.map((i) => (i.id === ackTarget.id ? { ...i, status: 'ACKNOWLEDGED' } : i))
            );
            fetchIncidents();
        } catch (err) {
            console.error('Failed to acknowledge incident:', err);
            alert(err.message || 'Failed to acknowledge incident');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!resolveTarget) return;
        setActionLoading(true);
        try {
            await resolveIncident(resolveTarget.id, resolveNote);
            setResolveTarget(null);
            setResolveNote('');
            // Optimistic update
            setIncidents((prev) =>
                prev.map((i) =>
                    i.id === resolveTarget.id
                        ? { ...i, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
                        : i
                )
            );
            fetchIncidents();
        } catch (err) {
            console.error('Failed to resolve incident:', err);
            alert(err.message || 'Failed to resolve incident');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolveAllActive = async () => {
        const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
        if (activeIncidents.length === 0) return;
        if (!confirm(`Resolve all ${activeIncidents.length} active incidents?`)) return;

        setResolvingAll(true);
        try {
            await Promise.all(
                activeIncidents.map((i) =>
                    resolveIncident(i.id, 'Resolved via Administrator Console bulk action')
                )
            );
            // Optimistically mark all as resolved
            setIncidents((prev) =>
                prev.map((i) => ({
                    ...i,
                    status: 'RESOLVED',
                    resolvedAt: new Date().toISOString()
                }))
            );
            fetchIncidents();
        } catch (err) {
            console.error('Failed to resolve all incidents:', err);
            alert(err.message || 'Failed to resolve all incidents');
        } finally {
            setResolvingAll(false);
        }
    };

    const filteredIncidents = incidents.filter((inc) => {
        if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
        return true;
    });

    const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* Filter Controls & Bulk Action Bar */}
            <div className="mac-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
                    <div className="mac-segmented-control shrink-0">
                        {['ACTIVE', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`mac-segmented-item ${statusFilter === st ? 'active' : ''}`}
                            >
                                {st.charAt(0) + st.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="mac-input w-36 text-xs shrink-0"
                    >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical Only</option>
                        <option value="WARNING">Warning Only</option>
                        <option value="INFO">Info Only</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                        <button
                            onClick={handleResolveAllActive}
                            disabled={resolvingAll}
                            className="mac-btn-secondary text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
                            title="Resolve all active incidents"
                        >
                            <CheckCheck size={13} className={resolvingAll ? 'animate-spin' : ''} />
                            <span>{resolvingAll ? 'Resolving...' : `Resolve All (${activeCount})`}</span>
                        </button>
                    )}

                    <button
                        onClick={fetchIncidents}
                        disabled={loading}
                        className="mac-btn-secondary text-xs"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-[#0071e3]' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Incidents List */}
            {loading ? (
                <div className="mac-card p-12 text-center text-xs text-[#86868b]">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3] mb-2" />
                    <div>Querying active incidents...</div>
                </div>
            ) : filteredIncidents.length === 0 ? (
                <div className="mac-card p-12 text-center text-xs text-[#86868b] space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                    <div className="font-bold text-sm text-[#1d1d1f] dark:text-white">All Systems Nominal</div>
                    <div className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        No operational incidents matching the selected filter.
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredIncidents.map((incident) => {
                        const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.INFO;
                        const st = STATUS_CONFIG[incident.status] || STATUS_CONFIG.OPEN;
                        const details = getIncidentFriendlyDetails(incident);

                        return (
                            <div
                                key={incident.id}
                                className="mac-card p-5 space-y-3"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className={`mac-badge ${sev.badgeClass}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                                            {incident.severity}
                                        </span>
                                        <span className={`mac-badge ${st.badgeClass}`}>
                                            {incident.status}
                                        </span>
                                        <span className="font-mono text-xs font-semibold text-[#1d1d1f] dark:text-white">
                                            {incident.incidentKey || `INCIDENT-${incident.id}`}
                                        </span>
                                        {incident.occurrenceCount > 1 && (
                                            <span className="mac-badge bg-black/[0.05] dark:bg-white/[0.08] text-[#86868b]">
                                                {incident.occurrenceCount}x occurred
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {incident.status === 'OPEN' && (
                                            <button
                                                onClick={() => setAckTarget(incident)}
                                                className="mac-btn-secondary text-xs py-1 px-2.5"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                        {incident.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => setResolveTarget(incident)}
                                                className="mac-btn-primary text-xs py-1 px-2.5"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Incident Title & Descriptive Diagnostic Text */}
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                                        {details.title}
                                    </div>
                                    <div className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
                                        {details.description}
                                    </div>
                                </div>

                                {/* Timestamps and Diagnostic Strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#86868b] dark:text-[#636366] pt-1 font-mono">
                                    <div>
                                        <span>First seen: </span>
                                        <span className="text-[#1d1d1f] dark:text-white">
                                            {incident.firstSeenAt ? new Date(incident.firstSeenAt).toLocaleTimeString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span>Last seen: </span>
                                        <span className="text-[#1d1d1f] dark:text-white">
                                            {incident.lastSeenAt ? new Date(incident.lastSeenAt).toLocaleTimeString() : 'N/A'}
                                        </span>
                                    </div>
                                    {incident.resolvedAt && (
                                        <div>
                                            <span>Resolved: </span>
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                {new Date(incident.resolvedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    {incident.resolvedBy && (
                                        <div>
                                            <span>Resolver: </span>
                                            <span className="text-[#1d1d1f] dark:text-white">
                                                {incident.resolvedBy}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Acknowledge Incident Modal Sheet */}
            {ackTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in select-none">
                    <div className="mac-card max-w-md w-full p-6 shadow-2xl border-black/[0.1] dark:border-white/[0.1] animate-mac-scale space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <ShieldAlert size={16} className="text-[#ff9500]" />
                                <span>Acknowledge Incident #{ackTarget.id}</span>
                            </h3>
                            <button onClick={() => setAckTarget(null)} className="text-[#86868b] hover:text-[#1d1d1f]">
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleAcknowledge} className="space-y-3 text-xs">
                            <p className="text-[#6e6e73] dark:text-[#a1a1a6]">
                                Acknowledging indicates the incident is being investigated and silences recurring notifications.
                            </p>
                            <textarea
                                value={ackNote}
                                onChange={(e) => setAckNote(e.target.value)}
                                placeholder="Optional investigation note..."
                                className="mac-input min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAckTarget(null)}
                                    className="mac-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="mac-btn-primary"
                                >
                                    {actionLoading ? 'Saving...' : 'Confirm Acknowledge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Incident Modal Sheet */}
            {resolveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in select-none">
                    <div className="mac-card max-w-md w-full p-6 shadow-2xl border-black/[0.1] dark:border-white/[0.1] animate-mac-scale space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span>Resolve Incident #{resolveTarget.id}</span>
                            </h3>
                            <button onClick={() => setResolveTarget(null)} className="text-[#86868b] hover:text-[#1d1d1f]">
                                <X size={15} />
                            </button>
                        </div>
                        <form onSubmit={handleResolve} className="space-y-3 text-xs">
                            <p className="text-[#6e6e73] dark:text-[#a1a1a6]">
                                Mark this operational failure as mitigated and resolved.
                            </p>
                            <textarea
                                value={resolveNote}
                                onChange={(e) => setResolveNote(e.target.value)}
                                placeholder="Optional root-cause or resolution summary..."
                                className="mac-input min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setResolveTarget(null)}
                                    className="mac-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="mac-btn-primary"
                                >
                                    {actionLoading ? 'Saving...' : 'Resolve Incident'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentsManager;
