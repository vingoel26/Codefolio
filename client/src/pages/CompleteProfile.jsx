import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ui/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function CompleteProfile() {
    const { user, accessToken, fetchMe, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // If they already have both, send them away
    useEffect(() => {
        if (!isLoading && user && user.username && user.hasPassword) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    if (isLoading || !user) return null; // Let ProtectedRoute handle the global loading/redirects

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!user.username && (!username || username.trim().length < 3)) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (!user.hasPassword) {
            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Update username if needed
            if (!user.username) {
                const res = await fetch(`${API_URL}/auth/me`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ username: username.trim() }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to update username');
                }
            }

            // Update password if needed
            if (!user.hasPassword) {
                const res = await fetch(`${API_URL}/auth/me/password`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ newPassword: password }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to set password');
                }
            }

            // Sync Zustand
            await fetchMe();
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-blob login-bg-blob-1" />
            <div className="login-bg-blob login-bg-blob-2" />
            
            <div className="login-theme-toggle">
                <ThemeToggle />
            </div>

            <div className="login-card glass-card animate-fade-in">
                <h1 className="login-title">Almost there!</h1>
                <p className="login-subtitle">
                    Please complete your profile to continue to Codefolio.
                </p>

                {error && (
                    <div className="login-error" onClick={() => setError(null)}>
                        <span>⚠️ {error}</span>
                        <span className="login-error-dismiss">✕</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    {!user.username && (
                        <div className="login-field">
                            <label htmlFor="username">Choose a Username <span style={{ color: 'var(--error)' }}>*</span></label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                placeholder="unique_username"
                                required
                                minLength={3}
                            />
                        </div>
                    )}

                    {!user.hasPassword && (
                        <>
                            <div className="login-field">
                                <label htmlFor="password">Set a Password <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="login-field">
                                <label htmlFor="confirmPassword">Confirm Password <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </>
                    )}

                    <button className="login-btn login-btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
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
                    padding: 44px 40px;
                    text-align: center;
                    position: relative;
                    z-index: 1;
                }

                .login-logo {
                    margin-bottom: 24px;
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
                    margin-bottom: 24px;
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

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    margin-bottom: 20px;
                    text-align: left;
                }

                .login-field label {
                    display: block;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                }

                .login-field input {
                    width: 100%;
                    padding: 11px 14px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    font-size: 0.9375rem;
                    font-family: var(--font-sans);
                    outline: none;
                    transition: border-color var(--transition-fast);
                    box-sizing: border-box;
                }

                .login-field input:focus {
                    border-color: var(--accent);
                }

                .login-field input::placeholder {
                    color: var(--text-muted);
                }

                .login-buttons {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .login-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    padding: 12px 20px;
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

                .login-btn-primary {
                    background: var(--accent);
                    color: #ffffff;
                    border: none;
                    padding: 13px 20px;
                }

                .login-btn-primary:hover:not(:disabled) {
                    background: var(--accent-hover);
                }

                .login-btn-google {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    flex: 1;
                }

                .login-btn-google:hover:not(:disabled) {
                    border-color: var(--border-strong);
                }

                .login-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
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

                .login-signup-link {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 20px;
                }

                .login-signup-link a {
                    color: var(--accent);
                    font-weight: 600;
                    text-decoration: none;
                }

                .login-signup-link a:hover {
                    text-decoration: underline;
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
