import React from 'react';

const ServiceHealthGrid = ({ services, loading, onRefresh }) => {
    const getStatusPill = (status) => {
        switch (status) {
            case 'UP':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        UP
                    </span>
                );
            case 'DEGRADED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        DEGRADED
                    </span>
                );
            case 'DOWN':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                        DOWN
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        UNKNOWN
                    </span>
                );
        }
    };

    const getComponentIcon = (component) => {
        switch (component) {
            case 'BACKEND':
                return (
                    <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                );
            case 'DATABASE':
                return (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                );
            case 'JUDGE0':
                return (
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                );
            case 'WEBSOCKET':
                return (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                );
        }
    };

    if (loading && (!services || services.length === 0)) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-panel p-6 rounded-xl animate-pulse space-y-3">
                        <div className="h-6 bg-white/5 rounded w-1/3"></div>
                        <div className="h-4 bg-white/5 rounded w-2/3"></div>
                        <div className="h-8 bg-white/5 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Subsystem Health & Dependency Status</h3>
                    <p className="text-xs text-dark-text-secondary">
                        Real-time probe telemetry with active timeout protections and 10s caching.
                    </p>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                        Re-check Dependencies
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services && services.map((s) => (
                    <div
                        key={s.serviceName}
                        className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                        {getComponentIcon(s.component)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{s.serviceName}</h4>
                                        <span className="text-[11px] font-mono text-dark-text-tertiary">
                                            {s.component}
                                        </span>
                                    </div>
                                </div>
                                <div>{getStatusPill(s.status)}</div>
                            </div>

                            <p className="text-xs text-dark-text-secondary mb-3 leading-relaxed">
                                {s.message}
                            </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-dark-text-tertiary">
                            <div>
                                <span className="block text-[10px] uppercase text-dark-text-tertiary">Latency</span>
                                <span className="font-semibold text-white">{s.responseTimeMs !== null ? `${s.responseTimeMs}ms` : 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase text-dark-text-tertiary">Last Check</span>
                                <span className="text-gray-300">
                                    {s.lastCheckTime ? new Date(s.lastCheckTime).toLocaleTimeString() : 'N/A'}
                                </span>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="block text-[10px] uppercase text-dark-text-tertiary">Health</span>
                                <span className="text-emerald-400 font-semibold">Verified</span>
                            </div>
                        </div>

                        {/* Expandable details if present */}
                        {s.details && Object.keys(s.details).length > 0 && (
                            <details className="mt-3 pt-2 text-[11px] border-t border-white/5">
                                <summary className="cursor-pointer text-dark-text-tertiary hover:text-white font-medium">
                                    Technical Diagnostics & Telemetry
                                </summary>
                                <pre className="mt-2 p-2 bg-black/40 rounded-lg text-[10px] font-mono text-gray-300 overflow-x-auto custom-scrollbar">
                                    {JSON.stringify(s.details, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceHealthGrid;
