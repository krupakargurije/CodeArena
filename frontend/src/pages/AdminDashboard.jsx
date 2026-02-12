import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CreateProblemForm from '../components/CreateProblemForm';
import { getProblems, deleteProblem } from '../services/problemService';
import { getAllUsers, grantAdminPermission, revokeAdminPermission } from '../services/userService';

const AdminDashboard = () => {
    const { isAdmin } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('problems');

    // Problems state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [revokeConfirm, setRevokeConfirm] = useState(null); // email of user to revoke

    useEffect(() => {
        if (!isAdmin) {
            navigate('/problems');
        } else {
            if (activeTab === 'problems') {
                fetchProblems();
            } else if (activeTab === 'users') {
                fetchUsers();
            }
        }
    }, [isAdmin, navigate, activeTab]);

    // Problems functions
    const fetchProblems = async () => {
        try {
            const response = await getProblems();
            setProblems(response.data || []);
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        } finally {
            setProblemsLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        fetchProblems();
    };

    const handleDelete = async (problemId) => {
        try {
            await deleteProblem(problemId);
            setDeleteConfirm(null);
            fetchProblems();
        } catch (error) {
            console.error('Failed to delete problem:', error);
            alert(error.message || 'Failed to delete problem');
        }
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            CAKEWALK: 'text-green-400',
            EASY: 'text-difficulty-easy',
            MEDIUM: 'text-difficulty-medium',
            HARD: 'text-difficulty-hard',
        };
        return colors[difficulty] || 'text-gray-400';
    };

    // Users functions
    const fetchUsers = async () => {
        try {
            const response = await getAllUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    const handleGrantAdmin = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            await grantAdminPermission(newAdminEmail);
            setSuccess(`Admin permission granted to ${newAdminEmail}`);
            setNewAdminEmail('');
            fetchUsers();
        } catch (err) {
            setError(err.message || 'Failed to grant admin permission');
        } finally {
            setProcessing(false);
        }
    };

    const handleRevokeAdmin = async (userEmail) => {
        console.log('handleRevokeAdmin called for:', userEmail);
        // Show custom confirmation modal
        setRevokeConfirm(userEmail);
    };

    const confirmRevokeAdmin = async () => {
        const userEmail = revokeConfirm;
        console.log('User confirmed, proceeding with revoke for:', userEmail);
        setRevokeConfirm(null);
        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            await revokeAdminPermission(userEmail);
            console.log('Revoke admin successful');
            setSuccess(`Admin permission revoked from ${userEmail}`);
            fetchUsers();
        } catch (err) {
            console.error('Revoke admin error:', err);
            setError(err.message || 'Failed to revoke admin permission');
        } finally {
            setProcessing(false);
        }
    };

    const admins = users.filter(u => u.is_admin);

    // Filtered and sorted problems (logic unchanged)
    const filteredProblems = problems
        .filter(p => {
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (difficultyFilter !== 'ALL' && p.difficulty !== difficultyFilter) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'title': return (a.title || '').localeCompare(b.title || '');
                case 'difficulty':
                    const order = { 'CAKEWALK': 1, 'EASY': 2, 'MEDIUM': 3, 'HARD': 4 };
                    return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
                default: return 0;
            }
        });

    if (problemsLoading && activeTab === 'problems') {
        return (
            <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center">
                <div className="text-brand-orange text-xl font-medium animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg-primary text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-dark-text-secondary">
                        Manage problems, users, and platform settings
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('problems')}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'problems'
                            ? 'text-brand-orange border-brand-orange'
                            : 'text-dark-text-tertiary border-transparent hover:text-white'
                            }`}
                    >
                        Problems
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'users'
                            ? 'text-brand-orange border-brand-orange'
                            : 'text-dark-text-tertiary border-transparent hover:text-white'
                            }`}
                    >
                        Users & Admins
                    </button>
                    <button
                        disabled
                        className="px-6 py-3 font-medium text-dark-text-tertiary cursor-not-allowed opacity-50 border-b-2 border-transparent"
                    >
                        Settings (Coming Soon)
                    </button>
                </div>

                {/* Problems Tab */}
                {activeTab === 'problems' && (
                    <div className="animate-fade-in">
                        {/* Action Button */}
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Problem
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                            <div className="glass-panel text-center">
                                <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">Total Problems</div>
                                <div className="text-3xl font-bold text-white">{problems.length}</div>
                            </div>
                            <div className="glass-panel text-center">
                                <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">Cakewalk</div>
                                <div className="text-3xl font-bold text-green-400">
                                    {problems.filter(p => p.difficulty === 'CAKEWALK').length}
                                </div>
                            </div>
                            <div className="glass-panel text-center">
                                <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">Easy</div>
                                <div className="text-3xl font-bold text-difficulty-easy">
                                    {problems.filter(p => p.difficulty === 'EASY').length}
                                </div>
                            </div>
                            <div className="glass-panel text-center">
                                <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">Medium</div>
                                <div className="text-3xl font-bold text-difficulty-medium">
                                    {problems.filter(p => p.difficulty === 'MEDIUM').length}
                                </div>
                            </div>
                            <div className="glass-panel text-center">
                                <div className="text-dark-text-tertiary text-xs font-semibold uppercase tracking-wider mb-2">Hard</div>
                                <div className="text-3xl font-bold text-difficulty-hard">
                                    {problems.filter(p => p.difficulty === 'HARD').length}
                                </div>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="glass-panel rounded-xl p-4 mb-6">
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search problems..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="input w-full pl-10 bg-dark-bg-tertiary/50 border-white/5 focus:border-brand-blue/50"
                                        />
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex items-center gap-2">
                                    <span className="text-dark-text-tertiary text-sm">Difficulty:</span>
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="input py-2 bg-dark-bg-tertiary/50 border-white/5"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="CAKEWALK">Cakewalk</option>
                                        <option value="EASY">Easy</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HARD">Hard</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-dark-text-tertiary text-sm">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="input py-2 bg-dark-bg-tertiary/50 border-white/5"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="title">Title (A-Z)</option>
                                        <option value="difficulty">Difficulty</option>
                                    </select>
                                </div>

                                {(searchQuery || difficultyFilter !== 'ALL' || sortBy !== 'newest') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setDifficultyFilter('ALL');
                                            setSortBy('newest');
                                        }}
                                        className="text-brand-orange hover:text-brand-orange/80 text-sm flex items-center gap-1 font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="text-dark-text-tertiary text-sm mt-3 border-t border-white/5 pt-3">
                                Showing <span className="text-white font-medium">{filteredProblems.length}</span> of {problems.length} problems
                            </div>
                        </div>

                        {/* Problems Table */}
                        <div className="glass-panel overflow-hidden rounded-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/5">
                                            <th className="text-left py-4 px-6 text-dark-text-secondary font-medium text-sm text-nowrap">ID</th>
                                            <th className="text-left py-4 px-6 text-dark-text-secondary font-medium text-sm">Title</th>
                                            <th className="text-left py-4 px-6 text-dark-text-secondary font-medium text-sm text-nowrap">Difficulty</th>
                                            <th className="text-left py-4 px-6 text-dark-text-secondary font-medium text-sm">Tags</th>
                                            <th className="text-left py-4 px-6 text-dark-text-secondary font-medium text-sm text-nowrap">Acceptance</th>
                                            <th className="text-right py-4 px-6 text-dark-text-secondary font-medium text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredProblems.map((problem) => (
                                            <tr key={problem.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-6 text-dark-text-tertiary font-mono text-sm">#{problem.id}</td>
                                                <td className="py-4 px-6 text-white font-medium">{problem.id}. {problem.title}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${problem.difficulty === 'HARD' ? 'bg-difficulty-hard/10 text-difficulty-hard border-difficulty-hard/20' :
                                                        problem.difficulty === 'MEDIUM' ? 'bg-difficulty-medium/10 text-difficulty-medium border-difficulty-medium/20' :
                                                            'bg-difficulty-easy/10 text-difficulty-easy border-difficulty-easy/20'
                                                        }`}>
                                                        {problem.difficulty}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-wrap gap-1">
                                                        {problem.tags?.slice(0, 2).map((tag, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-white/5 text-dark-text-secondary text-xs rounded border border-white/5">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {problem.tags?.length > 2 && (
                                                            <span className="text-xs text-dark-text-tertiary ml-1">+{problem.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-dark-text-secondary font-mono text-sm">
                                                    {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '0%'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/problems/${problem.id}`)}
                                                            className="text-brand-blue hover:text-brand-blue/80 p-2 rounded-lg hover:bg-brand-blue/10 transition-colors"
                                                            title="View"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(problem.id)}
                                                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="animate-fade-in">
                        {usersLoading ? (
                            <div className="glass-panel rounded-xl p-8 mb-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
                                <p className="text-white font-medium">Loading users...</p>
                            </div>
                        ) : (
                            <>
                                {/* Grant Admin Form */}
                                <div className="glass-panel rounded-xl p-6 mb-8 border border-white/5">
                                    <h2 className="text-xl font-bold text-white mb-4">Grant Admin Permission</h2>
                                    <form onSubmit={handleGrantAdmin} className="flex gap-4">
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            placeholder="Enter user email address"
                                            className="input flex-1 bg-dark-bg-tertiary/50 focus:bg-dark-bg-tertiary transition-colors"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="btn-primary w-48"
                                        >
                                            {processing ? 'Processing...' : 'Grant Admin'}
                                        </button>
                                    </form>

                                    {/* Messages */}
                                    {error && (
                                        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            {success}
                                        </div>
                                    )}
                                </div>

                                {/* Current Admins */}
                                <div className="glass-panel rounded-xl p-6 mb-8 border border-white/5">
                                    <h2 className="text-xl font-bold text-white mb-6">
                                        Current Admins ({admins.length})
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/5">
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Username</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Email</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Role</th>
                                                    <th className="text-right py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {admins.map((user) => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-4 text-white font-medium">{user.username || 'N/A'}</td>
                                                        <td className="py-3 px-4 text-dark-text-secondary">{user.email}</td>
                                                        <td className="py-3 px-4">
                                                            {user.email === 'krupakargurija177@gmail.com' ? (
                                                                <span className="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-bold rounded border border-brand-orange/20 uppercase">Super Admin</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-brand-blue/20 text-brand-blue text-xs font-bold rounded border border-brand-blue/20 uppercase">Admin</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {user.email !== 'krupakargurija177@gmail.com' && (
                                                                <button
                                                                    onClick={() => handleRevokeAdmin(user.email)}
                                                                    disabled={processing}
                                                                    className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* All Users */}
                                <div className="glass-panel rounded-xl p-6 border border-white/5">
                                    <h2 className="text-xl font-bold text-white mb-6">
                                        All Users ({users.length})
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/5">
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">User</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Email</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Rating</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Solved</th>
                                                    <th className="text-left py-3 px-4 text-dark-text-tertiary text-sm font-medium uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-4 text-white font-medium flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-dark-bg-tertiary flex items-center justify-center text-xs font-bold text-dark-text-secondary border border-white/5">
                                                                {(user.username || user.email || '?')[0].toUpperCase()}
                                                            </div>
                                                            {user.username || 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-4 text-dark-text-secondary">{user.email}</td>
                                                        <td className="py-3 px-4 text-dark-text-secondary font-mono">{user.rating || 1200}</td>
                                                        <td className="py-3 px-4 text-dark-text-secondary font-mono">{user.problemsSolved || 0}</td>
                                                        <td className="py-3 px-4">
                                                            {user.is_admin ? (
                                                                <span className="text-brand-orange text-xs font-bold uppercase">Admin</span>
                                                            ) : (
                                                                <span className="text-dark-text-tertiary text-xs font-medium uppercase">User</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Create Problem Modal */}
                {showCreateForm && (
                    <CreateProblemForm
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setShowCreateForm(false)}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="glass-panel p-8 max-w-md w-full border border-red-500/20 rounded-2xl relative shadow-2xl shadow-red-500/10">
                            <h3 className="text-2xl font-bold text-white mb-2">Delete Problem?</h3>
                            <p className="text-dark-text-secondary mb-8">
                                Are you sure you want to delete this problem? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revoke Admin Confirmation Modal */}
                {revokeConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="glass-panel p-8 max-w-md w-full border border-red-500/20 rounded-2xl relative shadow-2xl shadow-red-500/10">
                            <h3 className="text-2xl font-bold text-white mb-2">Revoke Admin Access?</h3>
                            <p className="text-dark-text-secondary mb-8">
                                Are you sure you want to remove admin privileges from <span className="text-white font-semibold">{revokeConfirm}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setRevokeConfirm(null)}
                                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRevokeAdmin}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                                >
                                    Revoke
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
