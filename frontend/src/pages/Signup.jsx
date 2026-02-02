import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import * as authService from '../services/authService';
import { loginSuccess } from '../store/authSlice';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.signup({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            const { token, user } = response.data;

            dispatch(loginSuccess({
                token,
                user
            }));

            navigate('/problems');
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0f] relative overflow-hidden">
            {/* Logo */}
            <div className="absolute top-6 left-6 z-20">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                    <span className="text-white font-semibold text-lg">CodeArena</span>
                </Link>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Cyan/Teal glow - bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-cyan-500/30 via-cyan-500/10 to-transparent blur-[100px]" />
                {/* Side glows */}
                <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-500/20 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-cyan-500/20 blur-[120px]" />
                {/* Grid lines effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(to right, rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(to top, rgba(0,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        transform: 'perspective(500px) rotateX(60deg)',
                        transformOrigin: 'bottom'
                    }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
                <div className="w-full max-w-md">
                    {/* Glass Card */}
                    <div className="relative">
                        {/* Card glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50" />

                        <div className="relative bg-[#12121a]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    Sign Up
                                </h2>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Email Address"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Confirm Password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating Account...' : 'Sign Up'}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 text-center">
                                <p className="text-white/60 text-sm">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-brand-blue hover:text-blue-400 font-medium transition-colors">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
