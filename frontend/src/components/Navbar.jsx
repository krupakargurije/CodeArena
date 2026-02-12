import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { isAuthenticated, user, isAdmin } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
        navigate('/login');
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/problems', label: 'Problems' },
        { to: '/rooms', label: 'My Rooms' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/discuss', label: 'Discuss' },
    ];

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300" style={{ background: 'var(--bg-nav)', borderColor: 'var(--border-subtle)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo & Nav Links */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                            <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>CodeArena</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="px-4 py-2 text-sm transition-colors rounded-lg"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = 'var(--border-subtle)'; }}
                                    onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'transparent'; }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="px-4 py-2 text-sm text-brand-orange hover:text-orange-400 transition-colors rounded-lg hover:bg-orange-500/5"
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden lg:flex flex-1 justify-center max-w-md mx-8">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-12 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-all"
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <kbd className="px-2 py-0.5 text-xs rounded font-mono" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right: Theme Toggle & Auth */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
                            style={{ color: 'var(--text-secondary)', background: 'var(--border-subtle)' }}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {isAuthenticated ? (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                                    {user?.avatarUrl || user?.avatar_url ? (
                                        <img
                                            src={user.avatarUrl || user.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-blue to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                            {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="hidden sm:block text-sm font-medium">
                                    {user?.username || 'Profile'}
                                </span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-600 transition-all"
                                >
                                    Create account
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
