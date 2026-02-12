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

            if (!token) {
                // Email confirmation is required
                setError('Account created! Please check your email to verify your account before logging in.');
                return;
            }

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
        <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-page)' }}>
            {/* Logo */}
            <div className="absolute top-6 left-6 z-20">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                    <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>CodeArena</span>
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

                        <div className="relative backdrop-blur-xl rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
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
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        placeholder="Username"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        placeholder="Email Address"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        placeholder="Password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
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
                                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
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
