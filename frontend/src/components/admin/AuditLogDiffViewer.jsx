import React, { useState } from 'react';
import {
    X,
    Copy,
    Check,
    FileText,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Layers
} from 'lucide-react';

/**
 * Calculates a structured property-level diff between before and after JSON objects.
 */
function computeObjectDiff(beforeObj, afterObj) {
    const before = beforeObj && typeof beforeObj === 'object' ? beforeObj : {};
    const after = afterObj && typeof afterObj === 'object' ? afterObj : {};

    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

    return allKeys.map((key) => {
        const hasBefore = key in before;
        const hasAfter = key in after;
        const valBefore = before[key];
        const valAfter = after[key];

        const strBefore = JSON.stringify(valBefore, null, 2);
        const strAfter = JSON.stringify(valAfter, null, 2);

        if (hasBefore && !hasAfter) {
            return { key, type: 'REMOVED', before: valBefore, after: undefined, strBefore, strAfter: '' };
        }
        if (!hasBefore && hasAfter) {
            return { key, type: 'ADDED', before: undefined, after: valAfter, strBefore: '', strAfter };
        }
        if (strBefore !== strAfter) {
            return { key, type: 'MODIFIED', before: valBefore, after: valAfter, strBefore, strAfter };
        }
        return { key, type: 'UNCHANGED', before: valBefore, after: valAfter, strBefore, strAfter };
    });
}

const AuditLogDiffViewer = ({ log, onClose }) => {
    const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'side-by-side' | 'raw-json'
    const [copiedKey, setCopiedKey] = useState(null);

    if (!log) return null;

    let beforeData = null;
    let afterData = null;

    try {
        if (log.beforeState) beforeData = JSON.parse(log.beforeState);
    } catch (e) {
        beforeData = log.beforeState;
    }

    try {
        if (log.afterState) afterData = JSON.parse(log.afterState);
    } catch (e) {
        afterData = log.afterState;
    }

    const diffs = computeObjectDiff(beforeData, afterData);
    const changedDiffs = diffs.filter((d) => d.type !== 'UNCHANGED');
    const unchangedDiffs = diffs.filter((d) => d.type === 'UNCHANGED');

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const getActionBadgeClass = (action) => {
        if (!action) return 'mac-badge-blue';
        if (action.includes('CREATE')) return 'mac-badge-green';
        if (action.includes('UPDATE')) return 'mac-badge-blue';
        if (action.includes('DELETE') || action.includes('REVOKE')) return 'mac-badge-red';
        if (action.includes('GRANT')) return 'mac-badge-purple';
        return 'mac-badge-amber';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in select-none">
            {/* Backdrop click to dismiss */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* macOS Inspector Window Box */}
            <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col mac-card shadow-2xl overflow-hidden animate-mac-scale bg-white/95 dark:bg-[#1c1c20]/95 backdrop-blur-2xl">
                {/* macOS Toolbar Header */}
                <div className="px-5 py-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 pr-2">
                            <span onClick={onClose} className="mac-traffic-dot mac-traffic-close cursor-pointer" title="Close" />
                            <span className="mac-traffic-dot mac-traffic-minimize" />
                            <span className="mac-traffic-dot mac-traffic-zoom" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`mac-badge ${getActionBadgeClass(log.action)}`}>
                                    {log.action}
                                </span>
                                <span className="text-xs font-mono font-medium text-[#1d1d1f] dark:text-white">
                                    {log.entityType} #{log.entityId}
                                </span>
                            </div>
                            <div className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                                Audit Record #{log.id} • {new Date(log.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                        aria-label="Close diff viewer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Metadata Summary Strip */}
                <div className="px-5 py-2.5 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Actor</div>
                        <div className="font-semibold text-[#0071e3] dark:text-[#2997ff] truncate">
                            {log.actorUsername || (log.actorId ? `User #${log.actorId}` : 'System')}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Entity Type</div>
                        <div className="font-medium text-[#1d1d1f] dark:text-white truncate">
                            {log.entityType}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Modifications</div>
                        <div className="font-medium text-[#1d1d1f] dark:text-white">
                            {changedDiffs.length} property diff{changedDiffs.length === 1 ? '' : 's'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-[#86868b] uppercase tracking-wider">Correlation ID</div>
                        <div className="font-mono text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] truncate">
                            {log.correlationId || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* View Mode Segmented Controls */}
                <div className="px-5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                    <div className="mac-segmented-control">
                        <button
                            onClick={() => setViewMode('diff')}
                            className={`mac-segmented-item ${viewMode === 'diff' ? 'active' : ''}`}
                        >
                            Property Diff ({changedDiffs.length})
                        </button>
                        <button
                            onClick={() => setViewMode('side-by-side')}
                            className={`mac-segmented-item ${viewMode === 'side-by-side' ? 'active' : ''}`}
                        >
                            Side-by-Side
                        </button>
                        <button
                            onClick={() => setViewMode('raw-json')}
                            className={`mac-segmented-item ${viewMode === 'raw-json' ? 'active' : ''}`}
                        >
                            Raw JSON
                        </button>
                    </div>

                    <button
                        onClick={() => handleCopy(log, 'all')}
                        className="mac-btn-secondary text-xs py-1 px-2.5"
                    >
                        {copiedKey === 'all' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        <span>{copiedKey === 'all' ? 'Copied' : 'Copy Record'}</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
                    {/* Visual Property Diff Mode */}
                    {viewMode === 'diff' && (
                        <div className="space-y-3">
                            {changedDiffs.length === 0 ? (
                                <div className="text-center py-10 text-[#86868b]">
                                    <div className="font-medium text-sm text-[#1d1d1f] dark:text-white">No field differences detected</div>
                                    <div className="text-xs mt-1">Both before and after state snapshots are identical.</div>
                                </div>
                            ) : (
                                changedDiffs.map((diff) => (
                                    <div
                                        key={diff.key}
                                        className="p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-[#1d1d1f] dark:text-white font-mono">
                                                    {diff.key}
                                                </span>
                                                {diff.type === 'MODIFIED' && (
                                                    <span className="mac-badge mac-badge-amber text-[10px]">Modified</span>
                                                )}
                                                {diff.type === 'ADDED' && (
                                                    <span className="mac-badge mac-badge-green text-[10px]">Added</span>
                                                )}
                                                {diff.type === 'REMOVED' && (
                                                    <span className="mac-badge mac-badge-red text-[10px]">Removed</span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleCopy({ before: diff.before, after: diff.after }, diff.key)}
                                                className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center gap-1"
                                            >
                                                {copiedKey === diff.key ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                <span>{copiedKey === diff.key ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            {/* Before */}
                                            <div className="p-2.5 rounded-lg bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 text-red-700 dark:text-red-300">
                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                                    − Before (Old Value)
                                                </div>
                                                <pre className="whitespace-pre-wrap break-all text-[11px] overflow-x-auto">
                                                    {diff.strBefore || '(null / none)'}
                                                </pre>
                                            </div>

                                            {/* After */}
                                            <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                                    + After (New Value)
                                                </div>
                                                <pre className="whitespace-pre-wrap break-all text-[11px] overflow-x-auto">
                                                    {diff.strAfter || '(null / none)'}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Side-by-Side Mode */}
                    {viewMode === 'side-by-side' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                                <div className="font-semibold text-xs text-[#1d1d1f] dark:text-white mb-2 flex items-center justify-between">
                                    <span>Before State Snapshot</span>
                                    <button
                                        onClick={() => handleCopy(beforeData, 'before')}
                                        className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                                    >
                                        {copiedKey === 'before' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
                                    {beforeData ? JSON.stringify(beforeData, null, 2) : '(Empty / None)'}
                                </pre>
                            </div>

                            <div className="p-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                                <div className="font-semibold text-xs text-[#1d1d1f] dark:text-white mb-2 flex items-center justify-between">
                                    <span>After State Snapshot</span>
                                    <button
                                        onClick={() => handleCopy(afterData, 'after')}
                                        className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                                    >
                                        {copiedKey === 'after' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
                                    {afterData ? JSON.stringify(afterData, null, 2) : '(Empty / None)'}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Raw JSON Payload Mode */}
                    {viewMode === 'raw-json' && (
                        <div className="p-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                            <div className="font-semibold text-xs text-[#1d1d1f] dark:text-white mb-2 flex items-center justify-between">
                                <span>Full Audit Log Entity DTO</span>
                                <button
                                    onClick={() => handleCopy(log, 'raw')}
                                    className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                                >
                                    {copiedKey === 'raw' ? 'Copied' : 'Copy JSON'}
                                </button>
                            </div>
                            <pre className="p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-[#1d1d1f] dark:text-[#f5f5f7] whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
                                {JSON.stringify(log, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between">
                    <span className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        Verified immutable audit snapshot
                    </span>
                    <button
                        onClick={onClose}
                        className="mac-btn-secondary text-xs"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDiffViewer;
