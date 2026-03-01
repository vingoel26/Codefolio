import { useTheme } from '../../hooks/useTheme';

/**
 * Animated theme toggle button with Sun/Moon icons.
 * Smooth rotation + scale transition on toggle.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`toggle-icon-wrapper ${isDark ? 'is-dark' : 'is-light'}`}>
        {/* Sun Icon */}
        <svg
          className="toggle-icon sun-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>

        {/* Moon Icon */}
        <svg
          className="toggle-icon moon-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>

      <style>{`
        .theme-toggle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
          overflow: hidden;
        }

        .theme-toggle:hover {
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: var(--shadow-glow);
          transform: scale(1.05);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .toggle-icon-wrapper {
          position: relative;
          width: 22px;
          height: 22px;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-icon-wrapper.is-dark {
          transform: rotate(0deg);
        }

        .toggle-icon-wrapper.is-light {
          transform: rotate(180deg);
        }

        .toggle-icon {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .is-dark .sun-icon {
          opacity: 0;
          transform: scale(0.5) rotate(90deg);
        }

        .is-dark .moon-icon {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .is-light .sun-icon {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .is-light .moon-icon {
          opacity: 0;
          transform: scale(0.5) rotate(-90deg);
        }
      `}</style>
    </button>
  );
}
