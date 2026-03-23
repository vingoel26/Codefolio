import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Wraps routes that require authentication.
 * Redirects to /login if not authenticated.
 * Shows a loading state while checking auth.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const location = useLocation();

    if (isLoading) return null;

    if (!isAuthenticated) {
        // Preserve the intended destination so we can redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Require profile completion for OAuth users (or ANY user missing username/password)
    // Only redirect if they are not already ON the complete-profile page!
    if (user && (!user.username || !user.hasPassword) && location.pathname !== '/complete-profile') {
        return <Navigate to="/complete-profile" replace />;
    }

    return children;
}
