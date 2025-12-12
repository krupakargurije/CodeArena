import { useState, useEffect, useRef } from 'react';
import { createRoom } from '../services/roomService';
import { supabase } from '../services/supabaseClient';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [problemSelectionMode, setProblemSelectionMode] = useState('random');
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
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
                problemId: problemSelectionMode === 'single' ? selectedProblemId : null
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
                        <label className="block text-sm font-medium text-secondary mb-3">
                            Number of Players
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setMaxParticipants(num)}
                                    className={`py-3 rounded-lg font-semibold transition-all ${maxParticipants === num
                                        ? 'dark:bg-dark-bg-elevated bg-light-bg-elevated dark:text-dark-text-primary text-light-text-primary ring-2 dark:ring-dark-border-secondary ring-light-border-secondary'
                                        : 'dark:bg-dark-bg-tertiary bg-light-bg-tertiary dark:text-dark-text-secondary text-light-text-secondary dark:hover:bg-dark-bg-tertiary/80 hover:bg-light-bg-tertiary/80'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Problem Selection Mode */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-3">
                            Problem Selection
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 dark:bg-dark-bg-tertiary bg-light-bg-tertiary rounded-lg cursor-pointer dark:hover:bg-dark-bg-tertiary/80 hover:bg-light-bg-tertiary/80 transition-colors">
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="random"
                                    checked={problemSelectionMode === 'random'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 dark:accent-dark-text-primary accent-light-text-primary"
                                />
                                <div>
                                    <div className="font-semibold text-primary">Random Problem</div>
                                    <div className="text-sm text-secondary">System picks a random problem</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 dark:bg-dark-bg-tertiary bg-light-bg-tertiary rounded-lg cursor-pointer dark:hover:bg-dark-bg-tertiary/80 hover:bg-light-bg-tertiary/80 transition-colors">
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="single"
                                    checked={problemSelectionMode === 'single'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 dark:accent-dark-text-primary accent-light-text-primary"
                                />
                                <div>
                                    <div className="font-semibold text-primary">Choose Problem</div>
                                    <div className="text-sm text-secondary">Select a specific problem</div>
                                </div>
                            </label>
                        </div>
                    </div>


                    {/* Problem Dropdown (if single mode) */}
                    {problemSelectionMode === 'single' && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Select Problem {problems.length > 0 && `(${problems.length} available)`}
                            </label>

                            {/* Custom Dropdown Button */}
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="input w-full text-left flex items-center justify-between"
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

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute z-[100] w-full mt-1 dark:bg-dark-bg-secondary bg-white border dark:border-dark-border-primary border-light-border-primary rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {problems.map((problem) => (
                                        <button
                                            key={problem.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProblemId(problem.id);
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 transition-colors ${selectedProblemId === problem.id
                                                ? 'dark:bg-dark-bg-elevated bg-light-bg-elevated'
                                                : 'dark:hover:bg-dark-bg-tertiary hover:bg-light-bg-tertiary'
                                                }`}
                                        >
                                            <div className="font-medium text-primary">{problem.title}</div>
                                            <div className={`text-sm ${problem.difficulty === 'EASY' ? 'text-difficulty-easy' :
                                                problem.difficulty === 'MEDIUM' ? 'text-difficulty-medium' :
                                                    'text-difficulty-hard'
                                                }`}>
                                                {problem.difficulty}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-difficulty-hard/10 border border-difficulty-hard/50 text-difficulty-hard px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
