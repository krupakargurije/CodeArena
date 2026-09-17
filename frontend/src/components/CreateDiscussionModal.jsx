import { useState, useEffect, useRef } from 'react';
import { createDiscussion } from '../services/discussionService';

const AVAILABLE_TAGS = [
    { label: 'General', emoji: '💬' },
    { label: 'Algorithms', emoji: '⚡' },
    { label: 'Data Structures', emoji: '🏗️' },
    { label: 'Dynamic Programming', emoji: '📊' },
    { label: 'Graphs', emoji: '🕸️' },
    { label: 'Templates', emoji: '📋' },
    { label: 'Feedback', emoji: '💡' },
    { label: 'Contest', emoji: '🏆' },
];

const CreateDiscussionModal = ({ onClose, onDiscussionCreated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (modalRef.current) modalRef.current.style.transform = 'scale(1)';
            if (modalRef.current) modalRef.current.style.opacity = '1';
        });
    }, []);

    // Escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const toggleTag = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async () => {
        // Validation
        if (!title.trim() || title.trim().length < 5) {
            setError('Title must be at least 5 characters');
            return;
        }
        if (!content.trim() || content.trim().length < 10) {
            setError('Content must be at least 10 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await createDiscussion({
                title: title.trim(),
                content: content.trim(),
                tags: selectedTags,
            });
            onDiscussionCreated(response.data);
        } catch (err) {
            setError(err.message || 'Failed to create discussion');
        } finally {
            setLoading(false);
        }
    };

    const canProceedToStep2 = title.trim().length >= 5;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={modalRef}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-elevated)',
                    transform: 'scale(0.95)',
                    opacity: '0',
                    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
                }}
            >
                {/* Header */}
                <div className="relative px-7 pt-7 pb-5">
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                    />
                    <div className="flex items-center justify-between">
                        <div>
                            <h2
                                className="text-xl font-bold flex items-center gap-2.5"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    }}
                                >
                                    <svg
                                        className="w-4.5 h-4.5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                </div>
                                New Discussion
                            </h2>
                            <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                Start a thread with the community
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-5">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className="flex-1 h-1 rounded-full overflow-hidden"
                                style={{ background: 'var(--border-primary)' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: step >= s ? '100%' : '0%',
                                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="px-7 pb-5 space-y-5" style={{ minHeight: '280px' }}>
                    {step === 1 && (
                        <>
                            {/* Title Input */}
                            <div>
                                <label
                                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Best way to practice for 1800+?"
                                    maxLength={150}
                                    autoFocus
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: `1px solid ${title.trim().length >= 5 ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <div className="flex items-center justify-between mt-1.5">
                                    <span
                                        className="text-[11px]"
                                        style={{
                                            color: title.trim().length < 5 && title.length > 0 ? '#ef4444' : 'var(--text-tertiary)',
                                        }}
                                    >
                                        {title.trim().length < 5 && title.length > 0
                                            ? 'Min 5 characters required'
                                            : 'A clear, descriptive title'}
                                    </span>
                                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                        {title.length}/150
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label
                                    className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Tags <span style={{ opacity: 0.6 }}>(optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_TAGS.map((tag) => {
                                        const isSelected = selectedTags.includes(tag.label);
                                        return (
                                            <button
                                                key={tag.label}
                                                type="button"
                                                onClick={() => toggleTag(tag.label)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                                                style={{
                                                    background: isSelected
                                                        ? 'var(--bg-tertiary)'
                                                        : 'var(--bg-secondary)',
                                                    border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                                                    color: isSelected
                                                        ? 'var(--text-primary)'
                                                        : 'var(--text-secondary)',
                                                    boxShadow: isSelected
                                                        ? 'var(--shadow-card-hover)'
                                                        : 'none',
                                                }}
                                            >
                                                <span>{tag.emoji}</span>
                                                {tag.label}
                                                {isSelected && (
                                                    <svg
                                                        className="w-3 h-3 ml-0.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={3}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary Preview */}
                            {title.trim().length >= 5 && (
                                <div
                                    className="rounded-xl p-4"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                    }}
                                >
                                    <div
                                        className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        Preview
                                    </div>
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {title.trim()}
                                    </div>
                                    {selectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 rounded text-[10px] font-medium"
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Content Textarea */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label
                                        className="block text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        Content
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                                        style={{
                                            background: showPreview ? 'var(--bg-tertiary)' : 'transparent',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-primary)',
                                        }}
                                    >
                                        {showPreview ? '✏️ Edit' : '👁️ Preview'}
                                    </button>
                                </div>

                                {showPreview ? (
                                    <div
                                        className="w-full px-4 py-3 rounded-xl text-sm min-h-[160px]"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {content || (
                                            <span style={{ color: 'var(--text-tertiary)' }}>
                                                Nothing to preview yet...
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Share your thoughts, questions, or ideas...&#10;&#10;Tip: Be descriptive to get better responses."
                                        rows={7}
                                        autoFocus
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: `1px solid ${content.trim().length >= 10 ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                )}
                                <div className="flex items-center justify-between mt-1.5">
                                    <span
                                        className="text-[11px]"
                                        style={{
                                            color:
                                                content.trim().length < 10 && content.length > 0
                                                    ? '#ef4444'
                                                    : 'var(--text-tertiary)',
                                        }}
                                    >
                                        {content.trim().length < 10 && content.length > 0
                                            ? 'Min 10 characters required'
                                            : 'Describe your topic in detail'}
                                    </span>
                                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                        {content.length} chars
                                    </span>
                                </div>
                            </div>

                            {/* Discussion Summary Card */}
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-primary)',
                                }}
                            >
                                <div
                                    className="text-[10px] uppercase tracking-wider font-semibold mb-3"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    Discussion Summary
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            📝
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                            {title.trim().length >= 5 ? 'Ready' : 'No title'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {selectedTags.length}
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                            Tags
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {content.trim().split(/\s+/).filter(Boolean).length}
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                            Words
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="mx-7 mb-4 px-4 py-3 rounded-xl text-sm"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Footer buttons */}
                <div className="px-7 pb-7 flex items-center gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => { setStep(step - 1); setError(''); }}
                            className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
                            style={{
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                            }}
                        >
                            Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (!canProceedToStep2) {
                                    setError('Title must be at least 5 characters');
                                    return;
                                }
                                setError('');
                                setStep(2);
                            }}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                            style={{
                                background: canProceedToStep2 ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                                color: canProceedToStep2 ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                                boxShadow: canProceedToStep2 ? 'var(--shadow-card-hover)' : 'none',
                                cursor: canProceedToStep2 ? 'pointer' : 'not-allowed',
                            }}
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                            style={{
                                background: loading
                                    ? 'var(--bg-tertiary)'
                                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                color: loading ? 'var(--text-tertiary)' : '#ffffff',
                                boxShadow: loading ? 'none' : '0 4px 15px rgba(59,130,246,0.3)',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    💬 Post Discussion
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateDiscussionModal;
