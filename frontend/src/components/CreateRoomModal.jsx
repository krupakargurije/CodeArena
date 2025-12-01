import { useState, useEffect } from 'react';
import { createRoom } from '../services/roomService';
import { supabase } from '../services/supabaseClient';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [problemSelectionMode, setProblemSelectionMode] = useState('random');
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(2);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        const { data } = await supabase
            .from('problems')
            .select('id, title, difficulty')
            .order('title');

        if (data) {
            setProblems(data);
            if (data.length > 0) {
                setSelectedProblemId(data[0].id);
            }
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
            <div className="glass rounded-2xl p-8 max-w-md w-full border border-primary-500/20">
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
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Number of Players
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setMaxParticipants(num)}
                                    className={`py-3 rounded-lg font-semibold transition-all ${maxParticipants === num
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/80'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Problem Selection Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Problem Selection
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 bg-dark-tertiary rounded-lg cursor-pointer hover:bg-dark-tertiary/80 transition-colors">
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="random"
                                    checked={problemSelectionMode === 'random'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <div>
                                    <div className="font-semibold text-gray-100">Random Problem</div>
                                    <div className="text-sm text-gray-400">System picks a random problem</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-dark-tertiary rounded-lg cursor-pointer hover:bg-dark-tertiary/80 transition-colors">
                                <input
                                    type="radio"
                                    name="problemMode"
                                    value="single"
                                    checked={problemSelectionMode === 'single'}
                                    onChange={(e) => setProblemSelectionMode(e.target.value)}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <div>
                                    <div className="font-semibold text-gray-100">Choose Problem</div>
                                    <div className="text-sm text-gray-400">Select a specific problem</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Problem Dropdown (if single mode) */}
                    {problemSelectionMode === 'single' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Select Problem
                            </label>
                            <select
                                value={selectedProblemId || ''}
                                onChange={(e) => setSelectedProblemId(parseInt(e.target.value))}
                                className="w-full bg-dark-tertiary text-gray-100 px-4 py-3 rounded-lg border border-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {problems.map((problem) => (
                                    <option key={problem.id} value={problem.id}>
                                        {problem.title} ({problem.difficulty})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
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
