import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function Login() {
    const { loginWithProvider, mockLogin, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

    const from = location.state?.from?.pathname || '/';

    const handleMockLogin = () => {
        mockLogin();
        navigate(from, { replace: true });
    };

    return (
        <div className="login-page">
            {/* Background gradient blobs */}
            <div className="login-bg-blob login-bg-blob-1" />
            <div className="login-bg-blob login-bg-blob-2" />
            <div className="login-bg-blob login-bg-blob-3" />

            {/* Theme toggle in corner */}
            <div className="login-theme-toggle">
                <ThemeToggle />
            </div>

            {/* Login Card */}
            <div className="login-card glass-card animate-fade-in">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">CF</div>
                </div>

                <h1 className="login-title">
                    Welcome to <span className="gradient-text">Codefolio</span>
                </h1>
                <p className="login-subtitle">
                    The ultimate competitive programming community platform.
                    Track stats, compete, and grow.
                </p>

                {/* Error */}
                {error && (
                    <div className="login-error" onClick={clearError}>
                        <span>⚠️ {error}</span>
                        <span className="login-error-dismiss">✕</span>
                    </div>
                )}

                {/* OAuth Buttons */}
                <div className="login-buttons">
                    <button
                        className="login-btn login-btn-google"
                        onClick={() => loginWithProvider('google')}
                        disabled={isLoading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        className="login-btn login-btn-github"
                        onClick={() => loginWithProvider('github')}
                        disabled={isLoading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Continue with GitHub
                    </button>
                </div>

                {/* Divider */}
                <div className="login-divider">
                    <span>or for development</span>
                </div>

                {/* Mock Login */}
                <button
                    className="login-btn login-btn-mock"
                    onClick={handleMockLogin}
                    disabled={isLoading}
                >
                    🚀 Quick Demo Login
                </button>

                {/* Footer */}
                <p className="login-footer">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

            <style>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-primary);
                    position: relative;
                    overflow: hidden;
                    padding: 24px;
                }

                .login-bg-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    opacity: 0.4;
                    pointer-events: none;
                }

                .login-bg-blob-1 {
                    width: 500px;
                    height: 500px;
                    background: var(--accent);
                    top: -150px;
                    right: -100px;
                    opacity: 0.15;
                }

                .login-bg-blob-2 {
                    width: 400px;
                    height: 400px;
                    background: var(--info);
                    bottom: -100px;
                    left: -100px;
                    opacity: 0.12;
                }

                .login-bg-blob-3 {
                    width: 300px;
                    height: 300px;
                    background: var(--success);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.06;
                }

                .login-theme-toggle {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10;
                }

                .login-card {
                    width: 100%;
                    max-width: 440px;
                    padding: 48px 40px;
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }

                .login-logo {
                    margin-bottom: 28px;
                }

                .login-logo-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius-lg);
                    background: linear-gradient(135deg, var(--accent), var(--info));
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.25rem;
                    color: #ffffff;
                    box-shadow: 0 8px 32px rgba(108, 92, 231, 0.3);
                }

                .login-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    margin-bottom: 8px;
                }

                .login-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9375rem;
                    line-height: 1.6;
                    margin-bottom: 32px;
                    max-width: 340px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .login-error {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: var(--error-bg);
                    color: var(--error);
                    border-radius: var(--radius-md);
                    font-size: 0.8125rem;
                    font-weight: 500;
                    margin-bottom: 20px;
                    cursor: pointer;
                }

                .login-error-dismiss {
                    opacity: 0.6;
                    font-size: 0.75rem;
                }

                .login-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .login-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 14px 20px;
                    border-radius: var(--radius-md);
                    font-size: 0.9375rem;
                    font-weight: 600;
                    font-family: var(--font-sans);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    border: 1px solid var(--border);
                }

                .login-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-md);
                }

                .login-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .login-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .login-btn-google {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .login-btn-google:hover:not(:disabled) {
                    border-color: var(--border-strong);
                }

                .login-btn-github {
                    background: ${isDark ? '#ffffff' : '#24292e'};
                    color: ${isDark ? '#24292e' : '#ffffff'};
                    border: none;
                }

                .login-btn-github:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .login-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }

                .login-divider::before,
                .login-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--border);
                }

                .login-btn-mock {
                    background: var(--accent-subtle);
                    color: var(--accent);
                    border: 1px dashed var(--accent);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    width: 100%;
                    margin-bottom: 24px;
                }

                .login-btn-mock:hover:not(:disabled) {
                    background: var(--accent);
                    color: #ffffff;
                    border-style: solid;
                }

                .login-footer {
                    font-size: 0.6875rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
