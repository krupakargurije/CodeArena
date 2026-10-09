import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    SlidersHorizontal,
    Code2,
    Users,
    Activity,
    ShieldCheck,
    Settings2,
    ArrowUpDown,
    MoreVertical,
    Eye,
    Sliders,
    Trash2,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    ShieldAlert,
    ExternalLink,
    Filter,
    X,
    Sparkles,
    Check,
    ChevronDown
} from 'lucide-react';

import '../styles/adminMacTheme.css';
import AdminTitlebar from '../components/admin/layout/AdminTitlebar';
import AdminSidebar from '../components/admin/layout/AdminSidebar';
import AdminCommandPalette from '../components/admin/layout/AdminCommandPalette';
import AdminOverviewView from '../components/admin/overview/AdminOverviewView';
import AdminSettingsView from '../components/admin/settings/AdminSettingsView';

import CreateProblemForm from '../components/CreateProblemForm';
import TestCaseManager from '../components/admin/TestCaseManager';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import MonitoringDashboard from '../components/admin/monitoring/MonitoringDashboard';
import IncidentsManager from '../components/admin/monitoring/IncidentsManager';
import ApiPerformanceView from '../components/admin/monitoring/ApiPerformanceView';
import SubmissionAnalyticsView from '../components/admin/monitoring/SubmissionAnalyticsView';

import { getProblems, deleteProblem } from '../services/problemService';
import { getAllUsers, grantAdminPermission, revokeAdminPermission } from '../services/userService';
import { getSystemOverview } from '../services/monitoringService';

const TAB_LABELS = {
    overview: 'Overview',
    problems: 'Problems Catalog',
    users: 'Users & Permissions',
    monitoring: 'System Health',
    incidents: 'Incidents & Alerts',
    performance: 'API Performance',
    submissions: 'Submissions Analytics',
    audit: 'Audit Logs & Diffs',
    settings: 'Console Settings'
};

const AdminDashboard = () => {
    const { isAdmin } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Core Shell State
    const [activeTab, setActiveTab] = useState('overview');
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('codearena_admin_theme') || 'dark';
    });
    const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('codearena_sidebar_collapsed') === 'true';
    });
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);

    // Monitoring State
    const [overviewData, setOverviewData] = useState(null);
    const [monitoringLoading, setMonitoringLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Problems State
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedProblemForTestCases, setSelectedProblemForTestCases] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);

    // Problems Filtering & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('id');

    // Users State
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [userActionError, setUserActionError] = useState('');
    const [userActionSuccess, setUserActionSuccess] = useState('');
    const [revokeConfirm, setRevokeConfirm] = useState(null);

    // Auth verification
    useEffect(() => {
        if (isAdmin === false) {
            navigate('/problems');
        }
    }, [isAdmin, navigate]);

    // Theme handling
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('codearena_admin_theme', next);
            return next;
        });
    }, []);

    const toggleSidebarCollapsed = useCallback((val) => {
        setSidebarCollapsed((prev) => {
            const next = typeof val === 'boolean' ? val : !prev;
            localStorage.setItem('codearena_sidebar_collapsed', String(next));
            return next;
        });
    }, []);

    // Fetch telemetry overview
    const fetchOverview = useCallback(async () => {
        try {
            setRefreshing(true);
            const data = await getSystemOverview();
            setOverviewData(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch telemetry overview:', err);
        } finally {
            setMonitoringLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch problems
    const fetchProblems = useCallback(async () => {
        try {
            setProblemsLoading(true);
            const res = await getProblems();
            setProblems(res.data || []);
        } catch (err) {
            console.error('Failed to fetch problems:', err);
        } finally {
            setProblemsLoading(false);
        }
    }, []);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setUsersLoading(true);
            const res = await getAllUsers();
            setUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setUserActionError('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        if (isAdmin) {
            fetchOverview();
            fetchProblems();
            fetchUsers();
        }
    }, [isAdmin, fetchOverview, fetchProblems, fetchUsers]);

    // Polling interval for monitoring
    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
        const intervalId = setInterval(fetchOverview, autoRefreshInterval);
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval, fetchOverview]);

    // Global keyboard shortcuts (⌘K for command palette, ⌘B for sidebar)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleSidebarCollapsed();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebarCollapsed]);

    // Problem operations
    const handleDeleteProblem = async (id) => {
        try {
            await deleteProblem(id);
            setDeleteConfirm(null);
            fetchProblems();
        } catch (err) {
            console.error('Failed to delete problem:', err);
            alert(err.message || 'Failed to delete problem');
        }
    };

    // User operations
    const handleGrantAdmin = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setUserActionError('');
        setUserActionSuccess('');

        try {
            await grantAdminPermission(newAdminEmail);
            setUserActionSuccess(`Granted administrator permission to ${newAdminEmail}`);
            setNewAdminEmail('');
            fetchUsers();
        } catch (err) {
            setUserActionError(err.message || 'Failed to grant admin permission');
        } finally {
            setProcessing(false);
        }
    };

    const confirmRevokeAdmin = async () => {
        const email = revokeConfirm;
        setRevokeConfirm(null);
        setProcessing(true);
        setUserActionError('');
        setUserActionSuccess('');

        try {
            await revokeAdminPermission(email);
            setUserActionSuccess(`Revoked administrator permissions from ${email}`);
            fetchUsers();
        } catch (err) {
            setUserActionError(err.message || 'Failed to revoke admin permission');
        } finally {
            setProcessing(false);
        }
    };

    // Filtered problems
    const filteredProblems = useMemo(() => {
        return problems
            .filter((p) => {
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchTitle = p.title?.toLowerCase().includes(q);
                    const matchId = p.id?.toString().includes(q);
                    const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
                    if (!matchTitle && !matchId && !matchTag) return false;
                }
                if (difficultyFilter !== 'ALL' && p.difficulty !== difficultyFilter) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'id': return a.id - b.id;
                    case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    case 'title': return (a.title || '').localeCompare(b.title || '');
                    case 'difficulty': {
                        const order = { CAKEWALK: 1, EASY: 2, MEDIUM: 3, HARD: 4 };
                        return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
                    }
                    default: return 0;
                }
            });
    }, [problems, searchQuery, difficultyFilter, sortBy]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            if (userSearchQuery) {
                const q = userSearchQuery.toLowerCase();
                const matchEmail = u.email?.toLowerCase().includes(q);
                const matchUsername = u.username?.toLowerCase().includes(q);
                if (!matchEmail && !matchUsername) return false;
            }
            if (userRoleFilter === 'ADMIN' && !u.is_admin) return false;
            if (userRoleFilter === 'USER' && u.is_admin) return false;
            return true;
        });
    }, [users, userSearchQuery, userRoleFilter]);

    const activeIncidentsCount = overviewData?.activeIncidentsCount || 0;

    return (
        <div className={`macos-admin-root ${theme === 'dark' ? 'dark' : ''} fixed inset-0 h-screen w-screen flex flex-col overflow-hidden bg-[#f5f5f7] dark:bg-[#121214] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-150 select-none z-30`}>
            {/* Top Toolbar / Window Chrome */}
            <AdminTitlebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapsed={toggleSidebarCollapsed}
                activeSection={activeTab}
                activeSectionLabel={TAB_LABELS[activeTab] || 'Console'}
                onNavigateSection={(tab) => setActiveTab(tab)}
                theme={theme}
                toggleTheme={toggleTheme}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                onRefreshTelemetry={fetchOverview}
            />

            {/* Application Body: Sidebar + Main Content Region */}
            <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
                {/* macOS Sequoia Navigation Sidebar */}
                <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={toggleSidebarCollapsed}
                    incidentsCount={activeIncidentsCount}
                    problemsCount={problems.length}
                    usersCount={users.length}
                />

                {/* Main Scrollable Canvas */}
                <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 overscroll-contain">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* ━━━━━━━━━━━━━━━━━━━━ 1. OVERVIEW VIEW ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'overview' && (
                            <AdminOverviewView
                                overviewData={overviewData}
                                problems={problems}
                                users={users}
                                loading={monitoringLoading}
                                refreshing={refreshing}
                                onRefresh={fetchOverview}
                                onNavigateTab={setActiveTab}
                                onCreateProblem={() => setShowCreateForm(true)}
                                lastUpdated={lastUpdated}
                            />
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 2. PROBLEMS CATALOG ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'problems' && (
                            <div className="space-y-5 animate-mac-fade">
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                            <Code2 size={20} className="text-[#0071e3] dark:text-[#2997ff]" />
                                            <span>Problems Catalog</span>
                                        </h1>
                                        <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                            Manage problem statements, execution limits, tags, and evaluation test suites.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="mac-btn-primary self-start sm:self-auto shadow-sm"
                                    >
                                        <Plus size={15} strokeWidth={2.5} />
                                        <span>Create Problem</span>
                                    </button>
                                </div>

                                {/* Filter, Search & Segmented Controls Bar */}
                                <div className="mac-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                                    {/* Search input */}
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by title, ID (#4), or tag..."
                                            className="mac-input pl-8"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Segmented Difficulty Control */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                                        <div className="mac-segmented-control shrink-0">
                                            {['ALL', 'CAKEWALK', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
                                                <button
                                                    key={diff}
                                                    onClick={() => setDifficultyFilter(diff)}
                                                    className={`mac-segmented-item ${difficultyFilter === diff ? 'active' : ''}`}
                                                >
                                                    {diff === 'ALL' ? 'All' : diff.charAt(0) + diff.slice(1).toLowerCase()}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Sort dropdown */}
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="mac-input w-36 text-xs shrink-0"
                                        >
                                            <option value="id">Sort: ID (1-N)</option>
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="title">Title (A-Z)</option>
                                            <option value="difficulty">Difficulty</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Problems Table */}
                                <div className="mac-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#6e6e73] dark:text-[#a1a1a6] select-none font-semibold">
                                                    <th className="py-3 px-4 font-mono w-16">ID</th>
                                                    <th className="py-3 px-4">Title</th>
                                                    <th className="py-3 px-4 w-28">Difficulty</th>
                                                    <th className="py-3 px-4">Tags</th>
                                                    <th className="py-3 px-4 w-28">Acceptance</th>
                                                    <th className="py-3 px-4 text-right w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                                                {problemsLoading ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-[#86868b]">
                                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3] mb-2" />
                                                            <div>Loading catalog...</div>
                                                        </td>
                                                    </tr>
                                                ) : filteredProblems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-[#86868b]">
                                                            No problems matching your filter criteria.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredProblems.map((problem) => {
                                                        const diff = problem.difficulty || 'MEDIUM';
                                                        const badgeClass =
                                                            diff === 'CAKEWALK' ? 'mac-badge-green' :
                                                            diff === 'EASY' ? 'mac-badge-blue' :
                                                            diff === 'MEDIUM' ? 'mac-badge-amber' :
                                                            'mac-badge-red';

                                                        return (
                                                            <tr
                                                                key={problem.id}
                                                                className="hover:bg-black/[0.025] dark:hover:bg-white/[0.035] transition-colors group"
                                                            >
                                                                <td className="py-3 px-4 font-mono text-[#86868b] dark:text-[#636366]">
                                                                    #{problem.id}
                                                                </td>
                                                                <td className="py-3 px-4 font-medium text-[#1d1d1f] dark:text-white">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="truncate">{problem.title}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className={`mac-badge ${badgeClass}`}>
                                                                        {diff}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {problem.tags?.slice(0, 3).map((tag, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[10px] text-[#6e6e73] dark:text-[#a1a1a6]"
                                                                            >
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                        {problem.tags?.length > 3 && (
                                                                            <span className="text-[10px] text-[#86868b] self-center">
                                                                                +{problem.tags.length - 3}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 font-mono text-[#6e6e73] dark:text-[#a1a1a6]">
                                                                    {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '0%'}
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button
                                                                            onClick={() => setSelectedProblemForTestCases(problem)}
                                                                            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#0071e3] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                                                                            title="Manage Test Cases"
                                                                        >
                                                                            <Sliders size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => navigate(`/problems/${problem.id}`)}
                                                                            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#0071e3] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                                                                            title="View in Arena"
                                                                        >
                                                                            <Eye size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeleteConfirm(problem.id)}
                                                                            className="p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-500/10 transition"
                                                                            title="Delete Problem"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Table Footer */}
                                    <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between text-[11px] text-[#86868b] dark:text-[#636366]">
                                        <span>Showing {filteredProblems.length} of {problems.length} problems</span>
                                        <span>Click slider icon to manage test cases</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 3. USERS & ADMINS ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-mac-fade">
                                {/* Section Header */}
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-[#0071e3] dark:text-[#2997ff]" />
                                        <span>Users & Access Control</span>
                                    </h1>
                                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                        Govern user privileges, grant administrator roles, and inspect membership directory.
                                    </p>
                                </div>

                                {/* Grant Admin Section Card */}
                                <div className="mac-card p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] dark:text-white">
                                        <UserPlus size={15} className="text-[#0071e3] dark:text-[#2997ff]" />
                                        <span>Grant Administrator Role</span>
                                    </div>

                                    <form onSubmit={handleGrantAdmin} className="flex flex-col sm:flex-row gap-2.5">
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            placeholder="Enter user email (e.g. engineer@codearena.com)"
                                            className="mac-input flex-1"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={processing || !newAdminEmail.trim()}
                                            className="mac-btn-primary shrink-0"
                                        >
                                            {processing ? 'Authorizing...' : 'Grant Access'}
                                        </button>
                                    </form>

                                    {/* Action Feedback Messages */}
                                    {userActionError && (
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>{userActionError}</span>
                                        </div>
                                    )}
                                    {userActionSuccess && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                                            <CheckCircle2 size={14} className="shrink-0" />
                                            <span>{userActionSuccess}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Users Directory Card */}
                                <div className="mac-card p-4 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="relative flex-1 max-w-sm">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                                            <input
                                                type="text"
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                                placeholder="Search user or email..."
                                                className="mac-input pl-8"
                                            />
                                        </div>

                                        {/* Role Filter Segmented Control */}
                                        <div className="mac-segmented-control self-start sm:self-auto">
                                            <button
                                                onClick={() => setUserRoleFilter('ALL')}
                                                className={`mac-segmented-item ${userRoleFilter === 'ALL' ? 'active' : ''}`}
                                            >
                                                All ({users.length})
                                            </button>
                                            <button
                                                onClick={() => setUserRoleFilter('ADMIN')}
                                                className={`mac-segmented-item ${userRoleFilter === 'ADMIN' ? 'active' : ''}`}
                                            >
                                                Admins ({users.filter(u => u.is_admin).length})
                                            </button>
                                            <button
                                                onClick={() => setUserRoleFilter('USER')}
                                                className={`mac-segmented-item ${userRoleFilter === 'USER' ? 'active' : ''}`}
                                            >
                                                Members ({users.filter(u => !u.is_admin).length})
                                            </button>
                                        </div>
                                    </div>

                                    {/* Users Table */}
                                    <div className="overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#6e6e73] dark:text-[#a1a1a6] font-semibold select-none">
                                                    <th className="py-3 px-4">User</th>
                                                    <th className="py-3 px-4">Email</th>
                                                    <th className="py-3 px-4">Role</th>
                                                    <th className="py-3 px-4 font-mono">Rating</th>
                                                    <th className="py-3 px-4 font-mono">Solved</th>
                                                    <th className="py-3 px-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                                                {usersLoading ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-[#86868b]">
                                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3] mb-2" />
                                                            <div>Loading users...</div>
                                                        </td>
                                                    </tr>
                                                ) : filteredUsers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-10 text-center text-[#86868b]">
                                                            No users found matching query.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredUsers.map((user) => {
                                                        const name = user.username || user.email?.split('@')[0] || 'User';
                                                        const initial = (name[0] || 'U').toUpperCase();

                                                        return (
                                                            <tr key={user.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                                                <td className="py-3 px-4 font-medium text-[#1d1d1f] dark:text-white">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#0071e3] to-[#5856d6] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0">
                                                                            {initial}
                                                                        </div>
                                                                        <span className="truncate">{name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                                    {user.email}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    {user.is_admin ? (
                                                                        <span className="mac-badge mac-badge-purple">
                                                                            <ShieldCheck size={11} /> Admin
                                                                        </span>
                                                                    ) : (
                                                                        <span className="mac-badge bg-black/[0.05] dark:bg-white/[0.08] text-[#86868b] dark:text-[#a1a1a6]">
                                                                            Member
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 px-4 font-mono text-[#6e6e73] dark:text-[#a1a1a6]">
                                                                    {user.rating || 1200}
                                                                </td>
                                                                <td className="py-3 px-4 font-mono text-[#6e6e73] dark:text-[#a1a1a6]">
                                                                    {user.problemsSolved || 0}
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    {user.is_admin && user.email !== 'krupakargurija177@gmail.com' ? (
                                                                        <button
                                                                            onClick={() => setRevokeConfirm(user.email)}
                                                                            disabled={processing}
                                                                            className="text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium text-xs hover:underline"
                                                                        >
                                                                            Revoke
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[#86868b] dark:text-[#636366] text-[11px]">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 4. SYSTEM HEALTH & MONITORING ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'monitoring' && (
                            <MonitoringDashboard />
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 5. DIRECT INCIDENTS TAB ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'incidents' && (
                            <div className="space-y-6 animate-mac-fade">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                            <ShieldAlert size={20} className="text-[#ff3b30]" />
                                            <span>Incident Management & Automated Alerts</span>
                                        </h1>
                                        <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                            Real-time failure lifecycle, root-cause diagnostics, and MTTR tracking.
                                        </p>
                                    </div>
                                </div>
                                <IncidentsManager autoRefreshInterval={autoRefreshInterval} />
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 6. DIRECT PERFORMANCE TAB ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'performance' && (
                            <div className="space-y-6 animate-mac-fade">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                        <Activity size={20} className="text-[#af52de] dark:text-[#bf5af2]" />
                                        <span>API Latency & Runtime Performance</span>
                                    </h1>
                                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                        Percentile distributions (p50, p95, p99), HTTP status breakdown, and JVM memory.
                                    </p>
                                </div>
                                <ApiPerformanceView autoRefreshInterval={autoRefreshInterval} />
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 7. DIRECT SUBMISSIONS TAB ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'submissions' && (
                            <div className="space-y-6 animate-mac-fade">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                        <Code2 size={20} className="text-[#0071e3] dark:text-[#2997ff]" />
                                        <span>Submission Analytics & Sandbox Health</span>
                                    </h1>
                                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                        Judge0 verdict distribution, language breakdown, and evaluation queue metrics.
                                    </p>
                                </div>
                                <SubmissionAnalyticsView autoRefreshInterval={autoRefreshInterval} />
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 8. AUDIT LOGS & DIFFS ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'audit' && (
                            <div className="space-y-6 animate-mac-fade">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                        <ShieldCheck size={20} className="text-[#34c759] dark:text-[#30d158]" />
                                        <span>Audit Logs & State Diffs</span>
                                    </h1>
                                    <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                                        Tamper-evident audit trail with automated before/after JSON diffs for all admin operations.
                                    </p>
                                </div>
                                <AuditLogViewer />
                            </div>
                        )}

                        {/* ━━━━━━━━━━━━━━━━━━━━ 9. CONSOLE SETTINGS ━━━━━━━━━━━━━━━━━━━━ */}
                        {activeTab === 'settings' && (
                            <AdminSettingsView
                                theme={theme}
                                toggleTheme={toggleTheme}
                                autoRefreshInterval={autoRefreshInterval}
                                setAutoRefreshInterval={setAutoRefreshInterval}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━ MODALS & SHEETS ━━━━━━━━━━━━━━━━━━━━ */}

            {/* Command Palette Modal (⌘K) */}
            <AdminCommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                onNavigate={(tab) => {
                    setActiveTab(tab);
                    setCommandPaletteOpen(false);
                }}
                onCreateProblem={() => {
                    setActiveTab('problems');
                    setShowCreateForm(true);
                }}
                theme={theme}
                toggleTheme={toggleTheme}
                problems={problems}
            />

            {/* Create Problem Modal Sheet */}
            {showCreateForm && (
                <CreateProblemForm
                    onSuccess={() => {
                        setShowCreateForm(false);
                        fetchProblems();
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Manage Test Cases Modal */}
            {selectedProblemForTestCases && (
                <TestCaseManager
                    problem={selectedProblemForTestCases}
                    onClose={() => setSelectedProblemForTestCases(null)}
                />
            )}

            {/* Delete Confirmation Sheet (macOS Modal) */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="mac-card max-w-sm w-full p-6 shadow-2xl border-black/[0.1] dark:border-white/[0.1] animate-mac-scale space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">Delete Problem #{deleteConfirm}?</h3>
                                <p className="text-xs text-[#86868b] dark:text-[#636366]">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
                            Deleting this problem will permanently remove it along with all associated test cases and submissions.
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="mac-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteProblem(deleteConfirm)}
                                className="mac-btn-danger"
                            >
                                Delete Problem
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Admin Confirmation Sheet */}
            {revokeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="mac-card max-w-sm w-full p-6 shadow-2xl border-black/[0.1] dark:border-white/[0.1] animate-mac-scale space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">Revoke Admin Access?</h3>
                                <p className="text-xs text-[#86868b] dark:text-[#636366]">Role modification</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed">
                            Are you sure you want to remove administrator privileges from <strong className="text-[#1d1d1f] dark:text-white">{revokeConfirm}</strong>?
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setRevokeConfirm(null)}
                                className="mac-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevokeAdmin}
                                className="mac-btn-danger"
                            >
                                Revoke Permission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
