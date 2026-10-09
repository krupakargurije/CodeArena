import React, { useState, useEffect } from 'react';
import OverviewCards from './OverviewCards';
import ServiceHealthGrid from './ServiceHealthGrid';
import Judge0Center from './Judge0Center';
import SubmissionAnalyticsView from './SubmissionAnalyticsView';
import ApiPerformanceView from './ApiPerformanceView';
import LiveActivityView from './LiveActivityView';
import IncidentsManager from './IncidentsManager';
import { getSystemOverview } from '../../../services/monitoringService';

const SUB_TABS = [
    { id: 'services', label: 'Services & Infrastructure', icon: 'server' },
    { id: 'submissions', label: 'Submission Analytics', icon: 'chart' },
    { id: 'performance', label: 'API & Runtime Performance', icon: 'cpu' },
    { id: 'activity', label: 'Live Activity & STOMP', icon: 'pulse' },
    { id: 'incidents', label: 'Alerts & Incidents', icon: 'alert' },
];

const AUTO_REFRESH_OPTIONS = [
    { label: 'Manual Refresh', value: 0 },
    { label: 'Auto (10s)', value: 10000 },
    { label: 'Auto (30s)', value: 30000 },
    { label: 'Auto (60s)', value: 60000 },
];

const MonitoringDashboard = () => {
    const [subTab, setSubTab] = useState('services');
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000); // 30s default
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchOverview = async () => {
        try {
            setRefreshing(true);
            const data = await getSystemOverview();
            setOverviewData(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch system overview:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchOverview, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    const handleManualRefresh = () => {
        fetchOverview();
    };

    const overallStatus = overviewData?.overallStatus || 'UNKNOWN';
    const activeIncidentsCount = overviewData?.activeIncidentsCount || 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg-secondary/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-white tracking-tight">System Health & Observability</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${overallStatus === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            overallStatus === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                overallStatus === 'DOWN' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                    'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${overallStatus === 'UP' ? 'bg-emerald-400' :
                                overallStatus === 'DEGRADED' ? 'bg-amber-400' :
                                    overallStatus === 'DOWN' ? 'bg-red-400 animate-ping' :
                                        'bg-slate-400'
                                }`} />
                            {overallStatus}
                        </span>
                    </div>
                    <p className="text-xs text-dark-text-secondary">
                        Real-time telemetry, sandbox operations, database probes, and automated incident management.
                    </p>
                </div>

                {/* Refresh & Controls */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-dark-text-tertiary">Last sampled</div>
                        <div className="text-xs font-mono font-medium text-white">{lastUpdated.toLocaleTimeString()}</div>
                    </div>

                    {/* Auto-Refresh Select */}
                    <select
                        value={autoRefreshInterval}
                        onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                        className="bg-dark-bg-primary border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-orange transition cursor-pointer"
                    >
                        {AUTO_REFRESH_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* Manual Refresh Button */}
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition disabled:opacity-50 flex items-center justify-center"
                        title="Refresh all metrics"
                    >
                        <svg
                            className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-orange' : ''}`}
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
                    </button>
                </div>
            </div>

            {/* Overview KPI Cards */}
            <OverviewCards
                overviewData={overviewData}
                loading={loading}
                onRefresh={fetchOverview}
            />

            {/* Monitoring Sub-Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
                {SUB_TABS.map((tab) => {
                    const isActive = subTab === tab.id;
                    const isIncidents = tab.id === 'incidents';

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isActive
                                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 border border-brand-orange/30'
                                : 'bg-dark-bg-secondary/60 text-dark-text-secondary hover:text-white border border-white/5 hover:border-white/10'
                                }`}
                        >
                            {/* Render Tab Icons */}
                            {tab.icon === 'server' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            )}
                            {tab.icon === 'chart' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            )}
                            {tab.icon === 'cpu' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            )}
                            {tab.icon === 'pulse' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                            {tab.icon === 'alert' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}

                            <span>{tab.label}</span>

                            {isIncidents && activeIncidentsCount > 0 && (
                                <span className={`px-2 py-0.2 text-[10px] font-black rounded-full ${isActive ? 'bg-white text-brand-orange' : 'bg-red-500 text-white animate-pulse'}`}>
                                    {activeIncidentsCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sub-Tab Panels */}
            <div>
                {subTab === 'services' && (
                    <div className="space-y-8 animate-fade-in">
                        <ServiceHealthGrid autoRefreshInterval={autoRefreshInterval} />
                        <Judge0Center autoRefreshInterval={autoRefreshInterval} />
                    </div>
                )}

                {subTab === 'submissions' && (
                    <SubmissionAnalyticsView autoRefreshInterval={autoRefreshInterval} />
                )}

                {subTab === 'performance' && (
                    <ApiPerformanceView autoRefreshInterval={autoRefreshInterval} />
                )}

                {subTab === 'activity' && (
                    <LiveActivityView autoRefreshInterval={autoRefreshInterval} />
                )}

                {subTab === 'incidents' && (
                    <IncidentsManager autoRefreshInterval={autoRefreshInterval} />
                )}
            </div>
        </div>
    );
};

export default MonitoringDashboard;
