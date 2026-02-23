import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isAdmin, isLoading } = useSelector((state) => state.auth);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg-primary flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
                <div className="text-brand-orange text-lg font-medium animate-pulse">Verifying Access...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/problems" replace />;
    }

    return children;
};

export default ProtectedRoute;
