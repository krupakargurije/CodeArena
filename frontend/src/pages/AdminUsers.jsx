import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, grantAdminPermission, revokeAdminPermission } from '../services/userService';

const AdminUsers = () => {
    const { isAdmin } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAdmin) {
            navigate('/problems');
        } else {
            fetchUsers();
        }
    }, [isAdmin, navigate]);

    const fetchUsers = async () => {
        try {
            const response = await getAllUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
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
        if (!confirm(`Are you sure you want to revoke admin permissions from ${userEmail}?`)) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            await revokeAdminPermission(userEmail);
            setSuccess(`Admin permission revoked from ${userEmail}`);
            fetchUsers();
        } catch (err) {
            setError(err.message || 'Failed to revoke admin permission');
        } finally {
            setProcessing(false);
        }
    };

    const admins = users.filter(u => u.isAdmin);
    const regularUsers = users.filter(u => !u.isAdmin);

    if (loading) {
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
                        Manage Admins
                    </h1>
                    <p className="text-secondary">
                        Grant or revoke admin permissions
                    </p>
                </div>

                {/* Grant Admin Form */}
                <div className="panel p-6 mb-8">
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
                <div className="panel p-6 mb-8">
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
                <div className="panel p-6">
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
                                            {user.isAdmin ? (
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
            </div>
        </div>
    );
};

export default AdminUsers;
