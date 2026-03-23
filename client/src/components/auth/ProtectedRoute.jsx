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

    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading-spinner" />
                <p>Checking authentication...</p>

                <style>{`
                    .auth-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        gap: 16px;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                    }

                    .auth-loading-spinner {
                        width: 32px;
                        height: 32px;
                        border: 3px solid var(--border);
                        border-top-color: var(--accent);
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

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
