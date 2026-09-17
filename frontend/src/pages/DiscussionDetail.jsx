import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getDiscussionById, addReply, deleteDiscussion, deleteReply } from '../services/discussionService';

const DiscussionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [discussion, setDiscussion] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [deletingDiscussion, setDeletingDiscussion] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingReplyId, setDeletingReplyId] = useState(null);

    useEffect(() => {
        fetchDiscussion();
    }, [id]);

    const fetchDiscussion = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getDiscussionById(id);
            const data = response.data;
            setDiscussion(data);
            setReplies(data.replies || []);
        } catch (err) {
            setError(err.message || 'Failed to load discussion');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmittingReply(true);
        setReplyError('');
        try {
            const response = await addReply(id, { content: replyContent.trim() });
            setReplies((prev) => [...prev, response.data]);
            setReplyContent('');
            // Update reply count on the discussion
            setDiscussion((prev) => prev ? { ...prev, replyCount: (prev.replyCount || 0) + 1 } : prev);
        } catch (err) {
            setReplyError(err.message || 'Failed to post reply');
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleDeleteDiscussion = async () => {
        setDeletingDiscussion(true);
        try {
            await deleteDiscussion(id);
            navigate('/discuss');
        } catch (err) {
            setError(err.message || 'Failed to delete discussion');
            setDeletingDiscussion(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteReply = async (replyId) => {
        setDeletingReplyId(replyId);
        try {
            await deleteReply(id, replyId);
            setReplies((prev) => prev.filter((r) => r.id !== replyId));
            setDiscussion((prev) => prev ? { ...prev, replyCount: Math.max(0, (prev.replyCount || 1) - 1) } : prev);
        } catch (err) {
            console.error('Failed to delete reply:', err);
        } finally {
            setDeletingReplyId(null);
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        try {
            let utcStr = dateStr;
            if (!utcStr.endsWith('Z') && !utcStr.includes('+')) {
                utcStr += 'Z';
            }
            const date = new Date(utcStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHr = Math.floor(diffMs / 3600000);
            const diffDay = Math.floor(diffMs / 86400000);

            if (diffMin < 1) return 'just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            if (diffHr < 24) return `${diffHr}h ago`;
            if (diffDay < 30) return `${diffDay}d ago`;
            return date.toLocaleDateString();
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error && !discussion) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-16 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div className="text-4xl mb-4">😕</div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Discussion not found</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>{error}</p>
                        <Link
                            to="/discuss"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all"
                        >
                            ← Back to Discuss
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Link
                    to="/discuss"
                    className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Discussions
                </Link>

                {/* Discussion Card */}
                <div
                    className="rounded-xl p-6 mb-6"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    {/* Meta Row */}
                    <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>CA</span>
                            <span style={{ color: 'var(--text-secondary)' }}>@{discussion?.authorUsername || 'unknown'}</span>
                        </div>
                        <span>·</span>
                        <span>{formatTimeAgo(discussion?.createdAt)}</span>
                        <span>·</span>
                        <span>{discussion?.replyCount || 0} replies</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        {discussion?.title}
                    </h1>

                    {/* Tags */}
                    {discussion?.tags && discussion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {discussion.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {discussion?.content}
                    </div>

                    {/* Actions */}
                    {isAuthenticated && user?.id === discussion?.authorId && (
                        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                                style={{ color: '#ef4444' }}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Discussion
                            </button>
                        </div>
                    )}
                </div>

                {/* Replies Section */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        Replies ({replies.length})
                    </h2>

                    {replies.length > 0 ? (
                        <div className="space-y-3">
                            {replies.map((reply) => (
                                <div
                                    key={reply.id}
                                    className="rounded-xl p-4 group"
                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                >
                                    {/* Reply Meta */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            <span className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>CA</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>@{reply.authorUsername}</span>
                                            <span>·</span>
                                            <span>{formatTimeAgo(reply.createdAt)}</span>
                                        </div>
                                        {isAuthenticated && user?.id === reply.authorId && (
                                            <button
                                                onClick={() => handleDeleteReply(reply.id)}
                                                disabled={deletingReplyId === reply.id}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-red-500/10"
                                                style={{ color: '#ef4444' }}
                                            >
                                                {deletingReplyId === reply.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Reply Content */}
                                    <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                                        {reply.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                            <div className="text-3xl mb-3">💬</div>
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No replies yet. Be the first to respond!</p>
                        </div>
                    )}
                </div>

                {/* Reply Input */}
                {isAuthenticated ? (
                    <div
                        className="rounded-xl p-5"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                    >
                        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            Your Reply
                        </h3>
                        <form onSubmit={handleSubmitReply}>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write your reply..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all mb-3"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                            {replyError && (
                                <div className="text-xs text-red-400 mb-3">{replyError}</div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                    {replyContent.length} characters
                                </span>
                                <button
                                    type="submit"
                                    disabled={submittingReply || !replyContent.trim()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        color: '#ffffff',
                                        boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                                    }}
                                >
                                    {submittingReply ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Post Reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div
                        className="rounded-xl p-5 text-center"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                    >
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                            Sign in to join the discussion
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all"
                        >
                            Sign in
                        </Link>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }}>
                    <div className="rounded-2xl p-8 max-w-md w-full mx-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Delete Discussion?</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            This will permanently delete the discussion and all its replies. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDiscussion}
                                disabled={deletingDiscussion}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {deletingDiscussion ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscussionDetail;
