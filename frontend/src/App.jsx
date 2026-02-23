import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from './services/supabaseClient';
import { getCurrentUser } from './services/authService';
import { checkIsAdmin } from './services/userService';
import { loadUser, loginSuccess, logout, setAdminStatus, setLoading } from './store/authSlice';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import RoomLobby from './pages/RoomLobby';
import RoomProblem from './pages/RoomProblem';
import AdminDashboard from './pages/AdminDashboard';
import Discuss from './pages/Discuss';

function AppContent() {
    const dispatch = useDispatch();
    const location = useLocation();

    // Hide navbar on coding environment pages (LeetCode-style)
    const isCodingEnv = /^\/problems\/\d+/.test(location.pathname) || /^\/rooms\/[^/]+\/problem/.test(location.pathname);

    useEffect(() => {
        // Initial load from local storage
        dispatch(loadUser());

        // Listen for Supabase auth changes (handles OAuth redirects)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_IN' && session) {
                try {
                    // Extract user data directly from session to avoid hanging Supabase calls
                    const supabaseUser = session.user;

                    // Create initial user object from OAuth metadata
                    let user = {
                        id: supabaseUser.id,
                        email: supabaseUser.email,
                        username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
                        rating: supabaseUser.user_metadata?.rating || 1200,
                        problemsSolved: supabaseUser.user_metadata?.problemsSolved || 0,
                        avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
                        roles: ['ROLE_USER'],
                    };

                    console.log('User from session:', user);

                    // 1. Fetch profile picture and admin status to prevent UI jumping
                    let isAdmin = false;
                    try {
                        const { getUserProfile } = await import('./services/userService');
                        const result = await getUserProfile(supabaseUser.id);
                        if (result?.data) {
                            const profile = result.data;
                            isAdmin = profile.is_admin === true || profile.isAdmin === true; // Handle mapped naming

                            user = {
                                ...user,
                                username: profile.username || user.username,
                                rating: profile.rating || user.rating,
                                problemsSolved: profile.problemsSolved || user.problemsSolved,
                                avatarUrl: profile.avatarUrl || user.avatarUrl,
                                bio: profile.bio,
                                country: profile.country,
                                organization: profile.organization,
                            };
                            console.log('Updated user with profile data:', user);
                        }
                    } catch (err) {
                        console.warn('Profile fetch failed, using OAuth data:', err.message);
                    }

                    // 3. Dispatch single atomic update
                    dispatch(loginSuccess({
                        token: session.access_token,
                        user: user,
                        isAdmin: isAdmin || false
                    }));

                    // Stop loading screen
                    dispatch(setLoading(false));

                } catch (error) {
                    console.error('Error syncing auth state:', error);
                    dispatch(setLoading(false));
                }
            } else if (event === 'SIGNED_OUT') {
                dispatch(logout());
                dispatch(setLoading(false));
            } else if (event === 'INITIAL_SESSION') {
                if (!session) {
                    dispatch(setLoading(false));
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [dispatch]);

    // Backend heartbeat to keep Render free tier awake
    useEffect(() => {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
        const HEARTBEAT_INTERVAL = 14 * 60 * 1000; // 14 minutes

        const pingBackend = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/health`);
                if (response.ok) {
                    console.log('Backend heartbeat: alive');
                }
            } catch (error) {
                // Silently fail - backend might be waking up
                console.log('Backend heartbeat: no response (may be waking up)');
            }
        };

        // Ping immediately on app load
        pingBackend();

        // Then ping every 14 minutes
        const intervalId = setInterval(pingBackend, HEARTBEAT_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="min-h-screen bg-[#121212] text-dark-text-primary relative selection:bg-brand-orange/30">
            {/* Global Background Effects */}
            {!isCodingEnv && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none"></div>
                    <div className="absolute right-0 bottom-[-10%] h-[1000px] w-[1000px] rounded-full bg-brand-orange/5 blur-[100px] pointer-events-none"></div>
                </div>
            )}

            <div className="relative z-10">
                {!isCodingEnv && <Navbar />}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/problems" element={<Problems />} />
                    <Route
                        path="/problems/:id"
                        element={
                            <ProtectedRoute>
                                <ProblemDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/discuss" element={<Discuss />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rooms"
                        element={
                            <ProtectedRoute>
                                <Rooms />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rooms/:roomId/lobby"
                        element={
                            <ProtectedRoute>
                                <RoomLobby />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/rooms/:roomId/problem"
                        element={
                            <ProtectedRoute>
                                <RoomProblem />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Route */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
