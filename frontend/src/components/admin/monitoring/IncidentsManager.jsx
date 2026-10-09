import React, { useState, useEffect } from 'react';
import { getIncidents, acknowledgeIncident, resolveIncident } from '../../../services/monitoringService';

const SEVERITY_CONFIG = {
    CRITICAL: {
        badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-500',
        glow: 'shadow-red-500/20 border-red-500/40',
        label: 'CRITICAL',
    },
    WARNING: {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500',
        glow: 'shadow-amber-500/20 border-amber-500/40',
        label: 'WARNING',
    },
    INFO: {
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        dot: 'bg-sky-500',
        glow: 'shadow-sky-500/20 border-sky-500/40',
        label: 'INFO',
    },
};

const STATUS_BADGES = {
    OPEN: 'bg-red-500/20 text-red-300 border-red-500/30',
    ACKNOWLEDGED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
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

    const handleAcknowledge = async () => {
        if (!ackTarget) return;
        try {
            setActionLoading(true);
            await acknowledgeIncident(ackTarget.id, ackNote);
            setAckTarget(null);
            setAckNote('');
            await fetchIncidents();
        } catch (err) {
            console.error('Failed to acknowledge incident:', err);
            alert(err.message || 'Failed to acknowledge incident');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolveTarget) return;
        try {
            setActionLoading(true);
            await resolveIncident(resolveTarget.id, resolveNote);
            setResolveTarget(null);
            setResolveNote('');
            await fetchIncidents();
        } catch (err) {
            console.error('Failed to resolve incident:', err);
            alert(err.message || 'Failed to resolve incident');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
        return true;
    });

    const formatTimestamp = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>Incident Management & Alert Lifecycle</span>
                    </h2>
                    <p className="text-xs text-dark-text-secondary mt-0.5">
                        Automated failure detection, deduplicated incidents, and operator response center.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Status filter tabs */}
                    <div className="flex bg-dark-bg-secondary p-1 rounded-xl border border-white/5 text-xs font-semibold">
                        <button
                            onClick={() => setStatusFilter('ACTIVE')}
                            className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'ACTIVE'
                                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                                : 'text-dark-text-secondary hover:text-white'
                                }`}
                        >
                            Active ({incidents.filter(i => i.status !== 'RESOLVED').length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('RESOLVED')}
                            className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'RESOLVED'
                                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                                : 'text-dark-text-secondary hover:text-white'
                                }`}
                        >
                            Resolved
                        </button>
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'ALL'
                                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                                : 'text-dark-text-secondary hover:text-white'
                                }`}
                        >
                            All History
                        </button>
                    </div>

                    {/* Severity dropdown */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-dark-bg-secondary border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-orange"
                    >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical Only</option>
                        <option value="WARNING">Warning Only</option>
                        <option value="INFO">Info Only</option>
                    </select>
                </div>
            </div>

            {/* Incidents Table / Cards List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel p-6 rounded-2xl h-32 bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center space-y-4">
                    <h3 className="text-lg font-bold text-white">Failed to load incidents</h3>
                    <p className="text-dark-text-secondary text-sm">{error}</p>
                    <button
                        onClick={fetchIncidents}
                        className="px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-semibold"
                    >
                        Retry
                    </button>
                </div>
            ) : filteredIncidents.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-white">No Incidents Found</h3>
                    <p className="text-xs text-dark-text-secondary max-w-sm mx-auto">
                        {statusFilter === 'ACTIVE'
                            ? 'All monitored components and automated health checks are operating normally without active alerts.'
                            : 'No incident records match the current status and severity filters.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIncidents.map((incident) => {
                        const sevConfig = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.INFO;
                        const isOpen = incident.status === 'OPEN';
                        const isAck = incident.status === 'ACKNOWLEDGED';
                        const isResolved = incident.status === 'RESOLVED';

                        return (
                            <div
                                key={incident.id}
                                className={`glass-panel p-6 rounded-2xl border transition-all ${incident.severity === 'CRITICAL' && !isResolved
                                    ? 'border-red-500/30 bg-red-500/[0.02]'
                                    : 'border-white/5'
                                    }`}
                            >
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                    {/* Left summary */}
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Severity Badge */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${sevConfig.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sevConfig.dot} ${incident.severity === 'CRITICAL' && !isResolved ? 'animate-ping' : ''}`} />
                                                {sevConfig.label}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGES[incident.status] || STATUS_BADGES.OPEN}`}>
                                                {incident.status}
                                            </span>

                                            {/* Component Tag */}
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-dark-text-secondary text-[11px] font-mono border border-white/10">
                                                {incident.component}
                                            </span>

                                            {/* Deduplication Count */}
                                            {incident.occurrenceCount > 1 && (
                                                <span className="px-2 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-mono font-bold border border-brand-orange/20">
                                                    Occurred {incident.occurrenceCount}x
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-white">{incident.title}</h3>
                                        <p className="text-xs text-dark-text-secondary leading-relaxed max-w-3xl">
                                            {incident.description}
                                        </p>

                                        {/* Resolution Notes or Ack info */}
                                        {isResolved && incident.resolutionNote && (
                                            <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                                <span className="font-bold text-emerald-400">Resolution Note: </span>
                                                <span className="text-emerald-300">{incident.resolutionNote}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Timestamps and Actions */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 min-w-[220px]">
                                        <div className="text-[11px] text-dark-text-tertiary space-y-0.5 text-left lg:text-right font-mono">
                                            <div>First seen: <span className="text-white">{formatTimestamp(incident.firstSeenAt)}</span></div>
                                            <div>Last seen: <span className="text-white">{formatTimestamp(incident.lastSeenAt)}</span></div>
                                            {incident.acknowledgedBy && (
                                                <div className="text-amber-400/90">
                                                    Ack: {incident.acknowledgedBy}
                                                </div>
                                            )}
                                            {incident.resolvedBy && (
                                                <div className="text-emerald-400/90">
                                                    Resolved: {incident.resolvedBy}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!isResolved && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {isOpen && (
                                                    <button
                                                        onClick={() => {
                                                            setAckTarget(incident);
                                                            setAckNote('');
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setResolveTarget(incident);
                                                        setResolveNote('');
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Acknowledge Modal */}
            {ackTarget && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel p-6 max-w-md w-full border border-amber-500/30 rounded-2xl space-y-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-white">Acknowledge Incident</h3>
                        <p className="text-xs text-dark-text-secondary">
                            Marking this incident as acknowledged notifies other administrators that the issue is being investigated.
                        </p>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs font-semibold text-white">
                            {ackTarget.title}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Investigation Note (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Investigating high load on sandbox cluster..."
                                value={ackNote}
                                onChange={(e) => setAckNote(e.target.value)}
                                className="w-full bg-dark-bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-dark-text-tertiary focus:outline-none focus:border-amber-400"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setAckTarget(null)}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-white bg-white/5 hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcknowledge}
                                disabled={actionLoading}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Saving...' : 'Confirm Acknowledge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {resolveTarget && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel p-6 max-w-md w-full border border-emerald-500/30 rounded-2xl space-y-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-white">Resolve Incident</h3>
                        <p className="text-xs text-dark-text-secondary">
                            Document what was done to fix the root cause and restore normal operation.
                        </p>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs font-semibold text-white">
                            {resolveTarget.title}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-dark-text-secondary mb-1">Resolution Note</label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Restarted Judge0 worker service and cleared stuck queue items."
                                value={resolveNote}
                                onChange={(e) => setResolveNote(e.target.value)}
                                className="w-full bg-dark-bg-secondary border border-white/10 rounded-xl p-3 text-xs text-white placeholder-dark-text-tertiary focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setResolveTarget(null)}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-white bg-white/5 hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={actionLoading}
                                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Resolving...' : 'Confirm Resolve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentsManager;
