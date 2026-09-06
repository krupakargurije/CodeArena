import { useEffect } from 'react';

const NoRoomFoundModal = ({ onClose, onCreateRoom, onRetry, isRetrying = false }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="rounded-2xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden shadow-2xl animate-slide-up"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-blue/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-xl transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="text-center relative pt-2">
                    {/* Glowing Icon */}
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400 shadow-lg shadow-amber-500/10">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        No Rooms Found
                    </h2>
                    
                    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                        Failed to find a room. Please try again or create one.
                    </p>

                    {/* Info Card */}
                    <div 
                        className="rounded-xl p-3.5 mb-6 text-xs text-left flex items-start gap-3"
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
                    >
                        <svg className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            There are no public rooms waiting for players right now. Start your own lobby and invite friends or wait for others to join!
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                onClose();
                                if (onCreateRoom) onCreateRoom();
                            }}
                            className="w-full btn-primary py-3 text-base font-semibold shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create a Room
                        </button>

                        <div className="flex gap-3">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    disabled={isRetrying}
                                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    style={{ 
                                        background: 'var(--bg-tertiary)', 
                                        border: '1px solid var(--border-subtle)', 
                                        color: 'var(--text-primary)' 
                                    }}
                                >
                                    <svg 
                                        className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {isRetrying ? 'Searching...' : 'Try Again'}
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                                style={{ 
                                    background: 'transparent', 
                                    border: '1px solid var(--border-subtle)', 
                                    color: 'var(--text-secondary)' 
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoRoomFoundModal;
