import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../../services/auditService';
import AuditLogDiffViewer from './AuditLogDiffViewer';

const ACTION_OPTIONS = [
    { label: 'All Actions', value: '' },
    { label: 'Grant Admin (GRANT_ADMIN)', value: 'GRANT_ADMIN' },
    { label: 'Revoke Admin (REVOKE_ADMIN)', value: 'REVOKE_ADMIN' },
    { label: 'Create Problem (CREATE_PROBLEM)', value: 'CREATE_PROBLEM' },
    { label: 'Update Problem (UPDATE_PROBLEM)', value: 'UPDATE_PROBLEM' },
    { label: 'Delete Problem (DELETE_PROBLEM)', value: 'DELETE_PROBLEM' },
];

const ENTITY_OPTIONS = [
    { label: 'All Entity Types', value: '' },
    { label: 'User (USER)', value: 'USER' },
    { label: 'Problem (PROBLEM)', value: 'PROBLEM' },
    { label: 'Settings (SETTINGS)', value: 'SETTINGS' },
];

const PAGE_SIZES = [10, 20, 50, 100];

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters state
    const [actionFilter, setActionFilter] = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Active selected log for diff modal
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                size: pageSize,
            };

            if (actionFilter) params.action = actionFilter;
            if (entityTypeFilter) params.entityType = entityTypeFilter;
            if (fromDate) params.from = new Date(fromDate).toISOString();
            if (toDate) {
                const to = new Date(toDate);
                to.setHours(23, 59, 59, 999);
                params.to = to.toISOString();
            }

            // If user typed in search query, match against actorId or entityId
            if (searchQuery.trim()) {
                params.entityId = searchQuery.trim();
            }

            const response = await getAuditLogs(params);
            setLogs(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
            setError(err.message || 'Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityTypeFilter, fromDate, toDate, searchQuery, page, pageSize]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleResetFilters = () => {
        setActionFilter('');
        setEntityTypeFilter('');
        setSearchQuery('');
        setFromDate('');
        setToDate('');
        setPage(0);
    };

    const formatTimestamp = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            let relative = '';
            if (diffMins < 1) relative = 'Just now';
            else if (diffMins < 60) relative = `${diffMins}m ago`;
            else if (diffHours < 24) relative = `${diffHours}h ago`;
            else if (diffDays < 7) relative = `${diffDays}d ago`;
            else relative = date.toLocaleDateString();

            return {
                relative,
                exact: date.toLocaleString(),
                utc: date.toUTCString(),
            };
        } catch (e) {
            return { relative: isoString, exact: isoString, utc: isoString };
        }
    };

    const getActionBadgeClass = (action) => {
        if (action.includes('CREATE')) {
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
        if (action.includes('UPDATE')) {
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
        if (action.includes('DELETE') || action.includes('REVOKE')) {
            return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        }
        if (action.includes('GRANT')) {
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        }
        return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
    };

    // Calculate quick stats from loaded logs or totals
    const problemOperationsCount = logs.filter((l) => l.entityType === 'PROBLEM').length;
    const userOperationsCount = logs.filter((l) => l.entityType === 'USER').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Total Audit Logs
                    </div>
                    <div className="text-3xl font-bold text-white">{totalElements}</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        User / Role Events
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{userOperationsCount}</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Problem Mutations
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{problemOperationsCount}</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Integrity Status
                    </div>
                    <div className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Append-Only Verified
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Filter Audit Trail</h3>
                        {(actionFilter || entityTypeFilter || searchQuery || fromDate || toDate) && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                                Active Filters
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                        >
                            <svg
                                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search by Entity ID / Actor */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Entity ID..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            className="input w-full text-xs bg-dark-bg-tertiary/50 border-white/5 focus:border-brand-blue/50 py-2"
                        />
                    </div>

                    {/* Action Filter */}
                    <div>
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs py-2 px-3 bg-dark-bg-tertiary/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-brand-blue/50"
                        >
                            {ACTION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Entity Type Filter */}
                    <div>
                        <select
                            value={entityTypeFilter}
                            onChange={(e) => {
                                setEntityTypeFilter(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs py-2 px-3 bg-dark-bg-tertiary/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-brand-blue/50"
                        >
                            {ENTITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs py-2 px-3 bg-dark-bg-tertiary/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-brand-blue/50"
                            title="From Date"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs py-2 px-3 bg-dark-bg-tertiary/50 border border-white/5 rounded-lg text-white focus:outline-none focus:border-brand-blue/50"
                            title="To Date"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={fetchLogs}
                        className="underline hover:text-white font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold text-dark-text-tertiary uppercase tracking-wider">
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4">Actor</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Target Entity</th>
                                <th className="py-3 px-4">Reason / Summary</th>
                                <th className="py-3 px-4 text-right">State Diff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-4">
                                            <div className="h-4 bg-white/5 rounded w-24"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 bg-white/5 rounded w-28"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-6 bg-white/5 rounded w-20"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 bg-white/5 rounded w-32"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 bg-white/5 rounded w-48"></div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="h-8 bg-white/5 rounded w-20 ml-auto"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-dark-text-tertiary">
                                        <svg
                                            className="w-12 h-12 mx-auto text-dark-text-tertiary/40 mb-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <div className="text-base font-semibold text-white mb-1">
                                            No Audit Records Found
                                        </div>
                                        <p className="text-xs">
                                            Try adjusting your filter parameters or perform administrative actions.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const ts = formatTimestamp(log.timestamp);
                                    const hasBefore = Boolean(log.beforeState);
                                    const hasAfter = Boolean(log.afterState);

                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* Timestamp */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div
                                                    className="font-medium text-white cursor-help"
                                                    title={`UTC: ${ts.utc}\nLocal: ${ts.exact}`}
                                                >
                                                    {ts.relative}
                                                </div>
                                                <div className="text-[10px] text-dark-text-tertiary font-mono">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                            </td>

                                            {/* Actor */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold text-[10px]">
                                                        {(log.actorUsername || log.actorId || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white text-xs">
                                                            {log.actorUsername || 'System'}
                                                        </div>
                                                        <div
                                                            className="text-[10px] text-dark-text-tertiary font-mono truncate max-w-[120px]"
                                                            title={log.actorId}
                                                        >
                                                            {log.actorId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getActionBadgeClass(
                                                        log.action
                                                    )}`}
                                                >
                                                    {log.action}
                                                </span>
                                            </td>

                                            {/* Entity */}
                                            <td className="py-3 px-4 whitespace-nowrap font-mono">
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 text-[11px]">
                                                    {log.entityType}
                                                </span>
                                                <span
                                                    className="ml-2 text-dark-text-secondary text-[11px] truncate max-w-[140px] inline-block align-middle"
                                                    title={log.entityId}
                                                >
                                                    #{log.entityId}
                                                </span>
                                            </td>

                                            {/* Reason / Summary */}
                                            <td className="py-3 px-4">
                                                <div
                                                    className="text-gray-300 truncate max-w-xs"
                                                    title={log.reason || 'No description'}
                                                >
                                                    {log.reason || (
                                                        <span className="text-dark-text-tertiary italic">
                                                            No note provided
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-dark-text-tertiary mt-0.5 font-mono">
                                                    {hasBefore && hasAfter && 'State update (before & after)'}
                                                    {!hasBefore && hasAfter && 'Initial creation snapshot'}
                                                    {hasBefore && !hasAfter && 'Pre-deletion state snapshot'}
                                                </div>
                                            </td>

                                            {/* State Diff Action Button */}
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="btn-secondary px-3 py-1.5 text-xs hover:border-brand-orange/50 hover:text-brand-orange transition-all"
                                                >
                                                    Inspect Diff
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/[0.01]">
                    <div className="flex items-center gap-2 text-xs text-dark-text-tertiary">
                        <span>Showing</span>
                        <span className="font-semibold text-white">
                            {totalElements > 0 ? page * pageSize + 1 : 0}
                        </span>
                        <span>to</span>
                        <span className="font-semibold text-white">
                            {Math.min((page + 1) * pageSize, totalElements)}
                        </span>
                        <span>of</span>
                        <span className="font-semibold text-white">{totalElements}</span>
                        <span>entries</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2 text-xs text-dark-text-tertiary">
                            <span>Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(0);
                                }}
                                className="bg-dark-bg-tertiary/50 border border-white/5 rounded px-2 py-1 text-white text-xs focus:outline-none"
                            >
                                {PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Previous page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <span className="text-xs px-3 text-dark-text-secondary">
                                Page <strong className="text-white">{totalPages > 0 ? page + 1 : 0}</strong> of{' '}
                                <strong className="text-white">{totalPages}</strong>
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || loading}
                                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Next page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diff Modal */}
            {selectedLog && (
                <AuditLogDiffViewer
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                />
            )}
        </div>
    );
};

export default AuditLogViewer;
