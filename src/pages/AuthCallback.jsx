import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * OAuth callback handler page.
 * The OAuth provider redirects here with a `code` query parameter.
 * We exchange the code for tokens via the backend.
 */
export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { handleOAuthCallback, error } = useAuthStore();

    useEffect(() => {
        const code = searchParams.get('code');
        // Extract provider from the path: /auth/callback/google or /auth/callback/github
        const pathParts = location.pathname.split('/');
        const provider = pathParts[pathParts.length - 1]; // 'google' or 'github'

        if (code && provider) {
            handleOAuthCallback(code, provider).then((success) => {
                if (success) {
                    navigate('/', { replace: true });
                } else {
                    navigate('/login', { replace: true });
                }
            });
        } else {
            navigate('/login', { replace: true });
        }
    }, [searchParams, location, handleOAuthCallback, navigate]);

    return (
        <div className="auth-callback">
            {error ? (
                <div className="auth-callback-error">
                    <p>Authentication failed</p>
                    <p className="auth-callback-error-msg">{error}</p>
                    <button onClick={() => navigate('/login', { replace: true })}>
                        Back to Login
                    </button>
                </div>
            ) : (
                <div className="auth-callback-loading">
                    <div className="auth-callback-spinner" />
                    <p>Authenticating...</p>
                </div>
            )}

            <style>{`
                .auth-callback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .auth-callback-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    font-size: 0.9375rem;
                    color: var(--text-secondary);
                }

                .auth-callback-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border);
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .auth-callback-error {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .auth-callback-error p:first-child {
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .auth-callback-error-msg {
                    color: var(--error);
                    font-size: 0.875rem;
                }

                .auth-callback-error button {
                    margin-top: 8px;
                    padding: 10px 24px;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    cursor: pointer;
                    font-family: var(--font-sans);
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
