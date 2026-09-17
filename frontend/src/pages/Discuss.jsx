import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAllDiscussions } from '../services/discussionService';
import CreateDiscussionModal from '../components/CreateDiscussionModal';

const TAG_FILTERS = ['All', 'General', 'Algorithms', 'Data Structures', 'Dynamic Programming', 'Graphs', 'Templates', 'Feedback', 'Contest'];

// Tag color mapping for visual variety
const TAG_COLORS = {
    General: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
    Algorithms: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
    'Data Structures': { bg: 'rgba(236,72,153,0.12)', color: '#f472b6' },
    'Dynamic Programming': { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    Graphs: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    Templates: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
    Feedback: { bg: 'rgba(244,63,94,0.12)', color: '#fb7185' },
    Contest: { bg: 'rgba(234,179,8,0.12)', color: '#facc15' },
};

const Discuss = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTag, setActiveTag] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // newest, mostReplies

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const fetchDiscussions = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getAllDiscussions();
            setDiscussions(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load discussions');
            setDiscussions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscussionCreated = (discussion) => {
        setShowCreateModal(false);
        if (discussion?.id) {
            navigate(`/discuss/${discussion.id}`);
        } else {
            fetchDiscussions();
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

    // Filter discussions
    const filteredDiscussions = discussions.filter((d) => {
        const matchesTag = activeTag === 'All' || (d.tags && d.tags.includes(activeTag));
        const matchesSearch = !searchQuery ||
            d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.content?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    // Sort discussions
    const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
        if (sortBy === 'mostReplies') return (b.replyCount || 0) - (a.replyCount || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const getTagStyle = (tag) => TAG_COLORS[tag] || { bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Discuss</h1>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {filteredDiscussions.length} thread{filteredDiscussions.length !== 1 ? 's' : ''} · Share ideas, ask questions, debug together.
                        </p>
                    </div>
                    {isAuthenticated ? (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                boxShadow: '0 4px 15px rgba(59,130,246,0.25)',
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Discussion
                        </button>
                    ) : (
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                boxShadow: '0 4px 15px rgba(59,130,246,0.25)',
                            }}
                        >
                            Sign up to discuss
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
                </div>

                {/* Search + Sort Bar */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search discussions..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <option value="newest">Newest</option>
                        <option value="mostReplies">Most Replies</option>
                    </select>
                </div>

                {/* Tag Filters — horizontal pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                    {TAG_FILTERS.map((tag) => {
                        const isActive = activeTag === tag;
                        const tagStyle = getTagStyle(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
                                style={{
                                    background: isActive
                                        ? (tag === 'All' ? 'var(--text-primary)' : tagStyle.bg)
                                        : 'transparent',
                                    color: isActive
                                        ? (tag === 'All' ? 'var(--bg-primary)' : tagStyle.color)
                                        : 'var(--text-tertiary)',
                                    border: `1px solid ${isActive
                                        ? (tag === 'All' ? 'var(--text-primary)' : tagStyle.color + '44')
                                        : 'transparent'}`,
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>

                {/* Error State */}
                {error && !loading && (
                    <div
                        className="mb-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                        style={{
                            background: 'rgba(234,179,8,0.08)',
                            border: '1px solid rgba(234,179,8,0.15)',
                            color: '#eab308',
                        }}
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Backend not connected. Discussions will load once the backend API is running.
                    </div>
                )}

                {/* ══════════ Discussion List Table ══════════ */}
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>

                    {/* Table Header */}
                    <div
                        className="flex items-center px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
                    >
                        <div className="flex-1">Title</div>
                        <div className="w-28 text-center hidden sm:block">Author</div>
                        <div className="w-20 text-center hidden sm:block">Replies</div>
                        <div className="w-24 text-right hidden sm:block">Activity</div>
                    </div>

                    {/* Loading skeleton */}
                    {loading && (
                        <div>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center px-5 py-4 animate-pulse"
                                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                                >
                                    <div className="flex-1">
                                        <div className="h-4 rounded w-3/5 mb-2" style={{ background: 'var(--bg-tertiary)' }} />
                                        <div className="h-3 rounded w-1/4" style={{ background: 'var(--bg-tertiary)' }} />
                                    </div>
                                    <div className="w-28 hidden sm:flex justify-center">
                                        <div className="h-3 rounded w-16" style={{ background: 'var(--bg-tertiary)' }} />
                                    </div>
                                    <div className="w-20 hidden sm:flex justify-center">
                                        <div className="h-3 rounded w-8" style={{ background: 'var(--bg-tertiary)' }} />
                                    </div>
                                    <div className="w-24 hidden sm:flex justify-end">
                                        <div className="h-3 rounded w-14" style={{ background: 'var(--bg-tertiary)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Discussion Rows */}
                    {!loading && sortedDiscussions.length > 0 && (
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {sortedDiscussions.map((thread, idx) => (
                                <div
                                    key={thread.id}
                                    className="flex items-center px-5 py-3.5 cursor-pointer transition-colors duration-150 group"
                                    style={{
                                        borderBottom: idx < sortedDiscussions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                        background: idx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                    }}
                                    onClick={() => navigate(`/discuss/${thread.id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(59,130,246,0.04)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent';
                                    }}
                                >
                                    {/* Left: Upvote icon + Title + Tags */}
                                    <div className="flex-1 min-w-0 flex items-start gap-3">
                                        {/* Chat bubble icon */}
                                        <div
                                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                                            style={{ background: 'var(--bg-tertiary)' }}
                                        >
                                            <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            {/* Title row */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3
                                                    className="font-medium text-sm group-hover:text-blue-400 transition-colors truncate"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {thread.title}
                                                </h3>
                                                {/* Inline tags */}
                                                {thread.tags && thread.tags.slice(0, 2).map((tag) => {
                                                    const ts = getTagStyle(tag);
                                                    return (
                                                        <span
                                                            key={tag}
                                                            className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 hidden md:inline-block"
                                                            style={{ background: ts.bg, color: ts.color }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            {/* Mobile: author + time */}
                                            <div className="flex items-center gap-2 mt-1 sm:hidden text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                <span>@{thread.authorUsername || thread.author}</span>
                                                <span>·</span>
                                                <span>{formatTimeAgo(thread.createdAt)}</span>
                                                <span>·</span>
                                                <span>{thread.replyCount || 0} replies</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Author */}
                                    <div className="w-28 text-center hidden sm:block">
                                        <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                            @{thread.authorUsername || thread.author}
                                        </span>
                                    </div>

                                    {/* Replies */}
                                    <div className="w-20 text-center hidden sm:flex items-center justify-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {thread.replyCount || 0}
                                        </span>
                                    </div>

                                    {/* Activity */}
                                    <div className="w-24 text-right hidden sm:block">
                                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            {formatTimeAgo(thread.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State — inside the table container */}
                    {!loading && sortedDiscussions.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                                <svg className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {searchQuery || activeTag !== 'All' ? 'No discussions match your filters' : 'No discussions yet'}
                            </h3>
                            <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>
                                {searchQuery || activeTag !== 'All'
                                    ? 'Try adjusting your search or tag filter'
                                    : 'Be the first to start a conversation!'}
                            </p>
                            {isAuthenticated && !searchQuery && activeTag === 'All' && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        boxShadow: '0 4px 15px rgba(59,130,246,0.25)',
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Discussion
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results count */}
                {!loading && sortedDiscussions.length > 0 && (
                    <div className="mt-3 text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>
                        Showing {sortedDiscussions.length} of {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                            <div>
                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>CodeArena</div>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fast, minimal competitive coding.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <a href="#" className="hover:text-white transition-colors">Docs</a>
                            <a href="#" className="hover:text-white transition-colors">Status</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="https://github.com/krupakargurije?tab=overview&from=2026-01-01&to=2026-01-31" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </a>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Create Discussion Modal */}
            {showCreateModal && (
                <CreateDiscussionModal
                    onClose={() => setShowCreateModal(false)}
                    onDiscussionCreated={handleDiscussionCreated}
                />
            )}
        </div>
    );
};

export default Discuss;

