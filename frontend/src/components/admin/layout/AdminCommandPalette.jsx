import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    LayoutDashboard,
    Activity,
    AlertTriangle,
    Cpu,
    BarChart2,
    Code2,
    Users,
    ShieldCheck,
    Settings2,
    Plus,
    UserPlus,
    Sun,
    Moon,
    ExternalLink,
    Command,
    ArrowRight,
    CornerDownLeft
} from 'lucide-react';

const AdminCommandPalette = ({
    isOpen,
    onClose,
    onNavigate,
    onCreateProblem,
    theme,
    toggleTheme,
    problems = []
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Keyboard navigation (Escape, ArrowUp, ArrowDown, Enter)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + Math.max(1, filteredItems.length)) % Math.max(1, filteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredItems[selectedIndex];
                if (selected) {
                    selected.action();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const defaultCommands = [
        // Navigation
        { id: 'nav-overview', title: 'Go to Overview', category: 'Navigation', icon: LayoutDashboard, action: () => onNavigate('overview') },
        { id: 'nav-problems', title: 'Go to Problems Catalog', category: 'Navigation', icon: Code2, action: () => onNavigate('problems') },
        { id: 'nav-users', title: 'Go to Users & Admins', category: 'Navigation', icon: Users, action: () => onNavigate('users') },
        { id: 'nav-monitoring', title: 'Go to System Health & Monitoring', category: 'Navigation', icon: Activity, action: () => onNavigate('monitoring') },
        { id: 'nav-incidents', title: 'Go to Incidents & Alerts', category: 'Navigation', icon: AlertTriangle, action: () => onNavigate('incidents') },
        { id: 'nav-performance', title: 'Go to API Performance & Latency', category: 'Navigation', icon: Cpu, action: () => onNavigate('performance') },
        { id: 'nav-submissions', title: 'Go to Submissions Analytics', category: 'Navigation', icon: BarChart2, action: () => onNavigate('submissions') },
        { id: 'nav-audit', title: 'Go to Audit Logs & Diffs', category: 'Navigation', icon: ShieldCheck, action: () => onNavigate('audit') },
        { id: 'nav-settings', title: 'Go to Console Settings', category: 'Navigation', icon: Settings2, action: () => onNavigate('settings') },

        // Quick Actions
        { id: 'act-create-prob', title: 'Create New Problem', category: 'Quick Action', icon: Plus, action: () => { onNavigate('problems'); onCreateProblem && onCreateProblem(); } },
        { id: 'act-grant-admin', title: 'Grant Admin Permission', category: 'Quick Action', icon: UserPlus, action: () => onNavigate('users') },
        { id: 'act-toggle-theme', title: theme === 'dark' ? 'Switch to Light Appearance' : 'Switch to Dark Appearance', category: 'Quick Action', icon: theme === 'dark' ? Sun : Moon, action: toggleTheme },
        { id: 'act-public-arena', title: 'Open Public CodeArena', category: 'Quick Action', icon: ExternalLink, action: () => navigate('/problems') },
    ];

    // Problem search items if query matches
    const problemCommands = problems.slice(0, 10).map((p) => ({
        id: `prob-${p.id}`,
        title: `#${p.id} ${p.title}`,
        subtitle: `Difficulty: ${p.difficulty} • Acceptance: ${p.acceptanceRate ? p.acceptanceRate.toFixed(1) : 0}%`,
        category: 'Problems',
        icon: Code2,
        action: () => navigate(`/problems/${p.id}`)
    }));

    const allCommands = [...defaultCommands, ...problemCommands];

    const filteredItems = allCommands.filter((item) => {
        if (!query.trim()) return item.category !== 'Problems'; // show nav & actions by default
        const matchTitle = item.title.toLowerCase().includes(query.toLowerCase());
        const matchCat = item.category.toLowerCase().includes(query.toLowerCase());
        const matchSub = item.subtitle ? item.subtitle.toLowerCase().includes(query.toLowerCase()) : false;
        return matchTitle || matchCat || matchSub;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150 select-none">
            {/* Backdrop click to dismiss */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Spotlight Modal Box */}
            <div className="relative w-full max-w-xl rounded-2xl bg-white/95 dark:bg-[#202024]/95 backdrop-blur-2xl border border-black/[0.1] dark:border-white/[0.12] shadow-2xl overflow-hidden animate-mac-scale">
                {/* Search Input Bar */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08]">
                    <Search size={18} className="text-[#86868b] dark:text-[#a1a1a6] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Search commands, problems, views, settings..."
                        className="w-full bg-transparent text-sm text-[#1d1d1f] dark:text-white placeholder-[#86868b] dark:placeholder-[#636366] focus:outline-none"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/[0.06] dark:bg-white/[0.08] text-[#86868b] dark:text-[#a1a1a6]">
                        ESC
                    </kbd>
                </div>

                {/* Results List */}
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#86868b] dark:text-[#636366]">
                            No matching commands found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        filteredItems.map((item, index) => {
                            const IconComp = item.icon;
                            const isSelected = index === selectedIndex;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                                        isSelected
                                            ? 'bg-[#0071e3] text-white shadow-xs'
                                            : 'text-[#1d1d1f] dark:text-[#e5e5e7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <div className={`p-1.5 rounded-lg ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#6e6e73] dark:text-[#a1a1a6]'
                                        }`}>
                                            <IconComp size={14} />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="font-medium truncate">{item.title}</span>
                                            {item.subtitle && (
                                                <span className={`text-[10px] truncate ${
                                                    isSelected ? 'text-white/80' : 'text-[#86868b] dark:text-[#636366]'
                                                }`}>
                                                    {item.subtitle}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] dark:text-[#636366]'
                                        }`}>
                                            {item.category}
                                        </span>
                                        {isSelected && (
                                            <CornerDownLeft size={12} className="text-white/90" />
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer instructions */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] text-[11px] text-[#86868b] dark:text-[#636366]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08]">↑</kbd>
                            <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08]">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08]">↵</kbd>
                            Select
                        </span>
                    </div>
                    <span>Spotlight Quick Action</span>
                </div>
            </div>
        </div>
    );
};

export default AdminCommandPalette;
