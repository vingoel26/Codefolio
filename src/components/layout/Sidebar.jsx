import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Link2,
    Code2,
    Trophy,
    BarChart3,
    BookOpen,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    {
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        description: 'All platforms overview',
    },
    {
        label: 'Codeforces',
        path: '/codeforces',
        icon: Trophy,
        description: 'CF stats & contests',
        platform: 'codeforces',
    },
    {
        label: 'LeetCode',
        path: '/leetcode',
        icon: Code2,
        description: 'LC problems & streaks',
        platform: 'leetcode',
    },
    {
        label: 'CodeChef',
        path: '/codechef',
        icon: BarChart3,
        description: 'CC rating & division',
        platform: 'codechef',
    },
    {
        label: 'GeeksforGeeks',
        path: '/gfg',
        icon: BookOpen,
        description: 'GFG score & breakdown',
        platform: 'gfg',
    },
    { type: 'divider' },
    {
        label: 'Snippets',
        path: '/snippets',
        icon: Code2,
        description: 'Algorithm vault',
    },
    {
        label: 'Accounts',
        path: '/accounts',
        icon: Link2,
        description: 'Connected platforms',
    },
    {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        description: 'Profile & preferences',
    },
];

const platformDotColor = {
    codeforces: 'var(--codeforces)',
    leetcode: 'var(--leetcode)',
    codechef: 'var(--codechef)',
    gfg: 'var(--gfg)',
};

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">CF</div>
                    {!collapsed && (
                        <span className="sidebar-logo-text">Codefolio</span>
                    )}
                </div>
                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item, i) => {
                    if (item.type === 'divider') {
                        return <div key={`div-${i}`} className="sidebar-divider" />;
                    }

                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <div className="sidebar-item-icon">
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {item.platform && (
                                    <span
                                        className="sidebar-platform-dot"
                                        style={{ background: platformDotColor[item.platform] }}
                                    />
                                )}
                            </div>
                            {!collapsed && (
                                <div className="sidebar-item-text">
                                    <span className="sidebar-item-label">{item.label}</span>
                                </div>
                            )}
                            {isActive && <div className="sidebar-active-indicator" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom section */}
            {!collapsed && (
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">U</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">User</span>
                            <span className="sidebar-user-email">Sign in to sync</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .sidebar {
                    width: 260px;
                    min-width: 260px;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border);
                    transition: width var(--transition-base), min-width var(--transition-base);
                    z-index: 40;
                    overflow: hidden;
                }

                .sidebar-collapsed {
                    width: 68px;
                    min-width: 68px;
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    border-bottom: 1px solid var(--border);
                    min-height: 64px;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    overflow: hidden;
                }

                .sidebar-logo-icon {
                    width: 34px;
                    height: 34px;
                    min-width: 34px;
                    border-radius: var(--radius-md);
                    background: linear-gradient(135deg, var(--accent), var(--info));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.75rem;
                    color: #ffffff;
                }

                .sidebar-logo-text {
                    font-size: 1.125rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .sidebar-collapse-btn {
                    width: 28px;
                    height: 28px;
                    min-width: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    background: var(--bg-tertiary);
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .sidebar-collapse-btn:hover {
                    color: var(--text-primary);
                    border-color: var(--border-strong);
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 12px 8px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .sidebar-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 8px 8px;
                }

                .sidebar-item {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all var(--transition-fast);
                    overflow: hidden;
                }

                .sidebar-item:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .sidebar-item-active {
                    background: var(--accent-subtle);
                    color: var(--accent);
                    font-weight: 600;
                }

                .sidebar-item-active:hover {
                    background: var(--accent-subtle);
                    color: var(--accent);
                }

                .sidebar-item-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 20px;
                }

                .sidebar-platform-dot {
                    position: absolute;
                    top: -2px;
                    right: -4px;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .sidebar-item-text {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .sidebar-item-label {
                    white-space: nowrap;
                }

                .sidebar-active-indicator {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 20px;
                    border-radius: 0 3px 3px 0;
                    background: var(--accent);
                }

                .sidebar-footer {
                    padding: 12px 16px;
                    border-top: 1px solid var(--border);
                }

                .sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .sidebar-user-avatar {
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                    border-radius: var(--radius-full);
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.8125rem;
                    color: var(--text-muted);
                }

                .sidebar-user-info {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .sidebar-user-name {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .sidebar-user-email {
                    font-size: 0.6875rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                }
            `}</style>
        </aside>
    );
}
