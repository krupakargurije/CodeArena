import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { supabase } from '../services/supabaseClient';

const Navbar = () => {
    const { isAuthenticated, user, isAdmin } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
        <nav className="sticky top-0 z-50 bg-dark-bg-primary/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo & Nav Links */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="CodeArena" className="w-8 h-8" />
                            <span className="text-white font-semibold text-lg">CodeArena</span>
                        </Link>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="px-4 py-2 text-sm text-dark-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
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
                                <svg className="w-4 h-4 text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-12 py-2 bg-dark-bg-secondary/50 border border-white/10 rounded-lg text-sm text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <kbd className="px-2 py-0.5 text-xs text-dark-text-tertiary bg-dark-bg-tertiary border border-white/10 rounded font-mono">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right: Auth */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
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
                                <span className="hidden sm:block text-sm text-white font-medium">
                                    {user?.username || 'Profile'}
                                </span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-dark-text-secondary hover:text-white text-sm font-medium transition-colors"
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
