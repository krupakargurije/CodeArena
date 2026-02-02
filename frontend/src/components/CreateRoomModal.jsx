import { useState, useEffect, useRef } from 'react';
import { createRoom } from '../services/roomService';
import { supabase } from '../services/supabaseClient';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [problemSelectionMode, setProblemSelectionMode] = useState('random');
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [isPrivate, setIsPrivate] = useState(false);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [problemSearch, setProblemSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchProblems();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const fetchProblems = async () => {
        try {
            console.log('Fetching problems for room creation...');

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Try direct REST API first (like other successful queries in the app)
            const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/problems?select=id,title,difficulty&order=title`, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            });

            if (fetchResponse.ok) {
                const data = await fetchResponse.json();
                console.log('Direct fetch SUCCESS - Fetched problems:', data);
                console.log('Number of problems:', data?.length || 0);

                if (data && data.length > 0) {
                    setProblems(data);
                    setSelectedProblemId(data[0].id);
                } else {
                    console.warn('No problems found in database');
                    setProblems([]);
                }
            } else {
                const errorText = await fetchResponse.text();
                console.error('Direct fetch FAILED:', fetchResponse.status, errorText);
                setError('Failed to load problems. Please try again.');
            }
        } catch (err) {
            console.error('Exception fetching problems:', err);
            setError('Failed to load problems. Please try again.');
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

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 max-w-md w-full border dark:border-dark-border-primary border-light-border-primary relative overflow-visible">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold gradient-text">Create Room</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Max Participants */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Number of Players
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setMaxParticipants(num)}
                                    className={`py-3 rounded-xl font-semibold transition-all ${maxParticipants === num
                                        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-orange-400/80 mt-2.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Rooms expire automatically after 1h 15m
                        </p>
                    </div>


                    {/* Room Privacy */}
                    <div>
                        <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${isPrivate
                            ? 'bg-brand-orange/10 border-brand-orange/30'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-500 bg-transparent checked:bg-brand-orange checked:border-brand-orange focus:ring-brand-orange focus:ring-offset-0"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-white flex items-center gap-2">
                                    Private Room
                                    {isPrivate && (
                                        <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="text-sm text-gray-400">
                                    Room won't be listed in public lobby or random matching
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Problem Selection Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-3">
                            Problem Selection
                        </label>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${problemSelectionMode === 'random'
                                ? 'bg-brand-blue/10 border-brand-blue/30'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="random"
                                    checked={problemSelectionMode === 'random'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 text-brand-blue bg-transparent border-gray-500 focus:ring-brand-blue focus:ring-offset-0"
                                />
                                <div>
                                    <div className="font-semibold text-white">Random Problem</div>
                                    <div className="text-sm text-gray-400">System picks a random problem</div>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${problemSelectionMode === 'single'
                                ? 'bg-brand-blue/10 border-brand-blue/30'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="single"
                                    checked={problemSelectionMode === 'single'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 text-brand-blue bg-transparent border-gray-500 focus:ring-brand-blue focus:ring-offset-0"
                                />
                                <div>
                                    <div className="font-semibold text-white">Choose Problem</div>
                                    <div className="text-sm text-gray-400">Select a specific problem</div>
                                </div>
                            </label>
                        </div>
                    </div>


                    {/* Problem Dropdown (if single mode) */}
                    {problemSelectionMode === 'single' && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Select Problem {problems.length > 0 && `(${problems.length} available)`}
                            </label>

                            {/* Custom Dropdown Button */}
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="input w-full text-left flex items-center justify-between text-white"
                            >
                                <span>
                                    {selectedProblemId
                                        ? problems.find(p => p.id === selectedProblemId)?.title || 'Select a problem'
                                        : 'Select a problem'}
                                </span>
                                <svg
                                    className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu - Opens upward to prevent bottom overflow */}
                            {dropdownOpen && (
                                <div className="absolute z-[100] w-full bottom-full mb-1 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl shadow-black/50 max-h-72 overflow-hidden flex flex-col">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-white/5">
                                        <input
                                            type="text"
                                            placeholder="Search problems..."
                                            value={problemSearch}
                                            onChange={(e) => setProblemSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="input w-full py-2 text-sm bg-black/20 border-transparent focus:border-brand-blue/50"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Problem List */}
                                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                                        {problems
                                            .filter(p => p.title.toLowerCase().includes(problemSearch.toLowerCase()))
                                            .map((problem) => (
                                                <button
                                                    key={problem.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProblemId(problem.id);
                                                        setDropdownOpen(false);
                                                        setProblemSearch('');
                                                    }}
                                                    className={`w-full text-left px-4 py-3 transition-colors border-b border-white/5 last:border-0 ${selectedProblemId === problem.id
                                                        ? 'bg-brand-blue/10 text-brand-blue'
                                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    <div className="font-medium">{problem.title}</div>
                                                    <div className={`text-xs mt-0.5 ${problem.difficulty === 'EASY' ? 'text-green-400' :
                                                        problem.difficulty === 'MEDIUM' ? 'text-yellow-400' :
                                                            'text-red-400'
                                                        }`}>
                                                        {problem.difficulty}
                                                    </div>
                                                </button>
                                            ))}
                                        {problems.filter(p => p.title.toLowerCase().includes(problemSearch.toLowerCase())).length === 0 && (
                                            <div className="px-4 py-3 text-secondary text-sm text-center">
                                                No problems found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3.5 disabled:opacity-50 text-base shadow-lg shadow-brand-orange/20"
                    >
                        {loading ? 'Creating Room...' : 'Create Room'}
                    </button>
                </form>
            </div >
        </div >
    );
};

export default CreateRoomModal;
