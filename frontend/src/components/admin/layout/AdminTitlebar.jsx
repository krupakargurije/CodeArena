import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Search, 
    Bell, 
    Sun, 
    Moon, 
    PanelLeftClose, 
    PanelLeft, 
    LogOut, 
    ExternalLink, 
    ShieldCheck, 
    CheckCircle2, 
    ChevronRight,
    Command,
    X,
    Minus,
    Maximize2
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';

const AdminTitlebar = ({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    activeSection,
    activeSectionLabel,
    onNavigateSection,
    theme,
    toggleTheme,
    onOpenCommandPalette,
    onRefreshTelemetry
}) => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Traffic light actions
    const handleCloseWindow = () => {
        // Red dot: Return to the public CodeArena arena
        navigate('/problems');
    };

    const handleMinimizeWindow = () => {
        // Yellow dot: Collapse / Expand the sidebar
        if (toggleSidebarCollapsed) {
            toggleSidebarCollapsed();
        } else if (setSidebarOpen) {
            setSidebarOpen(!sidebarOpen);
        }
    };

    const handleZoomWindow = () => {
        // Green dot: Toggle browser fullscreen
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Fullscreen error:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch((err) => {
                    console.warn('Exit fullscreen error:', err);
                });
            }
        }
    };

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Administrator';
    const email = user?.email || 'admin@codearena.com';
    const initial = (username[0] || 'A').toUpperCase();

    return (
        <header className="sticky top-0 z-40 h-13 min-h-[52px] w-full border-b border-black/[0.08] dark:border-white/[0.08] bg-[#f6f6f8]/85 dark:bg-[#1c1c20]/85 backdrop-blur-xl flex items-center justify-between px-4 select-none transition-colors">
            {/* Left Zone: Window Controls & Sidebar Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
                {/* macOS Traffic Lights with Authentic Hover Icons */}
                <div className="mac-traffic-group pr-2">
                    {/* Red: Close / Exit to Arena */}
                    <button
                        type="button"
                        onClick={handleCloseWindow}
                        className="mac-traffic-dot mac-traffic-close"
                        title="Close Console & Return to Arena (Exit)"
                        aria-label="Close Console"
                    >
                        <span className="mac-traffic-icon font-mono">✕</span>
                    </button>

                    {/* Yellow: Minimize / Collapse Sidebar */}
                    <button
                        type="button"
                        onClick={handleMinimizeWindow}
                        className="mac-traffic-dot mac-traffic-minimize"
                        title={sidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
                        aria-label="Minimize or Collapse Sidebar"
                    >
                        <span className="mac-traffic-icon font-mono">−</span>
                    </button>

                    {/* Green: Zoom / Toggle Fullscreen */}
                    <button
                        type="button"
                        onClick={handleZoomWindow}
                        className="mac-traffic-dot mac-traffic-zoom"
                        title="Toggle Fullscreen Zoom"
                        aria-label="Toggle Fullscreen"
                    >
                        <span className="mac-traffic-icon font-mono">+</span>
                    </button>
                </div>

                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => {
                        if (toggleSidebarCollapsed) {
                            toggleSidebarCollapsed();
                        } else {
                            setSidebarOpen(!sidebarOpen);
                        }
                    }}
                    className="p-1.5 rounded-lg text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                    title={sidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
                    aria-label="Toggle Navigation Sidebar"
                >
                    {sidebarCollapsed ? <PanelLeft size={17} strokeWidth={2} /> : <PanelLeftClose size={17} strokeWidth={2} />}
                </button>

                {/* Subtle Divider */}
                <div className="h-4 w-[1px] bg-black/[0.08] dark:bg-white/[0.08] hidden sm:block" />

                {/* Breadcrumbs */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                    <button
                        onClick={() => onNavigateSection && onNavigateSection('overview')}
                        className="font-semibold text-[#1d1d1f] dark:text-white flex items-center gap-1.5 hover:opacity-80 transition"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-[#2997ff]" />
                        CodeArena
                    </button>
                    <ChevronRight size={13} className="text-[#86868b] dark:text-[#636366]" />
                    <button
                        onClick={() => onNavigateSection && onNavigateSection('overview')}
                        className="text-[#6e6e73] dark:text-[#a1a1a6] font-medium hover:text-[#1d1d1f] dark:hover:text-white transition"
                    >
                        Console
                    </button>
                    <ChevronRight size={13} className="text-[#86868b] dark:text-[#636366]" />
                    <span className="font-semibold text-[#1d1d1f] dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
                        {activeSectionLabel || 'Overview'}
                    </span>
                </div>
            </div>

            {/* Middle Zone: Global Command Search ⌘K */}
            <div className="flex-1 max-w-md mx-4">
                <button
                    onClick={onOpenCommandPalette}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.06] text-[#86868b] dark:text-[#a1a1a6] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] hover:border-black/[0.12] dark:hover:border-white/[0.12] transition shadow-xs group"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Search size={14} className="text-[#86868b] group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition" />
                        <span className="truncate">Search problems, users, metrics, logs...</span>
                    </div>
                    <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white dark:bg-[#2c2c30] border border-black/[0.08] dark:border-white/[0.1] text-[#6e6e73] dark:text-[#a1a1a6] shadow-2xs">
                        <Command size={10} /> K
                    </kbd>
                </button>
            </div>

            {/* Right Zone: Controls, Theme Switcher & Admin Avatar */}
            <div className="flex items-center gap-2">
                {/* Live Telemetry Heartbeat Status (Clickable to refresh) */}
                <button
                    onClick={onRefreshTelemetry}
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                    title="Spring Boot API :8080 Connected (Click to sync)"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Live 8080</span>
                </button>

                {/* Theme Mode Toggle (Light / Dark) */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Color Theme"
                >
                    {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                </button>

                {/* Admin Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                    <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition focus:outline-hidden"
                        aria-expanded={profileMenuOpen}
                        title="Administrator Account Options"
                    >
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#0071e3] to-[#5856d6] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            {initial}
                        </div>
                    </button>

                    {/* macOS Style Dropdown Popover */}
                    {profileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#242428]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {/* User Header */}
                            <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold text-sm text-[#1d1d1f] dark:text-white truncate">
                                        {username}
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/15 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20">
                                        <ShieldCheck size={11} /> Admin
                                    </span>
                                </div>
                                <div className="text-xs text-[#86868b] dark:text-[#a1a1a6] truncate mt-0.5">
                                    {email}
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div className="p-1 text-xs">
                                <button
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        navigate('/problems');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1d1d1f] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                                >
                                    <ExternalLink size={14} className="text-[#86868b]" />
                                    <span>Open Public Arena</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        navigate('/profile');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1d1d1f] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                                >
                                    <CheckCircle2 size={14} className="text-[#86868b]" />
                                    <span>My Profile & Settings</span>
                                </button>
                            </div>

                            {/* Sign Out */}
                            <div className="p-1 pt-1 border-t border-black/[0.06] dark:border-white/[0.06] text-xs">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition font-medium"
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out of Console</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminTitlebar;
