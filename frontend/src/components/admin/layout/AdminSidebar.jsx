import React from 'react';
import {
    LayoutDashboard,
    Activity,
    AlertTriangle,
    Cpu,
    BarChart2,
    Code2,
    Users,
    ShieldCheck,
    Settings2,
    Radio,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Layers
} from 'lucide-react';

const NAV_GROUPS = [
    {
        title: 'Workspace',
        items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'monitoring', label: 'System Health', icon: Activity },
            { id: 'incidents', label: 'Incidents & Alerts', icon: AlertTriangle, badgeType: 'incidents' },
            { id: 'performance', label: 'API Performance', icon: Cpu },
            { id: 'submissions', label: 'Submissions', icon: BarChart2 },
        ]
    },
    {
        title: 'Platform Management',
        items: [
            { id: 'problems', label: 'Problems Catalog', icon: Code2, badgeType: 'problems' },
            { id: 'users', label: 'Users & Admins', icon: Users, badgeType: 'users' },
        ]
    },
    {
        title: 'Administration',
        items: [
            { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, badgeText: 'Diffs' },
            { id: 'settings', label: 'Console Settings', icon: Settings2 },
        ]
    }
];

const AdminSidebar = ({
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    incidentsCount = 0,
    problemsCount = 0,
    usersCount = 0,
    isMobile = false
}) => {
    const handleSelect = (tabId) => {
        setActiveTab(tabId);
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const sidebarWidthClass = sidebarCollapsed ? 'w-18 min-w-[72px]' : 'w-64 min-w-[256px]';

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in"
                />
            )}

            <aside
                className={`fixed lg:relative top-0 bottom-0 left-0 z-30 flex flex-col justify-between transition-all duration-200 ease-in-out select-none shrink-0 h-full overflow-hidden
                    bg-[#eeeef1]/80 dark:bg-[#18181c]/80 backdrop-blur-2xl border-r border-black/[0.08] dark:border-white/[0.08]
                    ${sidebarWidthClass}
                    ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
                `}
            >
                {/* Top Branding Section (Fixed Card) */}
                <div className="p-4 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] h-13 min-h-[52px] shrink-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white shadow-xs shrink-0">
                            <Layers size={15} strokeWidth={2.2} />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex flex-col truncate">
                                <span className="font-bold text-xs tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-1.5 truncate">
                                    CodeArena <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#2997ff]/15 dark:text-[#2997ff]">Admin</span>
                                </span>
                                <span className="text-[10px] text-[#86868b] dark:text-[#a1a1a6] truncate">macOS Sequoia Edition</span>
                            </div>
                        )}
                    </div>

                    {/* Collapse Sidebar Button on Desktop */}
                    {!isMobile && (
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-1 rounded-md text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label="Toggle Sidebar Collapse"
                        >
                            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    )}
                </div>

                {/* Navigation Items Grouped by Domain */}
                <nav className="flex-1 overflow-y-auto min-h-0 px-2.5 py-3 space-y-5 overscroll-contain">
                    {NAV_GROUPS.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1">
                            {!sidebarCollapsed && (
                                <div className="px-2.5 mb-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-[#86868b] dark:text-[#636366]">
                                    {group.title}
                                </div>
                            )}

                            {group.items.map((item) => {
                                const IconComponent = item.icon;
                                const isActive = activeTab === item.id;
                                const isIncidents = item.id === 'incidents';
                                const activeBadgeCount = isIncidents ? incidentsCount : item.id === 'problems' ? problemsCount : item.id === 'users' ? usersCount : null;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.id)}
                                        title={sidebarCollapsed ? item.label : undefined}
                                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                                            isActive
                                                ? 'bg-[#0071e3] text-white shadow-xs font-semibold'
                                                : 'text-[#48484a] dark:text-[#a1a1a6] hover:bg-black/[0.045] dark:hover:bg-white/[0.06] hover:text-[#1d1d1f] dark:hover:text-white'
                                        } ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <IconComponent
                                                size={16}
                                                strokeWidth={isActive ? 2.2 : 1.9}
                                                className={`shrink-0 transition-transform duration-150 ${
                                                    isActive
                                                        ? 'text-white scale-105'
                                                        : 'text-[#86868b] dark:text-[#a1a1a6] group-hover:text-[#1d1d1f] dark:group-hover:text-white'
                                                }`}
                                            />
                                            {!sidebarCollapsed && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                        </div>

                                        {/* Badges */}
                                        {!sidebarCollapsed && (
                                            <>
                                                {isIncidents && activeBadgeCount > 0 && (
                                                    <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                                                        isActive
                                                            ? 'bg-white text-[#ff3b30]'
                                                            : 'bg-[#ff3b30] text-white animate-pulse'
                                                    }`}>
                                                        {activeBadgeCount}
                                                    </span>
                                                )}
                                                {item.badgeText && (
                                                    <span className={`px-1.5 py-0.2 text-[9.5px] font-bold rounded-md ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#86868b] dark:text-[#a1a1a6]'
                                                    }`}>
                                                        {item.badgeText}
                                                    </span>
                                                )}
                                                {!isIncidents && !item.badgeText && activeBadgeCount > 0 && (
                                                    <span className={`text-[11px] font-mono ${
                                                        isActive
                                                            ? 'text-white/80'
                                                            : 'text-[#86868b] dark:text-[#636366]'
                                                    }`}>
                                                        {activeBadgeCount}
                                                    </span>
                                                )}
                                            </>
                                        )}

                                        {/* Dot indicator for collapsed sidebar when active incident */}
                                        {sidebarCollapsed && isIncidents && activeBadgeCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff3b30] animate-ping" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Bottom macOS Footer Status (Fixed Footer) */}
                <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] shrink-0">
                    {!sidebarCollapsed ? (
                        <div className="flex items-center justify-between text-[11px] text-[#86868b] dark:text-[#636366]">
                            <div className="flex items-center gap-1.5">
                                <Radio size={12} className="text-emerald-500 animate-pulse" />
                                <span>Spring API</span>
                            </div>
                            <span className="font-mono text-[10px] bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                                v2.4 Native
                            </span>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <Radio size={12} className="text-emerald-500" title="Connected to API :8080" />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
