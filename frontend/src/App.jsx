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
                    // Get mapped user data
                    const { data: user } = await getCurrentUser();

                    // Check if user is admin
                    const isAdmin = await checkIsAdmin();

                    if (user) {
                        dispatch(loginSuccess({
                            token: session.access_token,
                            user: user,
                            isAdmin: isAdmin
                        }));
                    }
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

    return (
        <Router>
            <div className="min-h-screen bg-dark-primary">
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
        </Router>
    );
}

export default App;
