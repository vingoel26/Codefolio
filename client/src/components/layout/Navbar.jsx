import { useLocation } from 'react-router-dom';
import { Bell, Search, Brain } from 'lucide-react';
import { useFocusStore } from '../../stores/focusStore';
import ThemeToggle from '../ui/ThemeToggle';

const pageTitles = {
    '/': 'Dashboard',
    '/codeforces': 'Codeforces',
    '/leetcode': 'LeetCode',
    '/codechef': 'CodeChef',
    '/gfg': 'GeeksforGeeks',
    '/snippets': 'Snippet Vault',
    '/accounts': 'Connected Accounts',
    '/settings': 'Settings',
    '/profile': 'Profile',
    '/feed': 'Community Feed',
    '/blog': 'Blog',
    '/blog/new': 'New Post',
};

const pageDescriptions = {
    '/': 'Aggregated stats across all platforms',
    '/codeforces': 'Rating, contests & problem analytics',
    '/leetcode': 'Problems solved, streaks & topic progress',
    '/codechef': 'Rating, division & contest history',
    '/gfg': 'Coding score & problem breakdown',
    '/snippets': 'Your personal algorithm template library',
    '/accounts': 'Manage linked platform accounts',
    '/settings': 'Profile & app preferences',
    '/profile': 'Your public profile & stats',
    '/feed': 'Recent activity from developers you follow',
    '/blog': 'Articles, editorials & discussions from the community',
    '/blog/new': 'Write and publish a new post',
};

export default function Navbar() {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Codefolio';
    const description = pageDescriptions[location.pathname] || '';
    const { toggleOpen, isRunning, timeLeft } = useFocusStore();

    return (
        <header className="navbar">
            <div className="navbar-left">
                <div>
                    <h1 className="navbar-title">{title}</h1>
                    {description && (
                        <p className="navbar-description">{description}</p>
                    )}
                </div>
            </div>

            <div className="navbar-right">
                {/* Focus Mode Toggle */}
                <button
                    className={`navbar-icon-btn ${isRunning ? 'focus-active' : ''}`}
                    aria-label="Focus Mode"
                    title="Pomodoro Timer"
                    onClick={toggleOpen}
                >
                    <Brain size={18} />
                    {isRunning && (
                        <span className="navbar-focus-badge">
                            {Math.floor(timeLeft / 60)}m
                        </span>
                    )}
                </button>

                {/* Search */}
                <button className="navbar-icon-btn" aria-label="Search" title="Search (Ctrl+K)">
                    <Search size={18} />
                </button>

                {/* Notifications */}
                <button className="navbar-icon-btn" aria-label="Notifications" title="Notifications">
                    <Bell size={18} />
                    <span className="navbar-notification-dot" />
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />
            </div>

            <style>{`
                .navbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 32px;
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-secondary);
                    min-height: 64px;
                    position: sticky;
                    top: 0;
                    z-index: 30;
                    backdrop-filter: blur(12px);
                }

                .navbar-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .navbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    margin: 0;
                }

                .navbar-description {
                    font-size: 0.8125rem;
                    color: var(--text-muted);
                    margin: 2px 0 0 0;
                }

                .navbar-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .navbar-icon-btn {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .navbar-icon-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                    border-color: var(--border-strong);
                }

                .navbar-notification-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--error);
                    border: 2px solid var(--bg-secondary);
                }
            `}</style>
        </header>
    );
}
