import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const handleCreateClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowCreateModal(true);
    };

    const handleJoinClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowJoinModal(true);
    };

    const handleRoomCreated = (roomId) => {
        setShowCreateModal(false);
        navigate(`/rooms/${roomId}/lobby`);
    };

    const handleRoomJoined = (roomId) => {
        setShowJoinModal(false);
        navigate(`/rooms/${roomId}/lobby`);
    };

    return (
        <div className="min-h-screen dark:bg-dark-bg-primary bg-light-bg-primary">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 dark:text-dark-text-primary text-light-text-primary">
                        Code. Compete. <span className="text-brand-orange">Conquer.</span>
                    </h1>
                    <p className="text-xl md:text-2xl dark:text-dark-text-secondary text-light-text-secondary mb-12 max-w-3xl mx-auto">
                        Join thousands of developers sharpening their skills through competitive programming challenges
                    </p>

                    {/* Main Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link to="/problems" className="btn-primary text-lg px-8 py-4">
                            Start Coding
                        </Link>
                        <Link to="/leaderboard" className="btn-secondary text-lg px-8 py-4">
                            View Leaderboard
                        </Link>
                    </div>

                    {/* Multiplayer Section */}
                    <div className="panel p-8 max-w-4xl mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <span className="text-4xl mr-4">🎮</span>
                            <h2 className="text-3xl font-bold dark:text-dark-text-primary text-light-text-primary">Multiplayer Rooms</h2>
                        </div>
                        <p className="dark:text-dark-text-secondary text-light-text-secondary mb-8">
                            Challenge your friends in real-time coding battles. Create a private room or join an existing one!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button
                                onClick={handleCreateClick}
                                className="btn-primary px-8 py-4 text-lg flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Room
                            </button>
                            <button
                                onClick={handleJoinClick}
                                className="btn-secondary px-8 py-4 text-lg flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-24">
                    <div className="card text-center">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold text-brand-orange mb-2">
                            Compete & Win
                        </h3>
                        <p className="dark:text-dark-text-secondary text-light-text-secondary">
                            Solve problems, climb the leaderboard, and prove your skills
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-4">💻</div>
                        <h3 className="text-xl font-bold text-brand-orange mb-2">
                            Real-time Editor
                        </h3>
                        <p className="dark:text-dark-text-secondary text-light-text-secondary">
                            Code in your favorite language with our powerful Monaco editor
                        </p>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-brand-orange mb-2">
                            Track Progress
                        </h3>
                        <p className="dark:text-dark-text-secondary text-light-text-secondary">
                            Monitor your performance and see your growth over time
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-24 panel p-12">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-brand-orange mb-2">500+</div>
                            <div className="dark:text-dark-text-secondary text-light-text-secondary">Problems</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-brand-orange mb-2">10K+</div>
                            <div className="dark:text-dark-text-secondary text-light-text-secondary">Developers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-brand-orange mb-2">50K+</div>
                            <div className="dark:text-dark-text-secondary text-light-text-secondary">Submissions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    onRoomCreated={handleRoomCreated}
                />
            )}

            {showJoinModal && (
                <JoinRoomModal
                    onClose={() => setShowJoinModal(false)}
                    onRoomJoined={handleRoomJoined}
                />
            )}
        </div>
    );
};

export default Home;
