import React, { useState, useEffect } from 'react';
import {
    Server,
    Database,
    Cpu,
    Radio,
    Activity,
    CheckCircle2,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { getServicesHealth } from '../../../services/monitoringService';

const ServiceHealthGrid = ({ autoRefreshInterval }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchServices = async () => {
        try {
            setError(null);
            const data = await getServicesHealth();
            setServices(data || []);
        } catch (err) {
            console.error('Failed to load services health:', err);
            setError(err.message || 'Failed to fetch dependency health');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchServices();
    }, []);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchServices, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'UP':
                return { badgeClass: 'mac-badge-green', dot: 'bg-emerald-500', label: 'UP' };
            case 'DEGRADED':
                return { badgeClass: 'mac-badge-amber', dot: 'bg-amber-500', label: 'DEGRADED' };
            case 'DOWN':
                return { badgeClass: 'mac-badge-red', dot: 'bg-red-500 animate-ping', label: 'DOWN' };
            default:
                return { badgeClass: 'mac-badge-blue', dot: 'bg-gray-400', label: 'UNKNOWN' };
        }
    };

    const getServiceIcon = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('database') || lower.includes('postgres') || lower.includes('supabase')) {
            return <Database size={18} className="text-[#0071e3] dark:text-[#2997ff]" />;
        }
        if (lower.includes('judge0') || lower.includes('sandbox')) {
            return <Cpu size={18} className="text-[#af52de] dark:text-[#bf5af2]" />;
        }
        if (lower.includes('websocket') || lower.includes('stomp')) {
            return <Radio size={18} className="text-emerald-500" />;
        }
        return <Server size={18} className="text-[#ff9500] dark:text-[#ff9f0a]" />;
    };

    return (
        <div className="space-y-4 animate-mac-fade">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Subsystem Probes & Connectivity</h3>
                    <p className="text-[11px] text-[#86868b] dark:text-[#636366]">
                        Real-time HTTP and socket probes with automated timeout protections and circuit breaker metrics.
                    </p>
                </div>
                <button
                    onClick={fetchServices}
                    disabled={loading}
                    className="mac-btn-secondary text-xs"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin text-[#0071e3]' : ''} />
                    <span>Re-check</span>
                </button>
            </div>

            {loading && services.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="mac-card p-4 h-28 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((svc, idx) => {
                        const st = getStatusBadge(svc.status);
                        return (
                            <div
                                key={idx}
                                className="mac-card p-4 space-y-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                                            {getServiceIcon(svc.name || svc.component)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-[#1d1d1f] dark:text-white">
                                                {svc.name || svc.component}
                                            </div>
                                            <div className="text-[10px] text-[#86868b] dark:text-[#636366] font-mono">
                                                {svc.endpoint || 'Internal Loopback'}
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`mac-badge ${st.badgeClass}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                        {st.label}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-[11px] flex items-center justify-between text-[#6e6e73] dark:text-[#a1a1a6]">
                                    <span>Latency: <strong className="font-mono text-[#1d1d1f] dark:text-white">{svc.latencyMs ?? 0} ms</strong></span>
                                    <span>Last checked: <strong className="text-[#1d1d1f] dark:text-white">{svc.lastChecked ? new Date(svc.lastChecked).toLocaleTimeString() : 'Just now'}</strong></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ServiceHealthGrid;
