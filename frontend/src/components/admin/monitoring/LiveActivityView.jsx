import React, { useState, useEffect } from 'react';
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
                        <div key={i} className="glass-panel p-5 h-28 rounded-2xl bg-white/5" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 h-64 rounded-2xl bg-white/5" />
                    <div className="glass-panel p-6 h-64 rounded-2xl bg-white/5" />
                </div>
            </div>
        );
    }

    if (error && !activity) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Failed to Load Live Activity</h3>
                <p className="text-dark-text-secondary text-sm max-w-md mx-auto">{error}</p>
                <button
                    onClick={fetchActivity}
                    className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-xl text-sm font-semibold transition"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    const {
        activeWebSocketSessions = 0,
        activeBattleRooms = 0,
        waitingBattleRooms = 0,
        completedBattleRooms = 0,
        runningContests = 0,
        httpRequestsPerSecond = 0,
        submissionsPerMinute = 0,
    } = activity || {};

    const totalRooms = activeBattleRooms + waitingBattleRooms + completedBattleRooms;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with live pulse */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                        <h2 className="text-xl font-bold text-white">Live Platform Activity & STOMP Telemetry</h2>
                        <p className="text-xs text-dark-text-secondary mt-0.5">
                            Real-time socket sessions, competitive rooms, contests, and instant throughput.
                        </p>
                    </div>
                </div>
                <div className="text-xs text-dark-text-secondary font-mono">
                    Sampled at: <span className="text-white">{lastUpdated.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* WebSocket Sessions */}
                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">WebSocket Sessions</div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mt-2">{activeWebSocketSessions}</div>
                    <div className="text-[11px] text-dark-text-secondary mt-1">Active STOMP Connections</div>
                </div>

                {/* Active Battle Rooms */}
                <div className="glass-panel p-5 rounded-2xl border border-brand-orange/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-brand-orange uppercase tracking-wider">Active Battle Rooms</div>
                        <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mt-2">{activeBattleRooms}</div>
                    <div className="text-[11px] text-dark-text-secondary mt-1">Live 1v1 & Group Battles</div>
                </div>

                {/* HTTP Request Throughput */}
                <div className="glass-panel p-5 rounded-2xl border border-sky-500/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">API Throughput</div>
                        <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mt-2">
                        {httpRequestsPerSecond.toFixed(1)} <span className="text-sm font-normal text-sky-300">req/s</span>
                    </div>
                    <div className="text-[11px] text-dark-text-secondary mt-1">Live Ingress Rate</div>
                </div>

                {/* Submission Throughput */}
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Submission Rate</div>
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono mt-2">
                        {submissionsPerMinute.toFixed(1)} <span className="text-sm font-normal text-purple-300">sub/min</span>
                    </div>
                    <div className="text-[11px] text-dark-text-secondary mt-1">Code Executions</div>
                </div>
            </div>

            {/* Room Breakdown and Live Contests Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Battle Rooms Status */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-white">Battle Room State Distribution</h3>
                        <span className="text-xs font-mono text-dark-text-tertiary">Total: {totalRooms}</span>
                    </div>

                    <div className="space-y-4 pt-2">
                        {/* In-Progress / Active */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Active / In-Progress Battles
                                </span>
                                <span className="text-white font-mono font-bold">{activeBattleRooms}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${totalRooms > 0 ? (activeBattleRooms / totalRooms) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Waiting */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    Waiting for Opponents / Matchmaking
                                </span>
                                <span className="text-white font-mono font-bold">{waitingBattleRooms}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all"
                                    style={{ width: `${totalRooms > 0 ? (waitingBattleRooms / totalRooms) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    Completed Battles
                                </span>
                                <span className="text-white font-mono font-bold">{completedBattleRooms}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-slate-500 rounded-full transition-all"
                                    style={{ width: `${totalRooms > 0 ? (completedBattleRooms / totalRooms) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Running Contests & Architecture Notice */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white">Live Contests & Scalability</h3>
                        <p className="text-xs text-dark-text-secondary mt-1">
                            Current active tournaments and concurrent user loads.
                        </p>

                        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-dark-text-tertiary uppercase">Active Running Contests</div>
                                <div className="text-2xl font-bold text-white font-mono mt-1">{runningContests}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${runningContests > 0
                                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
                                : 'bg-white/5 text-dark-text-tertiary border-white/10'
                                }`}>
                                {runningContests > 0 ? 'Live Tournament Ongoing' : 'No Live Contests'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 text-xs space-y-2 text-dark-text-secondary">
                        <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            High-Concurrency Telemetry
                        </div>
                        <p className="text-[11px] leading-relaxed">
                            STOMP message routing and battle socket states are tracked via Spring Session Event Listeners (<code className="text-sky-300">SessionConnectEvent</code> and <code className="text-sky-300">SessionDisconnectEvent</code>). Load-tested up to 3,000 concurrent virtual users.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveActivityView;
