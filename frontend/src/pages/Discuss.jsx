import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Discuss = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [discussions] = useState([
        {
            id: 1,
            title: 'Best way to practice for 1800+?',
            description: 'Share schedules, problem sets, and review loops.',
            author: '@hittin9',
            timeAgo: '5m ago',
            replies: 42,
            isNew: true,
        },
        {
            id: 2,
            title: 'Segment tree templates (clean)',
            description: 'Minimal + fast templates for common ops.',
            author: '@heap',
            timeAgo: '5m ago',
            replies: 42,
            isNew: true,
        },
        {
            id: 3,
            title: 'Arena Mode feedback thread',
            description: 'What should we add next?',
            author: '@arena',
            timeAgo: '5m ago',
            replies: 42,
            isNew: true,
        },
        {
            id: 4,
            title: 'Dynamic Programming roadmap',
            description: 'From beginner to advanced DP patterns.',
            author: '@dp_master',
            timeAgo: '15m ago',
            replies: 28,
            isNew: false,
        },
        {
            id: 5,
            title: 'Graph algorithms cheat sheet',
            description: 'BFS, DFS, Dijkstra, and more.',
            author: '@graphpro',
            timeAgo: '1h ago',
            replies: 56,
            isNew: false,
        },
    ]);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Discuss</h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Fast threads, clean formatting, and keyboard-first navigation.
                    </p>
                </div>

                {/* Discussion Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {discussions.slice(0, 3).map((thread) => (
                        <div
                            key={thread.id}
                            className="backdrop-blur-xl rounded-xl p-5 transition-all group"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                        >
                            {/* Meta Row */}
                            <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {thread.isNew && (
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        <span className="text-green-400">new</span>
                                    </span>
                                )}
                                <span>{thread.timeAgo}</span>
                                <span>·</span>
                                <span>{thread.replies} replies</span>
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors" style={{ color: 'var(--text-primary)' }}>
                                {thread.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                {thread.description}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>CA</span>
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{thread.author}</span>
                                </div>
                                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                >
                                    Open
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Build Your Momentum Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left - Momentum */}
                    <div className="backdrop-blur-xl rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Build your momentum</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Stay in flow with a distraction-free editor, clean submissions history, and performance insights.
                        </p>

                        {/* Feature Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <span>⌨️</span> Keyboard-first
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <span>&lt;/&gt;</span> Monaco-ready
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <span>⚡</span> Low-latency
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <span>🏆</span> Ranked
                            </span>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <button
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Discussion
                                </button>
                            ) : (
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-medium hover:bg-blue-600 transition-all"
                                >
                                    Create account
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            )}
                            <Link
                                to="/problems"
                                className="px-5 py-2.5 rounded-lg font-medium transition-all"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Explore problems
                            </Link>
                        </div>
                    </div>

                    {/* Right - Quick Actions */}
                    <div className="backdrop-blur-xl rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Quick actions</h3>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">Pro</span>
                        </div>

                        {/* Action Items */}
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl transition-all group"
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                        🏆
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Join next contest</div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>One click. Stay in flow.</div>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 transition-colors" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl transition-all group"
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                        &lt;/&gt;
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Solve a random problem</div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>One click. Stay in flow.</div>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 transition-colors" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl transition-all group"
                                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                                        ⏱️
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Start a 25-min sprint</div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>One click. Stay in flow.</div>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 transition-colors" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Command Palette */}
                        <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Command palette</div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Jump to problems, contests, discussions—no mouse required.</div>
                                </div>
                                <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Ctrl K</kbd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
        </div>
    );
};

export default Discuss;
