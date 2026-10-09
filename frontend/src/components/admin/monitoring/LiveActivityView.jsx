import React, { useState, useEffect } from 'react';
import {
    Radio,
    Users,
    Activity,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Layers,
    MessageSquare,
    Zap
} from 'lucide-react';
import { getRealtimeActivity } from '../../../services/monitoringService';

const LiveActivityView = ({ autoRefreshInterval }) => {
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchActivity = async () => {
        try {
            setError(null);
            const data = await getRealtimeActivity();
            setActivity(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to load real-time activity:', err);
            setError(err.message || 'Failed to fetch real-time activity');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchActivity();
    }, []);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchActivity, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    if (loading && !activity) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="mac-card p-5 h-28" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && !activity) {
        return (
            <div className="mac-card p-8 text-center space-y-3">
                <AlertCircle size={32} className="text-red-500 mx-auto" />
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Failed to Load Live STOMP Activity</h3>
                <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] max-w-md mx-auto">{error}</p>
                <button
                    onClick={fetchActivity}
                    className="mac-btn-primary text-xs"
                >
                    Retry
                </button>
            </div>
        );
    }

    const {
        activeWebSocketSessions = 0,
        activeRooms = 0,
        activeUsersInRooms = 0,
        messagesProcessedPerMinute = 0,
        recentEvents = [],
    } = activity || {};

    return (
        <div className="space-y-6 animate-mac-fade">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                    <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                        <Radio size={16} className="text-emerald-500 animate-pulse" />
                        <span>Real-Time WebSocket & STOMP Activity</span>
                    </h2>
                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        Connected client sessions, collaborative rooms, and message broker throughput.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-[#86868b]">Sampled: {lastUpdated.toLocaleTimeString()}</span>
                    <button
                        onClick={fetchActivity}
                        disabled={loading}
                        className="mac-btn-secondary text-xs"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin text-[#0071e3]' : ''} />
                        <span>Sync</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Active Sessions
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {activeWebSocketSessions}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live STOMP Sockets
                    </div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Collaborative Rooms
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
                        {activeRooms}
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Active battle arenas</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Room Participants
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#af52de] dark:text-[#bf5af2]">
                        {activeUsersInRooms}
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Users competing now</div>
                </div>

                <div className="mac-card p-4 space-y-1">
                    <div className="text-[11px] font-semibold text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider">
                        Broker Throughput
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1d1d1f] dark:text-white">
                        {messagesProcessedPerMinute} <span className="text-xs font-normal text-[#86868b]">msg/min</span>
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Real-time message volume</div>
                </div>
            </div>

            {/* Recent Live Events Strip */}
            <div className="mac-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                    <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">Recent Real-Time Events</span>
                    <span className="mac-badge mac-badge-blue">Live Stream</span>
                </div>

                {recentEvents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#86868b]">
                        No recent broadcast events recorded. Sockets are open and awaiting traffic.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentEvents.map((evt, idx) => (
                            <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="font-medium text-[#1d1d1f] dark:text-white">{evt.type || 'EVENT'}</span>
                                    <span className="text-[#6e6e73] dark:text-[#a1a1a6]">{evt.description || evt.message}</span>
                                </div>
                                <span className="font-mono text-[10px] text-[#86868b]">
                                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivityView;
