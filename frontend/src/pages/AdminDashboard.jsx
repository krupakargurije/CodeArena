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

    // Filtered and sorted problems
    const filteredProblems = problems
        .filter(p => {
            // Search filter
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Difficulty filter
            if (difficultyFilter !== 'ALL' && p.difficulty !== difficultyFilter) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'oldest':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'difficulty':
                    const order = { 'CAKEWALK': 1, 'EASY': 2, 'MEDIUM': 3, 'HARD': 4 };
                    return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
                default:
                    return 0;
            }
        });

    if (problemsLoading && activeTab === 'problems') {
        return (
            <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary flex items-center justify-center">
                <div className="text-primary-400 text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-secondary">
                        Manage problems, users, and platform settings
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b dark:border-dark-border-primary border-light-border-primary">
                    <button
                        onClick={() => setActiveTab('problems')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'problems'
                            ? 'text-brand-orange border-b-2 border-brand-orange'
                            : 'text-secondary hover:text-primary'
                            }`}
                    >
                        Problems
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'users'
                            ? 'text-brand-orange border-b-2 border-brand-orange'
                            : 'text-secondary hover:text-primary'
                            }`}
                    >
                        Users & Admins
                    </button>
                    {/* Placeholder for future tabs */}
                    <button
                        disabled
                        className="px-6 py-3 font-medium text-tertiary cursor-not-allowed opacity-50"
                    >
                        Settings (Coming Soon)
                    </button>
                </div>

                {/* Problems Tab */}
                {activeTab === 'problems' && (
                    <div>
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

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                            <div className="card">
                                <div className="text-secondary text-sm mb-1">Total Problems</div>
                                <div className="text-2xl font-bold text-primary">{problems.length}</div>
                            </div>
                            <div className="card">
                                <div className="text-secondary text-sm mb-1">Cakewalk</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {problems.filter(p => p.difficulty === 'CAKEWALK').length}
                                </div>
                            </div>
                            <div className="card">
                                <div className="text-secondary text-sm mb-1">Easy</div>
                                <div className="text-2xl font-bold text-difficulty-easy">
                                    {problems.filter(p => p.difficulty === 'EASY').length}
                                </div>
                            </div>
                            <div className="card">
                                <div className="text-secondary text-sm mb-1">Medium</div>
                                <div className="text-2xl font-bold text-difficulty-medium">
                                    {problems.filter(p => p.difficulty === 'MEDIUM').length}
                                </div>
                            </div>
                            <div className="card">
                                <div className="text-secondary text-sm mb-1">Hard</div>
                                <div className="text-2xl font-bold text-difficulty-hard">
                                    {problems.filter(p => p.difficulty === 'HARD').length}
                                </div>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="glass rounded-xl p-4 mb-6">
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Search problems..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input w-full"
                                    />
                                </div>

                                {/* Difficulty Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-secondary text-sm">Difficulty:</span>
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="input py-2"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="CAKEWALK">Cakewalk</option>
                                        <option value="EASY">Easy</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HARD">Hard</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div className="flex items-center gap-2">
                                    <span className="text-secondary text-sm">Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="input py-2"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="title">Title (A-Z)</option>
                                        <option value="difficulty">Difficulty</option>
                                    </select>
                                </div>

                                {/* Clear Filters */}
                                {(searchQuery || difficultyFilter !== 'ALL' || sortBy !== 'newest') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setDifficultyFilter('ALL');
                                            setSortBy('newest');
                                        }}
                                        className="text-brand-orange hover:text-brand-orange/80 text-sm flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {/* Results count */}
                            <div className="text-secondary text-sm mt-3">
                                Showing {filteredProblems.length} of {problems.length} problems
                            </div>
                        </div>

                        {/* Problems Table */}
                        <div className="glass rounded-xl p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b dark:border-dark-border-primary border-light-border-primary">
                                            <th className="text-left py-3 px-4 text-secondary font-medium">ID</th>
                                            <th className="text-left py-3 px-4 text-secondary font-medium">Title</th>
                                            <th className="text-left py-3 px-4 text-secondary font-medium">Difficulty</th>
                                            <th className="text-left py-3 px-4 text-secondary font-medium">Tags</th>
                                            <th className="text-left py-3 px-4 text-secondary font-medium">Acceptance</th>
                                            <th className="text-right py-3 px-4 text-secondary font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProblems.map((problem) => (
                                            <tr
                                                key={problem.id}
                                                className="border-b dark:border-dark-border-primary border-light-border-primary hover:bg-dark-bg-secondary/50"
                                            >
                                                <td className="py-3 px-4 text-secondary">{problem.id}</td>
                                                <td className="py-3 px-4 text-primary font-medium">{problem.title}</td>
                                                <td className="py-3 px-4">
                                                    <span className={getDifficultyColor(problem.difficulty)}>
                                                        {problem.difficulty}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {problem.tags?.slice(0, 2).map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-xs rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {problem.tags?.length > 2 && (
                                                            <span className="text-xs text-secondary">
                                                                +{problem.tags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-secondary">
                                                    {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '0%'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/problems/${problem.id}`)}
                                                            className="text-primary-400 hover:text-primary-300 p-1"
                                                            title="View"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(problem.id)}
                                                            className="text-difficulty-hard hover:text-difficulty-hard/80 p-1"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div>
                        {/* Loading State */}
                        {usersLoading && (
                            <div className="glass rounded-xl p-8 mb-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
                                <p className="text-primary font-medium">Loading users...</p>
                                <p className="text-secondary text-sm mt-2">
                                    If this takes a while, the server may be waking up. Please wait...
                                </p>
                            </div>
                        )}

                        {!usersLoading && (
                            <>
                                {/* Grant Admin Form */}
                                <div className="glass rounded-xl p-6 mb-8">
                                    <h2 className="text-xl font-bold text-primary mb-4">Grant Admin Permission</h2>
                                    <form onSubmit={handleGrantAdmin} className="flex gap-4">
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            placeholder="Enter user email"
                                            className="input flex-1"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="btn-primary px-6"
                                        >
                                            {processing ? 'Processing...' : 'Grant Admin'}
                                        </button>
                                    </form>

                                    {/* Messages */}
                                    {error && (
                                        <div className="mt-4 bg-difficulty-hard/10 border border-difficulty-hard/50 text-difficulty-hard px-4 py-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="mt-4 bg-difficulty-easy/10 border border-difficulty-easy/50 text-difficulty-easy px-4 py-3 rounded-lg">
                                            {success}
                                        </div>
                                    )}
                                </div>

                                {/* Current Admins */}
                                <div className="glass rounded-xl p-6 mb-8">
                                    <h2 className="text-xl font-bold text-primary mb-4">
                                        Current Admins ({admins.length})
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b dark:border-dark-border-primary border-light-border-primary">
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Username</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Email</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Rating</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Problems Solved</th>
                                                    <th className="text-right py-3 px-4 text-secondary font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {admins.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="border-b dark:border-dark-border-primary border-light-border-primary hover:bg-dark-bg-secondary/50"
                                                    >
                                                        <td className="py-3 px-4 text-primary font-medium">
                                                            {user.username || 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-4 text-secondary">
                                                            {user.email}
                                                            {user.email === 'krupakargurija177@gmail.com' && (
                                                                <span className="ml-2 px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-xs rounded">
                                                                    Super Admin
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-secondary">{user.rating || 1200}</td>
                                                        <td className="py-3 px-4 text-secondary">{user.problemsSolved || 0}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            {user.email !== 'krupakargurija177@gmail.com' && (
                                                                <button
                                                                    onClick={() => handleRevokeAdmin(user.email)}
                                                                    disabled={processing}
                                                                    className="text-difficulty-hard hover:text-difficulty-hard/80 disabled:opacity-50"
                                                                >
                                                                    Revoke Admin
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
                                <div className="glass rounded-xl p-6">
                                    <h2 className="text-xl font-bold text-primary mb-4">
                                        All Users ({users.length})
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b dark:border-dark-border-primary border-light-border-primary">
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Username</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Email</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Rating</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Problems Solved</th>
                                                    <th className="text-left py-3 px-4 text-secondary font-medium">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr
                                                        key={user.id}
                                                        className="border-b dark:border-dark-border-primary border-light-border-primary hover:bg-dark-bg-secondary/50"
                                                    >
                                                        <td className="py-3 px-4 text-primary font-medium">
                                                            {user.username || 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-4 text-secondary">{user.email}</td>
                                                        <td className="py-3 px-4 text-secondary">{user.rating || 1200}</td>
                                                        <td className="py-3 px-4 text-secondary">{user.problemsSolved || 0}</td>
                                                        <td className="py-3 px-4">
                                                            {user.is_admin ? (
                                                                <span className="px-2 py-1 bg-brand-orange/10 text-brand-orange text-xs rounded">
                                                                    Admin
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded">
                                                                    User
                                                                </span>
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
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="glass rounded-2xl p-8 max-w-md w-full border border-primary-500/20">
                            <h3 className="text-xl font-bold text-primary mb-4">Delete Problem?</h3>
                            <p className="text-secondary mb-6">
                                Are you sure you want to delete this problem? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="btn-primary flex-1 bg-difficulty-hard hover:bg-difficulty-hard/80"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revoke Admin Confirmation Modal */}
                {revokeConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="glass rounded-2xl p-8 max-w-md w-full border border-primary-500/20">
                            <h3 className="text-xl font-bold text-primary mb-4">Revoke Admin?</h3>
                            <p className="text-secondary mb-6">
                                Are you sure you want to revoke admin permissions from <span className="text-brand-orange">{revokeConfirm}</span>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setRevokeConfirm(null)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRevokeAdmin}
                                    className="btn-primary flex-1 bg-difficulty-hard hover:bg-difficulty-hard/80"
                                >
                                    Revoke Admin
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
