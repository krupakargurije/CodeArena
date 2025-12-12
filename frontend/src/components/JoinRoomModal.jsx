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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 max-w-md w-full border border-primary-500/20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold gradient-text">Join Room</h2>
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
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Room Code
                        </label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={handleInputChange}
                            placeholder="ABC123"
                            className="input text-center text-2xl font-bold tracking-widest"
                            maxLength={6}
                            autoFocus
                        />
                        <p className="text-secondary text-sm mt-2">
                            Enter the 6-character room code
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-difficulty-hard/10 border border-difficulty-hard/50 text-difficulty-hard px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || roomId.length !== 6}
                        className="w-full btn-primary py-3 disabled:opacity-50"
                    >
                        {loading ? 'Joining...' : 'Join Room'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinRoomModal;
