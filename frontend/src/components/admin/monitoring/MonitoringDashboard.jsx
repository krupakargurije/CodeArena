import React, { useState, useEffect } from 'react';
import {
    Activity,
    Server,
    BarChart2,
    Cpu,
    Radio,
    AlertTriangle,
    RefreshCw,
    ShieldAlert
} from 'lucide-react';
import OverviewCards from './OverviewCards';
import ServiceHealthGrid from './ServiceHealthGrid';
import Judge0Center from './Judge0Center';
import SubmissionAnalyticsView from './SubmissionAnalyticsView';
import ApiPerformanceView from './ApiPerformanceView';
import LiveActivityView from './LiveActivityView';
import IncidentsManager from './IncidentsManager';
import { getSystemOverview } from '../../../services/monitoringService';

const SUB_TABS = [
    { id: 'services', label: 'Services & Infrastructure', icon: Server },
    { id: 'submissions', label: 'Submissions', icon: BarChart2 },
    { id: 'performance', label: 'API Performance', icon: Cpu },
    { id: 'activity', label: 'Live STOMP', icon: Radio },
    { id: 'incidents', label: 'Incidents & Alerts', icon: AlertTriangle },
];

const AUTO_REFRESH_OPTIONS = [
    { label: 'Manual Refresh', value: 0 },
    { label: 'Auto (10s)', value: 10000 },
    { label: 'Auto (30s)', value: 30000 },
    { label: 'Auto (60s)', value: 60000 },
];

const MonitoringDashboard = () => {
    const [subTab, setSubTab] = useState('services');
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);
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

    const overallStatus = overviewData?.overallStatus || 'UP';
    const activeIncidentsCount = overviewData?.activeIncidentsCount || 0;

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* Header Toolbar */}
            <div className="mac-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-[#0071e3] dark:text-[#2997ff]" />
                            <span>System Health & Observability</span>
                        </h1>
                        <span className={`mac-badge ${
                            overallStatus === 'UP' ? 'mac-badge-green' :
                            overallStatus === 'DEGRADED' ? 'mac-badge-amber' :
                            'mac-badge-red'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                overallStatus === 'UP' ? 'bg-emerald-500' :
                                overallStatus === 'DEGRADED' ? 'bg-amber-500' :
                                'bg-red-500 animate-ping'
                            }`} />
                            {overallStatus}
                        </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        Real-time telemetry, sandbox isolation metrics, database connection pools, and incident evaluation.
                    </p>
                </div>

                {/* Refresh & Controls */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-[#86868b] dark:text-[#636366]">Last Sampled</div>
                        <div className="text-xs font-mono font-medium text-[#1d1d1f] dark:text-white">
                            {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>

                    {/* Auto-Refresh Select */}
                    <select
                        value={autoRefreshInterval}
                        onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                        className="mac-input w-36 text-xs"
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
                        className="mac-btn-secondary"
                        title="Refresh telemetry"
                    >
                        <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#0071e3]' : ''} />
                        <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
                    </button>
                </div>
            </div>

            {/* Overview KPI Cards */}
            <OverviewCards
                overviewData={overviewData}
                loading={loading}
                onNavigateTab={(tab) => setSubTab(tab)}
            />

            {/* Monitoring Sub-Navigation Segmented Tabs */}
            <div className="flex items-center justify-between overflow-x-auto pb-1">
                <div className="mac-segmented-control shrink-0">
                    {SUB_TABS.map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = subTab === tab.id;
                        const isIncidents = tab.id === 'incidents';

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSubTab(tab.id)}
                                className={`mac-segmented-item flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
                            >
                                <IconComponent size={13} />
                                <span>{tab.label}</span>
                                {isIncidents && activeIncidentsCount > 0 && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-red-500 text-white animate-pulse">
                                        {activeIncidentsCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sub-Tab Panels */}
            <div>
                {subTab === 'services' && (
                    <div className="space-y-6 animate-mac-fade">
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
