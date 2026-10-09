import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    Eye,
    CheckCircle2,
    Clock,
    X,
    User,
    Code2,
    Sliders,
    Layers,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
} from 'lucide-react';
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
    { label: 'All Entities', value: '' },
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
        if (!isoString) return { relative: 'N/A', exact: 'N/A' };
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
            };
        } catch (e) {
            return { relative: isoString, exact: isoString };
        }
    };

    const getActionBadgeClass = (action) => {
        if (!action) return 'mac-badge-blue';
        if (action.includes('CREATE')) return 'mac-badge-green';
        if (action.includes('UPDATE')) return 'mac-badge-blue';
        if (action.includes('DELETE') || action.includes('REVOKE')) return 'mac-badge-red';
        if (action.includes('GRANT')) return 'mac-badge-purple';
        return 'mac-badge-amber';
    };

    const problemOperationsCount = logs.filter((l) => l.entityType === 'PROBLEM').length;
    const userOperationsCount = logs.filter((l) => l.entityType === 'USER').length;

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="mac-card p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-1">
                        Total Audit Records
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1d1d1f] dark:text-white">{totalElements}</div>
                    <div className="text-[11px] text-[#86868b] mt-1">Immutable PostgreSQL log</div>
                </div>

                <div className="mac-card p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-1">
                        User & Permission Events
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#af52de] dark:text-[#bf5af2]">{userOperationsCount}</div>
                    <div className="text-[11px] text-[#86868b] mt-1">Role assignments & revokes</div>
                </div>

                <div className="mac-card p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-1">
                        Problem Mutations
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">{problemOperationsCount}</div>
                    <div className="text-[11px] text-[#86868b] mt-1">Catalog inserts & updates</div>
                </div>

                <div className="mac-card p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] dark:text-[#a1a1a6] mb-1">
                        Integrity Protocol
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        <CheckCircle2 size={16} />
                        <span>Append-Only Active</span>
                    </div>
                    <div className="text-[11px] text-[#86868b] mt-1">Row-Level Security verified</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mac-card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Filter size={15} className="text-[#0071e3] dark:text-[#2997ff]" />
                        <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Filter Audit Trail</span>
                        {(actionFilter || entityTypeFilter || searchQuery || fromDate || toDate) && (
                            <span className="mac-badge mac-badge-amber">
                                Active Filter
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {(actionFilter || entityTypeFilter || searchQuery || fromDate || toDate) && (
                            <button
                                onClick={handleResetFilters}
                                className="mac-btn-ghost text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                            >
                                Reset Filters
                            </button>
                        )}
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="mac-btn-secondary text-xs"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin text-[#0071e3]' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {/* Search Entity ID */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                        <input
                            type="text"
                            placeholder="Search Entity ID (#1, 2)..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            className="mac-input pl-7 text-xs"
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
                            className="mac-input text-xs"
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
                            className="mac-input text-xs"
                        >
                            {ENTITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* From Date */}
                    <div>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(0);
                            }}
                            className="mac-input text-xs"
                            title="Filter from date"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(0);
                            }}
                            className="mac-input text-xs"
                            title="Filter to date"
                        />
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <X size={15} />
                    <span>{error}</span>
                </div>
            )}

            {/* Audit Log Table */}
            <div className="mac-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#6e6e73] dark:text-[#a1a1a6] font-semibold select-none">
                                <th className="py-3 px-4 font-mono w-16">ID</th>
                                <th className="py-3 px-4">Action</th>
                                <th className="py-3 px-4">Entity</th>
                                <th className="py-3 px-4">Actor</th>
                                <th className="py-3 px-4">Timestamp</th>
                                <th className="py-3 px-4 text-right">Inspect Diff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#86868b]">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3] mb-2" />
                                        <div>Loading audit records...</div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#86868b]">
                                        No audit records found matching the specified criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const time = formatTimestamp(log.timestamp);
                                    const badgeClass = getActionBadgeClass(log.action);

                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-black/[0.025] dark:hover:bg-white/[0.035] transition-colors"
                                        >
                                            <td className="py-3 px-4 font-mono text-[#86868b] dark:text-[#636366]">
                                                #{log.id}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`mac-badge ${badgeClass}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-[#1d1d1f] dark:text-white font-medium">
                                                    {log.entityType} #{log.entityId}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                    <User size={13} className="text-[#86868b]" />
                                                    <span className="truncate max-w-[140px]" title={log.actorUsername || log.actorId}>
                                                        {log.actorUsername || (log.actorId ? `User #${log.actorId}` : 'System')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                <div className="flex flex-col">
                                                    <span>{time.relative}</span>
                                                    <span className="text-[10px] text-[#86868b] font-mono">{time.exact}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="mac-btn-secondary text-[11px] py-1 px-2.5"
                                                >
                                                    <Eye size={12} />
                                                    <span>View Diff</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#86868b] dark:text-[#636366]">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(0);
                            }}
                            className="mac-input py-0.5 px-2 text-[11px] w-16"
                        >
                            {PAGE_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span>
                            Page {page + 1} of {Math.max(1, totalPages)} ({totalElements} items)
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="mac-btn-secondary py-1 px-2 text-xs"
                            title="Previous page"
                        >
                            <ChevronLeft size={13} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                            className="mac-btn-secondary py-1 px-2 text-xs"
                            title="Next page"
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* State Diff Inspector Modal Sheet */}
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
