import { useState, useEffect, useRef } from 'react';
import { createRoom } from '../services/roomService';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [problemSelectionMode, setProblemSelectionMode] = useState('random');
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(2);
    const playerOptions = [2, 3, 4, 99]; // 99 = infinite
    const [isPrivate, setIsPrivate] = useState(false);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [problemSearch, setProblemSearch] = useState('');
    const [step, setStep] = useState(1); // multi-step wizard
    const dropdownRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        fetchProblems();
        // Animate in
        requestAnimationFrame(() => {
            if (modalRef.current) modalRef.current.style.transform = 'scale(1)';
            if (modalRef.current) modalRef.current.style.opacity = '1';
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const fetchProblems = async () => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/problems?select=id,title,difficulty&order=title`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            });
            if (fetchResponse.ok) {
                const data = await fetchResponse.json();
                if (data && data.length > 0) {
                    setProblems(data);
                    setSelectedProblemId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Exception fetching problems:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const roomData = {
                problemSelectionMode,
                maxParticipants,
                problemId: problemSelectionMode === 'single' ? selectedProblemId : null,
                isPrivate
            };
            const response = await createRoom(roomData);
            onRoomCreated(response.data.id);
        } catch (err) {
            setError(err.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const diffColor = (d) => d === 'EASY' ? '#00b8a3' : d === 'MEDIUM' ? '#ffc01e' : d === 'HARD' ? '#ff375f' : d === 'CAKEWALK' ? '#00e5ff' : '#a0a0a0';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
                    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease'
                }}
            >
                {/* Header */}
                <div className="relative px-7 pt-7 pb-5">
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: 'var(--text-primary)' }} />
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--text-primary)' }}>
                                    <svg className="w-4.5 h-4.5" style={{ color: 'var(--bg-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                Create Room
                            </h2>
                            <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                Set up a competitive coding session
                            </p>
                        </div>
                        <button type="button" onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: 'var(--text-tertiary)' }}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-5">
                        {[1, 2].map(s => (
                            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-primary)' }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: step >= s ? '100%' : '0%',
                                        background: 'var(--text-primary)'
                                    }} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-7 pb-5 space-y-5" style={{ minHeight: '280px' }}>
                    {step === 1 && (
                        <>
                            {/* Players */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                    style={{ color: 'var(--text-tertiary)' }}>
                                    Players
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {playerOptions.map((num) => (
                                        <button key={num} type="button"
                                            onClick={() => setMaxParticipants(num)}
                                            className="relative py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                                            style={{
                                                background: maxParticipants === num
                                                    ? 'var(--text-primary)'
                                                    : 'var(--bg-secondary)',
                                                color: maxParticipants === num ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                                border: `1px solid ${maxParticipants === num ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                                                boxShadow: maxParticipants === num ? 'var(--shadow-card-hover)' : 'none'
                                            }}
                                        >
                                            <span className="flex items-center justify-center gap-1.5">
                                                {num === 99 ? '♾️' : '👤'.repeat(Math.min(num, 2))}{num > 2 && num !== 99 && <span className="text-[10px] opacity-70">+{num - 2}</span>}
                                            </span>
                                            <span className="text-[11px] mt-0.5 block opacity-70">{num === 99 ? '∞' : num} {num === 99 ? 'Multiple' : 'Players'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Room Privacy - toggle switch style */}
                            <div className="flex items-center justify-between p-4 rounded-xl"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                        style={{ background: isPrivate ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }}>
                                        {isPrivate ? (
                                            <svg className="w-4.5 h-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4.5 h-4.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{isPrivate ? 'Private' : 'Public'} Room</div>
                                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                            {isPrivate ? 'Invite-only, hidden from lobby' : 'Visible in lobby & random matching'}
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsPrivate(!isPrivate)}
                                    className="relative w-11 h-6 rounded-full transition-all duration-300"
                                    style={{ background: isPrivate ? '#ef4444' : '#22c55e' }}>
                                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300"
                                        style={{ left: isPrivate ? '22px' : '2px' }} />
                                </button>
                            </div>

                            {/* Info badge */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Rooms expire automatically after 1h 45m</span>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Problem Selection Mode */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider mb-3"
                                    style={{ color: 'var(--text-tertiary)' }}>
                                    Problem Selection
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setProblemSelectionMode('random')}
                                        className="relative p-4 rounded-xl text-left transition-all duration-200 group"
                                        style={{
                                            background: problemSelectionMode === 'random'
                                                ? 'var(--bg-tertiary)'
                                                : 'var(--bg-secondary)',
                                            border: `1px solid ${problemSelectionMode === 'random' ? 'var(--text-primary)' : 'var(--border-primary)'}`
                                        }}
                                    >
                                        <div className="text-2xl mb-2">🎲</div>
                                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Random</div>
                                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                            System picks for you
                                        </div>
                                        {problemSelectionMode === 'random' && (
                                            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: 'var(--text-primary)' }}>
                                                <svg className="w-3 h-3" style={{ color: 'var(--bg-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => setProblemSelectionMode('single')}
                                        className="relative p-4 rounded-xl text-left transition-all duration-200 group"
                                        style={{
                                            background: problemSelectionMode === 'single'
                                                ? 'var(--bg-tertiary)'
                                                : 'var(--bg-secondary)',
                                            border: `1px solid ${problemSelectionMode === 'single' ? 'var(--text-primary)' : 'var(--border-primary)'}`
                                        }}
                                    >
                                        <div className="text-2xl mb-2">📋</div>
                                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Choose</div>
                                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                            Pick a specific problem
                                        </div>
                                        {problemSelectionMode === 'single' && (
                                            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: 'var(--text-primary)' }}>
                                                <svg className="w-3 h-3" style={{ color: 'var(--bg-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Problem Dropdown */}
                            {problemSelectionMode === 'single' && (
                                <div className="relative" ref={dropdownRef}>
                                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        Select Problem <span style={{ opacity: 0.6 }}>({problems.length} available)</span>
                                    </label>
                                    <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: `1px solid ${dropdownOpen ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                                            color: 'var(--text-primary)'
                                        }}>
                                        <span className="text-sm">
                                            {selectedProblemId
                                                ? (() => { const p = problems.find(p => p.id === selectedProblemId); return p ? `${p.id}. ${p.title}` : 'Select...'; })()
                                                : 'Select a problem'}
                                        </span>
                                        <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                            style={{ color: 'var(--text-tertiary)' }}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute z-[100] w-full bottom-full mb-1 rounded-xl overflow-hidden flex flex-col max-h-60"
                                            style={{
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-primary)',
                                                boxShadow: 'var(--shadow-elevated)'
                                            }}>
                                            <div className="p-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <input type="text" placeholder="Search problems..."
                                                    value={problemSearch} onChange={(e) => setProblemSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()} autoFocus
                                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {problems.filter(p => p.title.toLowerCase().includes(problemSearch.toLowerCase())).map((problem) => (
                                                    <button key={problem.id} type="button"
                                                        onClick={() => { setSelectedProblemId(problem.id); setDropdownOpen(false); setProblemSearch(''); }}
                                                        className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                                        style={{
                                                            borderBottom: '1px solid var(--border-subtle)',
                                                            background: selectedProblemId === problem.id ? 'var(--bg-tertiary)' : 'transparent',
                                                            color: 'var(--text-primary)'
                                                        }}>
                                                        <span className="text-sm">{problem.id}. {problem.title}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: diffColor(problem.difficulty) }}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary card */}
                            <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>Room Summary</div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{maxParticipants === 99 ? '∞' : maxParticipants}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Players</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{isPrivate ? '🔒' : '🌐'}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                            {isPrivate ? 'Private' : 'Public'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>1:45</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Duration</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-7 mb-4 px-4 py-3 rounded-xl text-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                        {error}
                    </div>
                )}

                {/* Footer buttons */}
                <div className="px-7 pb-7 flex items-center gap-3">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(step - 1)}
                            className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
                            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                            Back
                        </button>
                    )}
                    {step < 2 ? (
                        <button type="button" onClick={() => setStep(2)}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                            style={{
                                background: 'var(--text-primary)',
                                color: 'var(--bg-primary)',
                                boxShadow: 'var(--shadow-card-hover)'
                            }}>
                            Next Step →
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={loading}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                            style={{
                                background: loading ? 'var(--bg-tertiary)' : 'var(--text-primary)',
                                color: loading ? 'var(--text-tertiary)' : 'var(--bg-primary)',
                                boxShadow: loading ? 'none' : 'var(--shadow-card-hover)'
                            }}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    🚀 Create Room
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;
