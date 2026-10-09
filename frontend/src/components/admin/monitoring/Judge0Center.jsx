import React, { useState, useEffect } from 'react';
import {
    Cpu,
    Server,
    Activity,
    CheckCircle2,
    AlertCircle,
    Layers,
    Clock,
    Zap
} from 'lucide-react';
import { getJudge0Operations } from '../../../services/monitoringService';

const Judge0Center = ({ autoRefreshInterval }) => {
    const [judge0, setJudge0] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchJudge0 = async () => {
        try {
            const data = await getJudge0Operations();
            setJudge0(data);
        } catch (err) {
            console.error('Failed to load Judge0 health:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchJudge0();
    }, []);

    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchJudge0, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval]);

    if (loading && !judge0) {
        return (
            <div className="mac-card p-6 h-48 animate-pulse" />
        );
    }

    if (!judge0) return null;

    const verdicts = [
        { label: 'Accepted', count: judge0.acceptedCount || 0, badgeClass: 'mac-badge-green' },
        { label: 'Wrong Answer', count: judge0.wrongAnswerCount || 0, badgeClass: 'mac-badge-amber' },
        { label: 'Compile Error', count: judge0.compilationErrors || 0, badgeClass: 'mac-badge-purple' },
        { label: 'Runtime Error', count: judge0.runtimeErrors || 0, badgeClass: 'mac-badge-red' },
        { label: 'Time Limit (TLE)', count: judge0.timeLimitExceeded || 0, badgeClass: 'mac-badge-amber' },
        { label: 'Memory Limit (MLE)', count: judge0.memoryLimitExceeded || 0, badgeClass: 'mac-badge-blue' },
        { label: 'Platform Errors', count: judge0.platformErrors || 0, badgeClass: 'mac-badge-red' },
    ];

    return (
        <div className="space-y-4 animate-mac-fade">
            {/* Header Banner */}
            <div className="mac-card p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-[#0071e3] dark:text-[#2997ff]" />
                        <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Judge0 Sandbox Cluster</h3>
                        <span className="mac-badge mac-badge-green">
                            CE Sandbox
                        </span>
                    </div>
                    <p className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                        Worker Endpoint: <code className="text-[#0071e3] dark:text-[#2997ff] font-mono">{judge0.apiUrl || 'https://ce.judge0.com'}</code>
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="text-right">
                        <div className="text-[10px] text-[#86868b] uppercase">Probe Latency</div>
                        <div className="text-[#0071e3] dark:text-[#2997ff] font-bold">{judge0.latencyMs ?? 0} ms</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#86868b] uppercase">Queue Mode</div>
                        <div className="text-[#1d1d1f] dark:text-white font-bold">Synchronous (wait=true)</div>
                    </div>
                </div>
            </div>

            {/* Verdicts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {verdicts.map((v, i) => (
                    <div
                        key={i}
                        className="mac-card p-3 text-center space-y-1"
                    >
                        <div className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] uppercase tracking-wider font-semibold truncate" title={v.label}>
                            {v.label}
                        </div>
                        <div className="text-xl font-bold font-mono text-[#1d1d1f] dark:text-white">
                            {v.count}
                        </div>
                        <span className={`mac-badge ${v.badgeClass} text-[9px]`}>
                            Logged
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Judge0Center;
