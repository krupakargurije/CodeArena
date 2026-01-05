import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../services/userService';

const Navbar = () => {
    const { isAuthenticated, user, isAdmin } = useSelector((state) => state.auth);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.id) {
                try {
                    const response = await getUserProfile(user.id);
                    setProfile(response.data);
                } catch (error) {
                    console.error('Failed to fetch profile for navbar:', error);
                }
            }
        };

        fetchProfile();
    }, [user]);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = profile?.name || profile?.username || user?.username || 'User';
    const avatarUrl = profile?.avatarUrl;

    return (
        <nav className="sticky top-0 z-50 dark:bg-dark-bg-primary bg-white border-b dark:border-dark-border-primary border-light-border-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="text-xl font-bold dark:text-dark-text-primary text-light-text-primary">
                            <span className="text-brand-orange">Code</span>Arena
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link to="/" className="nav-link">
                            Home
                        </Link>
                        <Link to="/problems" className="nav-link">
                            Problems
                        </Link>
                        <Link to="/rooms" className="nav-link">
                            My Rooms
                        </Link>
                        <Link to="/leaderboard" className="nav-link">
                            Leaderboard
                        </Link>

                        {/* Admin Link */}
                        {isAdmin && (
                            <Link to="/admin" className="nav-link text-brand-orange">
                                Admin
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <Link to="/profile" className="nav-link flex items-center gap-2">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center">
                                        <span className="text-xs font-bold text-white">
                                            {getInitials(displayName)}
                                        </span>
                                    </div>
                                )}
                                <span className="hidden lg:inline">{displayName}</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">
                                    Login
                                </Link>
                                <Link to="/signup" className="btn-primary text-sm ml-2">
                                    Sign Up
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
