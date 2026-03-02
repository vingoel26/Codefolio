import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'codefolio-theme';

/**
 * Custom hook for managing light/dark theme.
 * - Persists preference in localStorage
 * - Falls back to OS preference (prefers-color-scheme)
 * - Applies .dark class on <html> element
 */
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        // 1. Check localStorage
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'dark' || stored === 'light') return stored;

        // 2. Check OS preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';

        // 3. Default to dark (dark-first design)
        return 'dark';
    });

    // Apply the theme class to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Listen for OS theme changes (only if user hasn't manually set a preference)
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            const stored = localStorage.getItem(THEME_KEY);
            if (!stored) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    const isDark = theme === 'dark';

    return { theme, setTheme, toggleTheme, isDark };
}
