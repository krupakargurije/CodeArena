import { useState } from 'react';
import { joinRoom } from '../services/roomService';

const JoinRoomModal = ({ onClose, onRoomJoined }) => {
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!roomId || roomId.length !== 6) {
            setError('Please enter a valid 6-character room code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await joinRoom(roomId.toUpperCase());
            onRoomJoined(roomId.toUpperCase());
        } catch (err) {
            setError(err.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        setRoomId(value);
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-panel rounded-2xl p-8 max-w-md w-full border border-white/10 relative overflow-hidden shadow-2xl shadow-black/50">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

                <div className="relative flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Join Room</h2>
                        <p className="text-dark-text-secondary text-sm">Enter the code to join your friends</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-dark-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                            Room Code
                        </label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={handleInputChange}
                            placeholder="ABC123"
                            className="input text-center text-3xl font-bold tracking-[0.5em] uppercase h-16 bg-dark-bg-tertiary/50 focus:bg-dark-bg-tertiary focus:border-brand-blue/50 placeholder:tracking-normal placeholder:font-normal placeholder:text-dark-text-tertiary transition-all"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-slide-up">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || roomId.length !== 6}
                        className="w-full btn-primary py-3.5 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/20"
                    >
                        {loading ? 'Joining Room...' : 'Join Room'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinRoomModal;
