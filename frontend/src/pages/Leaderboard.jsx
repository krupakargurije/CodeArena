import { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/userService';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                console.log('Fetching leaderboard data...');
                const response = await getLeaderboard();
                console.log('Leaderboard response:', response);
                console.log('Leaderboard data:', response.data);
                setUsers(response.data || []);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getMedalIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    const getRankClass = (rank) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
        if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
        if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/30';
        return 'bg-dark-secondary border-dark-tertiary';
    };

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 dark:text-dark-text-primary text-light-text-primary">
                        Leaderboard
                    </h1>
                    <p className="dark:text-dark-text-secondary text-light-text-secondary">
                        Top performers in the arena
                    </p>
                </div>

                <div className="panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="dark:bg-dark-bg-tertiary bg-light-bg-tertiary">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">Rank</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">Username</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">Rating</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">Problems Solved</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold dark:text-dark-text-primary text-light-text-primary">Country</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i} className="table-row">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="skeleton h-12 rounded" />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    (users || []).map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className={`table-row ${getRankClass(index + 1)}`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-bold text-brand-orange">
                                                    {getMedalIcon(index + 1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium dark:text-dark-text-primary text-light-text-primary">{user.username}</div>
                                                {user.organization && (
                                                    <div className="text-sm dark:text-dark-text-tertiary text-light-text-tertiary">{user.organization}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-semibold text-brand-orange">
                                                    {user.rating}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 dark:text-dark-text-secondary text-light-text-secondary">
                                                {user.problemsSolved}
                                            </td>
                                            <td className="px-6 py-4 dark:text-dark-text-tertiary text-light-text-tertiary">
                                                {user.country || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!loading && (!users || users.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="dark:text-dark-text-secondary text-light-text-secondary">
                                                No users found on the leaderboard yet.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
