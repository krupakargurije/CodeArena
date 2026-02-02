import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from './services/supabaseClient';
import { getCurrentUser } from './services/authService';
import { checkIsAdmin } from './services/userService';
import { loadUser, loginSuccess, logout, setAdminStatus } from './store/authSlice';
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

function App() {
    const dispatch = useDispatch();

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

                    // Dispatch login immediately with OAuth data
                    dispatch(loginSuccess({
                        token: session.access_token,
                        user: user,
                        isAdmin: false
                    }));

                    // Fetch user's profile from database to get custom avatar (non-blocking)
                    import('./services/userService').then(({ getUserProfile }) => {
                        getUserProfile(supabaseUser.id).then(result => {
                            if (result?.data) {
                                const profile = result.data;
                                // Update user with profile data (including custom avatar)
                                const updatedUser = {
                                    ...user,
                                    username: profile.username || user.username,
                                    rating: profile.rating || user.rating,
                                    problemsSolved: profile.problemsSolved || user.problemsSolved,
                                    avatarUrl: profile.avatarUrl || user.avatarUrl, // Prefer profile avatar over OAuth
                                    bio: profile.bio,
                                    country: profile.country,
                                    organization: profile.organization,
                                };
                                console.log('Updated user with profile data:', updatedUser);
                                dispatch(loginSuccess({
                                    token: session.access_token,
                                    user: updatedUser,
                                    isAdmin: false
                                }));
                                user = updatedUser; // Update for admin check
                            }
                        }).catch(err => {
                            console.warn('Profile fetch failed, using OAuth data:', err.message);
                        });
                    });

                    // Check admin status in background (non-blocking)
                    checkIsAdmin().then(isAdmin => {
                        console.log('Admin check result:', isAdmin);
                        if (isAdmin) {
                            dispatch(loginSuccess({
                                token: session.access_token,
                                user: user,
                                isAdmin: true
                            }));
                        }
                    }).catch(err => {
                        console.warn('Admin check failed:', err.message);
                    });

                } catch (error) {
                    console.error('Error syncing auth state:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                dispatch(logout());
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
        <Router>
            <div className="min-h-screen bg-[#121212] text-dark-text-primary relative selection:bg-brand-orange/30">
                {/* Global Background Effects */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none"></div>
                    <div className="absolute right-0 bottom-[-10%] h-[1000px] w-[1000px] rounded-full bg-brand-orange/5 blur-[100px] pointer-events-none"></div>
                </div>

                <div className="relative z-10">
                    <Navbar />
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
        </Router>
    );
}

export default App;
