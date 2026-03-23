import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Auth store — manages user session state + JWT tokens.
 *
 * Token storage strategy:
 * - Access token: in-memory (Zustand state) — short-lived (15 min)
 * - Refresh token: LocalStorage (Bypass Brave Shields/ITP) — long-lived (7 days)
 *
 * For now (before backend), we use mock auth to build the UI flow.
 */
let initPromise = null;

export const useAuthStore = create((set, get) => ({
    // State
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true, // true on initial load to check for existing session
    error: null,

    /**
     * Initialize auth state — called on app mount.
     * Tries to refresh the session using the LocalStorage refresh token.
     */
    initialize: async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                const token = localStorage.getItem('refreshToken');
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false });
                    return false;
                }

                const res = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: token })
                });

                if (res.ok) {
                    const data = await res.json();
                    set({
                        user: data.user,
                        accessToken: data.accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                    return true;
                } else {
                    localStorage.removeItem('refreshToken');
                    set({ isLoading: false, isAuthenticated: false });
                    return false;
                }
            } catch {
                // Backend not available yet — just mark as not loading
                set({ isLoading: false, isAuthenticated: false });
                return false;
            } finally {
                initPromise = null;
            }
        })();

        return initPromise;
    },

    /**
     * Start OAuth flow — redirect to backend OAuth endpoint.
     * @param {'google' | 'github'} provider
     */
    loginWithProvider: (provider) => {
        window.location.href = `${API_URL}/auth/${provider}`;
    },

    /**
     * Handle OAuth callback — exchange code for tokens.
     * Called when redirected back from OAuth provider.
     */
    handleOAuthCallback: async (code, provider) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/auth/${provider}/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
                credentials: 'include',
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Authentication failed');
            }

            const data = await res.json();
            set({
                user: data.user,
                accessToken: data.accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            return true;
        } catch (err) {
            set({
                isLoading: false,
                error: err.message,
                isAuthenticated: false,
            });
            return false;
        }
    },

    /**
     * Logout — clear tokens and redirect.
     */
    logout: async () => {
        try {
            const token = localStorage.getItem('refreshToken');
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: token }),
            });
        } catch {
            // Best effort
        }

        // Clean local state
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('cfHandle');
        localStorage.removeItem('lcUsername');
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            error: null,
        });

        // Force a full redirect to clear any lingering memory state
        window.location.href = '/login';
    },

    /**
     * Update the user profile (display name, avatar, bio).
     */
    updateProfile: async (updates) => {
        const { accessToken } = get();
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(updates),
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const data = await res.json();
            set({ user: data.user });
            return true;
        } catch (err) {
            set({ error: err.message });
            return false;
        }
    },

    /**
     * Get an authenticated fetch wrapper.
     * Automatically adds Authorization header.
     */
    authFetch: async (url, options = {}) => {
        const { accessToken } = get();
        const res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // If 401, try refresh
        if (res.status === 401) {
            const refreshed = await get().initialize();
            if (refreshed) {
                const newToken = get().accessToken;
                return fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                });
            }
        }

        return res;
    },

    // ------ Mock auth for development (before backend) ------
    /**
     * Mock login for development/demo purposes.
     */
    mockLogin: () => {
        set({
            user: {
                id: 'mock-user-1',
                email: 'developer@codefolio.dev',
                username: 'codefolio_dev',
                displayName: 'Dev User',
                avatarUrl: null,
                bio: 'Competitive programming enthusiast',
                createdAt: new Date().toISOString(),
            },
            accessToken: 'mock-access-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
        });
    },

    /**
     * Register a new account with email and password.
     */
    register: async ({ email, password, displayName, username }) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName, username }),
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            localStorage.setItem('refreshToken', data.refreshToken);

            set({
                user: data.user,
                accessToken: data.accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            return true;
        } catch (err) {
            set({ isLoading: false, error: err.message, isAuthenticated: false });
            return false;
        }
    },

    /**
     * Login with email and password.
     */
    loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('refreshToken', data.refreshToken);

            set({
                user: data.user,
                accessToken: data.accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            return true;
        } catch (err) {
            set({ isLoading: false, error: err.message, isAuthenticated: false });
            return false;
        }
    },

    clearError: () => set({ error: null }),

    /**
     * Set access token directly (used by AuthCallback after backend redirect).
     */
    setAccessToken: (token) => set({ accessToken: token }),

    /**
     * Fetch current user profile using the access token.
     * Used after OAuth callback to load user data.
     */
    fetchMe: async () => {
        const { accessToken } = get();
        if (!accessToken) return false;

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });

            if (!res.ok) return false;

            const data = await res.json();
            set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
            return true;
        } catch {
            return false;
        }
    },
}));
