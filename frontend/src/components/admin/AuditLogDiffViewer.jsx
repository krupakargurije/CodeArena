import React, { useState } from 'react';

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

    const getActionBadge = (action) => {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between bg-white/[0.02]">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionBadge(log.action)}`}>
                                {log.action}
                            </span>
                            <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300 border border-white/5 font-mono">
                                {log.entityType} : {log.entityId}
                            </span>
                            <span className="text-xs text-dark-text-tertiary">
                                ID #{log.id}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Audit Record Details & State Diff
                        </h2>
                        {log.reason && (
                            <p className="text-sm text-dark-text-secondary mt-1 italic">
                                "{log.reason}"
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-dark-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        aria-label="Close diff modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Metadata Summary Banner */}
                <div className="px-6 py-3 bg-black/40 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                        <div className="text-dark-text-tertiary uppercase text-[10px] tracking-wider mb-0.5">Actor</div>
                        <div className="text-brand-orange font-semibold truncate" title={log.actorId}>
                            {log.actorUsername || log.actorId}
                        </div>
                    </div>
                    <div>
                        <div className="text-dark-text-tertiary uppercase text-[10px] tracking-wider mb-0.5">Timestamp (UTC)</div>
                        <div className="text-gray-300 truncate" title={log.timestamp}>
                            {new Date(log.timestamp).toUTCString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-dark-text-tertiary uppercase text-[10px] tracking-wider mb-0.5">Correlation ID</div>
                        <div className="text-gray-400 truncate flex items-center gap-1">
                            <span className="truncate">{log.correlationId || 'N/A'}</span>
                            {log.correlationId && (
                                <button
                                    onClick={() => handleCopy(log.correlationId, 'correlation')}
                                    className="text-dark-text-tertiary hover:text-white ml-1"
                                    title="Copy Correlation ID"
                                >
                                    {copiedKey === 'correlation' ? '✓' : '⧉'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-dark-text-tertiary uppercase text-[10px] tracking-wider mb-0.5">State Change</div>
                        <div className="text-gray-300">
                            {changedDiffs.length} field{changedDiffs.length === 1 ? '' : 's'} altered
                        </div>
                    </div>
                </div>

                {/* Tab Controls */}
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('diff')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                viewMode === 'diff'
                                    ? 'bg-brand-orange text-white'
                                    : 'bg-white/5 text-dark-text-secondary hover:text-white hover:bg-white/10'
                            }`}
                        >
                            Visual Diff ({changedDiffs.length} changes)
                        </button>
                        <button
                            onClick={() => setViewMode('side-by-side')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                viewMode === 'side-by-side'
                                    ? 'bg-brand-orange text-white'
                                    : 'bg-white/5 text-dark-text-secondary hover:text-white hover:bg-white/10'
                            }`}
                        >
                            Side-by-Side State
                        </button>
                        <button
                            onClick={() => setViewMode('raw-json')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                viewMode === 'raw-json'
                                    ? 'bg-brand-orange text-white'
                                    : 'bg-white/5 text-dark-text-secondary hover:text-white hover:bg-white/10'
                            }`}
                        >
                            Raw JSON Payload
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleCopy(log, 'all')}
                            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <span>{copiedKey === 'all' ? '✓ Copied' : 'Copy Full Record'}</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Visual Diff Mode */}
                    {viewMode === 'diff' && (
                        <div className="space-y-4">
                            {changedDiffs.length === 0 ? (
                                <div className="text-center py-10 text-dark-text-tertiary">
                                    <p className="text-base font-medium text-gray-400">No field differences detected</p>
                                    <p className="text-xs mt-1">Both before and after state snapshots are identical or empty.</p>
                                </div>
                            ) : (
                                changedDiffs.map((diff) => (
                                    <div
                                        key={diff.key}
                                        className="bg-black/30 border border-white/5 rounded-xl p-4 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold font-mono text-white">
                                                    {diff.key}
                                                </span>
                                                {diff.type === 'MODIFIED' && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        Modified
                                                    </span>
                                                )}
                                                {diff.type === 'ADDED' && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Added
                                                    </span>
                                                )}
                                                {diff.type === 'REMOVED' && (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        Removed
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleCopy({ before: diff.before, after: diff.after }, diff.key)}
                                                className="text-xs text-dark-text-tertiary hover:text-white"
                                                title="Copy field change"
                                            >
                                                {copiedKey === diff.key ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                            {/* Before Value */}
                                            <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-3">
                                                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <span>− Before (Previous Value)</span>
                                                </div>
                                                <pre className="text-xs font-mono text-rose-200 whitespace-pre-wrap break-all overflow-x-auto max-h-48 custom-scrollbar">
                                                    {diff.strBefore || '<null / not present>'}
                                                </pre>
                                            </div>

                                            {/* After Value */}
                                            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3">
                                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <span>+ After (New Value)</span>
                                                </div>
                                                <pre className="text-xs font-mono text-emerald-200 whitespace-pre-wrap break-all overflow-x-auto max-h-48 custom-scrollbar">
                                                    {diff.strAfter || '<null / deleted>'}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Unchanged Properties Accordion */}
                            {unchangedDiffs.length > 0 && (
                                <details className="mt-6 border border-white/5 rounded-xl bg-white/[0.01] p-4 text-xs">
                                    <summary className="font-semibold text-dark-text-tertiary cursor-pointer hover:text-white">
                                        View {unchangedDiffs.length} Unchanged Propert{unchangedDiffs.length === 1 ? 'y' : 'ies'}
                                    </summary>
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                                        {unchangedDiffs.map((d) => (
                                            <div key={d.key} className="bg-black/20 p-2 rounded border border-white/5 flex justify-between">
                                                <span className="text-gray-400">{d.key}:</span>
                                                <span className="text-gray-200 truncate max-w-[200px]" title={d.strBefore}>
                                                    {d.strBefore}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Side-by-Side Full State */}
                    {viewMode === 'side-by-side' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                                        Before State Snapshot
                                    </h3>
                                    <button
                                        onClick={() => handleCopy(beforeData, 'before-raw')}
                                        className="text-xs text-dark-text-tertiary hover:text-white"
                                    >
                                        {copiedKey === 'before-raw' ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all overflow-x-auto flex-1 custom-scrollbar">
                                    {beforeData ? JSON.stringify(beforeData, null, 2) : '<null>'}
                                </pre>
                            </div>

                            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                        After State Snapshot
                                    </h3>
                                    <button
                                        onClick={() => handleCopy(afterData, 'after-raw')}
                                        className="text-xs text-dark-text-tertiary hover:text-white"
                                    >
                                        {copiedKey === 'after-raw' ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all overflow-x-auto flex-1 custom-scrollbar">
                                    {afterData ? JSON.stringify(afterData, null, 2) : '<null>'}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Raw JSON View */}
                    {viewMode === 'raw-json' && (
                        <div className="bg-black/50 border border-white/5 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-mono text-dark-text-tertiary">
                                    Full AuditLog Database Object
                                </span>
                                <button
                                    onClick={() => handleCopy(log, 'raw-full')}
                                    className="text-xs text-dark-text-tertiary hover:text-white"
                                >
                                    {copiedKey === 'raw-full' ? '✓ Copied' : 'Copy JSON'}
                                </button>
                            </div>
                            <pre className="text-xs font-mono text-gray-200 whitespace-pre-wrap break-all overflow-x-auto custom-scrollbar">
                                {JSON.stringify(log, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="btn-secondary px-5 py-2 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDiffViewer;
