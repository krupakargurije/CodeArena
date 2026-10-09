import React from 'react';

const Judge0Center = ({ judge0, loading }) => {
    if (loading && !judge0) {
        return (
            <div className="glass-panel p-8 rounded-xl animate-pulse space-y-4">
                <div className="h-6 bg-white/5 rounded w-1/4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white/5 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!judge0) return null;

    const verdicts = [
        { label: 'Accepted', count: judge0.acceptedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { label: 'Wrong Answer', count: judge0.wrongAnswerCount, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Compilation Error', count: judge0.compilationErrors, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { label: 'Runtime Error', count: judge0.runtimeErrors, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        { label: 'Time Limit Exceeded', count: judge0.timeLimitExceeded, color: 'text-brand-orange', bg: 'bg-brand-orange/10', border: 'border-brand-orange/20' },
        { label: 'Memory Limit Exceeded', count: judge0.memoryLimitExceeded, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        { label: 'Platform Errors', count: judge0.platformErrors, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <h3 className="text-lg font-bold text-white">Judge0 Operations Center</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-gray-300">
                            CE Sandbox
                        </span>
                    </div>
                    <p className="text-xs text-dark-text-secondary">
                        API Endpoint: <code className="text-brand-orange font-mono">{judge0.apiUrl || 'https://ce.judge0.com'}</code>
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                        <div className="text-dark-text-tertiary text-[10px] uppercase">Probe Latency</div>
                        <div className="text-emerald-400 font-bold">{judge0.latencyMs} ms</div>
                    </div>
                    <div className="text-right">
                        <div className="text-dark-text-tertiary text-[10px] uppercase">Queue Mode</div>
                        <div className="text-white font-bold">Synchronous (wait=true)</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Total Code Executions
                    </div>
                    <div className="text-3xl font-bold text-white">{judge0.totalExecutions}</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Execution Success Rate
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">{judge0.successRatePercent}%</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Pending in Pipeline
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{judge0.pendingSubmissions}</div>
                </div>
                <div className="glass-panel text-center">
                    <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">
                        Infrastructure Failures
                    </div>
                    <div className={`text-3xl font-bold ${judge0.platformErrors > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                        {judge0.platformErrors}
                    </div>
                </div>
            </div>

            {/* Verdict Distribution Grid */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Execution Verdict & Error Taxonomy</h4>
                    <span className="text-xs text-dark-text-tertiary">
                        Distinguishes user logic errors from infrastructure outages
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {verdicts.map((v) => (
                        <div key={v.label} className={`p-4 rounded-xl border ${v.border} ${v.bg} flex flex-col justify-between`}>
                            <span className="text-xs font-semibold text-gray-300">{v.label}</span>
                            <span className={`text-2xl font-bold mt-2 ${v.color}`}>{v.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Language Distribution */}
            {judge0.supportedLanguages && Object.keys(judge0.supportedLanguages).length > 0 && (
                <div className="glass-panel p-6 rounded-xl border border-white/5 space-y-4">
                    <h4 className="text-sm font-bold text-white">Language Runtime Share</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(judge0.supportedLanguages).map(([lang, count]) => (
                            <div key={lang} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
                                <span className="text-xs font-mono capitalize text-white font-semibold">{lang}</span>
                                <span className="text-xs font-mono text-brand-orange font-bold">{count} runs</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Judge0Center;
