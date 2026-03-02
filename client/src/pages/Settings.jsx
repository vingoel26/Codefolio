import { useState } from 'react';
import { Settings as SettingsIcon, User, Palette, Bell, Database, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
    const { user, logout, updateProfile } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Profile form state
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState(user?.bio || '');

    const handleSaveProfile = async () => {
        setSaving(true);
        await updateProfile({ displayName, bio });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'data', label: 'Data & Export', icon: Database },
    ];

    return (
        <div className="settings-page">
            <div className="settings-layout">
                {/* Tabs */}
                <nav className="settings-tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}

                    <div className="settings-tabs-divider" />

                    <button className="settings-tab settings-tab-danger" onClick={logout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </nav>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section animate-fade-in">
                            <h2 className="settings-section-title">Profile Settings</h2>
                            <p className="settings-section-desc">Manage your public profile information.</p>

                            <div className="settings-form">
                                {/* Avatar */}
                                <div className="settings-field">
                                    <label className="settings-label">Avatar</label>
                                    <div className="settings-avatar-row">
                                        <div className="settings-avatar">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="avatar" />
                                            ) : (
                                                <span>{(user?.displayName || 'U')[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="settings-avatar-info">
                                            <p className="settings-avatar-name">{user?.displayName || 'User'}</p>
                                            <p className="settings-avatar-email">{user?.email || 'Not signed in'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Display Name */}
                                <div className="settings-field">
                                    <label className="settings-label" htmlFor="displayName">Display Name</label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        className="settings-input"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your display name"
                                    />
                                </div>

                                {/* Bio */}
                                <div className="settings-field">
                                    <label className="settings-label" htmlFor="bio">Bio</label>
                                    <textarea
                                        id="bio"
                                        className="settings-input settings-textarea"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                </div>

                                {/* Save */}
                                <button
                                    className="settings-save-btn"
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="settings-section animate-fade-in">
                            <h2 className="settings-section-title">Appearance</h2>
                            <p className="settings-section-desc">Customize how Codefolio looks.</p>

                            <div className="settings-form">
                                <div className="settings-field">
                                    <label className="settings-label">Theme</label>
                                    <div className="settings-theme-options">
                                        {['light', 'dark'].map((t) => (
                                            <button
                                                key={t}
                                                className={`settings-theme-option ${theme === t ? 'settings-theme-option-active' : ''}`}
                                                onClick={() => setTheme(t)}
                                            >
                                                <div className={`settings-theme-preview settings-theme-preview-${t}`}>
                                                    <div className="stp-sidebar" />
                                                    <div className="stp-content">
                                                        <div className="stp-bar" />
                                                        <div className="stp-cards">
                                                            <div className="stp-card" />
                                                            <div className="stp-card" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section animate-fade-in">
                            <h2 className="settings-section-title">Notifications</h2>
                            <p className="settings-section-desc">Configure notification preferences.</p>
                            <div className="settings-placeholder">
                                <Bell size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                <p>Notification settings coming in Phase 2</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="settings-section animate-fade-in">
                            <h2 className="settings-section-title">Data & Export</h2>
                            <p className="settings-section-desc">Export your data or manage storage.</p>
                            <div className="settings-placeholder">
                                <Database size={48} strokeWidth={1} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                <p>Data export coming in Phase 2</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .settings-page {
                    max-width: 960px;
                    margin: 0 auto;
                }

                .settings-layout {
                    display: grid;
                    grid-template-columns: 220px 1fr;
                    gap: 32px;
                    min-height: calc(100vh - 140px);
                }

                .settings-tabs {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding-top: 4px;
                }

                .settings-tab {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    font-family: var(--font-sans);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-align: left;
                }

                .settings-tab:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .settings-tab-active {
                    background: var(--accent-subtle);
                    color: var(--accent);
                    font-weight: 600;
                }

                .settings-tab-danger {
                    color: var(--error);
                }

                .settings-tab-danger:hover {
                    background: rgba(255, 85, 85, 0.1);
                    color: var(--error);
                }

                .settings-tabs-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 8px 0;
                }

                .settings-content {
                    min-width: 0;
                }

                .settings-section-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .settings-section-desc {
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    margin-bottom: 28px;
                }

                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    max-width: 480px;
                }

                .settings-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .settings-label {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .settings-input {
                    padding: 10px 14px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    font-size: 0.9375rem;
                    font-family: var(--font-sans);
                    transition: border-color var(--transition-fast);
                    outline: none;
                }

                .settings-input:focus {
                    border-color: var(--accent);
                }

                .settings-textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .settings-avatar-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .settings-avatar {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius-full);
                    background: linear-gradient(135deg, var(--accent), var(--info));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                    overflow: hidden;
                }

                .settings-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .settings-avatar-name {
                    font-weight: 600;
                    font-size: 0.9375rem;
                    margin: 0;
                }

                .settings-avatar-email {
                    font-size: 0.8125rem;
                    color: var(--text-muted);
                    margin: 2px 0 0;
                }

                .settings-save-btn {
                    align-self: flex-start;
                    padding: 10px 28px;
                    background: var(--accent);
                    color: white;
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    font-size: 0.875rem;
                    font-family: var(--font-sans);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .settings-save-btn:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .settings-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Theme preview cards */
                .settings-theme-options {
                    display: flex;
                    gap: 16px;
                }

                .settings-theme-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border: 2px solid var(--border);
                    border-radius: var(--radius-lg);
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    font-family: var(--font-sans);
                    transition: all var(--transition-fast);
                }

                .settings-theme-option:hover {
                    border-color: var(--border-strong);
                }

                .settings-theme-option-active {
                    border-color: var(--accent);
                    color: var(--accent);
                }

                .settings-theme-preview {
                    width: 120px;
                    height: 80px;
                    border-radius: var(--radius-md);
                    display: flex;
                    overflow: hidden;
                }

                .settings-theme-preview-light {
                    background: #f8f9fc;
                }
                .settings-theme-preview-dark {
                    background: #0a0a0f;
                }

                .stp-sidebar {
                    width: 28px;
                    background: rgba(128, 128, 128, 0.15);
                }

                .stp-content {
                    flex: 1;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .stp-bar {
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(128, 128, 128, 0.2);
                }

                .stp-cards {
                    flex: 1;
                    display: flex;
                    gap: 4px;
                }

                .stp-card {
                    flex: 1;
                    border-radius: 4px;
                    background: rgba(128, 128, 128, 0.15);
                }

                /* Placeholder */
                .settings-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 24px;
                    text-align: center;
                    gap: 16px;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}
