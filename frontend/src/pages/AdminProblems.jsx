import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CreateProblemForm from '../components/CreateProblemForm';
import { getProblems, deleteProblem } from '../services/problemService';

const AdminProblems = () => {
    const { isAdmin } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/problems');
        } else {
            fetchProblems();
        }
    }, [isAdmin, navigate]);

    const fetchProblems = async () => {
        try {
            const response = await getProblems();
            setProblems(response.data || []);
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        } finally {
            setLoading(false);
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">
                            Manage Problems
                        </h1>
                        <p className="text-secondary">
                            Create, edit, and delete problems
                        </p>
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                                {problems.map((problem) => (
                                    <tr
                                        key={problem.id}
                                        className="border-b dark:border-dark-border-primary border-light-border-primary hover:bg-dark-bg-secondary/50"
                                    >
                                        <td className="py-3 px-4 text-secondary">{problem.id}</td>
                                        <td className="py-3 px-4 text-primary font-medium">{problem.id}. {problem.title}</td>
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
        </div>
    );
};

export default AdminProblems;
