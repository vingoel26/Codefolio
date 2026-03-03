import { useState, useEffect, useCallback } from 'react';
import { Link2, Plus, Trash2, Star, Edit3, X, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLATFORMS = [
    {
        id: 'codeforces',
        name: 'Codeforces',
        color: '#1a8cff',
        icon: 'CF',
        placeholder: 'e.g. tourist',
        profileUrl: (h) => `https://codeforces.com/profile/${h}`,
    },
    {
        id: 'leetcode',
        name: 'LeetCode',
        color: '#ffa116',
        icon: 'LC',
        placeholder: 'e.g. neal_wu',
        profileUrl: (h) => `https://leetcode.com/u/${h}`,
    },
    {
        id: 'codechef',
        name: 'CodeChef',
        color: '#5b4638',
        icon: 'CC',
        placeholder: 'e.g. admin',
        profileUrl: (h) => `https://www.codechef.com/users/${h}`,
    },
    {
        id: 'gfg',
        name: 'GeeksforGeeks',
        color: '#2f8d46',
        icon: 'GFG',
        placeholder: 'e.g. geeksforgeeks',
        profileUrl: (h) => `https://www.geeksforgeeks.org/user/${h}`,
    },
];

export default function Accounts() {
    const { accessToken } = useAuthStore();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addingPlatform, setAddingPlatform] = useState(null); // which platform's add form is open
    const [editingId, setEditingId] = useState(null); // which account is being edited
    const [formHandle, setFormHandle] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [syncingId, setSyncingId] = useState(null); // 'all' or account id

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
    };

    // ── Fetch accounts ──
    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/users/linked-accounts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to load accounts');
            const data = await res.json();
            setAccounts(data.accounts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // ── Link account ──
    const handleLink = async (platform) => {
        if (!formHandle.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/linked-accounts`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ platform, handle: formHandle.trim(), label: formLabel.trim() || null }),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to link account');
            }
            setAddingPlatform(null);
            setFormHandle('');
            setFormLabel('');
            await fetchAccounts();

            // Auto-sync the newly linked account
            if (data.account?.id) {
                handleSync(data.account.id);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Unlink account ──
    const handleUnlink = async (id) => {
        if (!confirm('Remove this linked account?')) return;
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/linked-accounts/${id}`, {
                method: 'DELETE',
                headers: authHeaders,
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to unlink');
            await fetchAccounts();
        } catch (err) {
            setError(err.message);
        }
    };

    // ── Set primary ──
    const handleSetPrimary = async (id) => {
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/linked-accounts/${id}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ isPrimary: true }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to set primary');
            await fetchAccounts();
        } catch (err) {
            setError(err.message);
        }
    };

    // ── Update label ──
    const handleUpdateLabel = async (id) => {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/users/linked-accounts/${id}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ label: formLabel.trim() || null }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to update label');
            setEditingId(null);
            setFormLabel('');
            await fetchAccounts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Sync single account ──
    const handleSync = async (id) => {
        setSyncingId(id);
        setError('');
        try {
            const res = await fetch(`${API_URL}/sync/account/${id}`, {
                method: 'POST',
                headers: authHeaders,
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Sync failed');
            }
            await fetchAccounts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncingId(null);
        }
    };

    // ── Sync all accounts ──
    const handleSyncAll = async () => {
        setSyncingId('all');
        setError('');
        try {
            const res = await fetch(`${API_URL}/sync/all`, {
                method: 'POST',
                headers: authHeaders,
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Sync failed');
            await fetchAccounts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncingId(null);
        }
    };


    // ── Group accounts by platform ──
    const groupedByPlatform = PLATFORMS.map((p) => ({
        ...p,
        accounts: accounts.filter((a) => a.platform === p.id),
    }));

    if (loading) {
        return (
            <div className="accounts-loading">
                <Loader2 size={32} className="spin" />
                <p>Loading accounts...</p>
                <style>{loadingStyle}</style>
            </div>
        );
    }

    return (
        <div className="accounts-page">
            <div className="accounts-header">
                <div>
                    <h1 className="accounts-title">Connected Accounts</h1>
                    <p className="accounts-subtitle">
                        Link your competitive programming handles to track stats across platforms.
                        You can add multiple accounts per platform.
                    </p>
                </div>
                <div className="accounts-header-actions">
                    <button
                        className="accounts-sync-all-btn"
                        onClick={handleSyncAll}
                        disabled={syncingId === 'all' || accounts.length === 0}
                        title="Sync all accounts"
                    >
                        {syncingId === 'all' ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                        Sync All
                    </button>
                    <button className="accounts-refresh-btn" onClick={fetchAccounts} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="accounts-error" onClick={() => setError('')}>
                    ⚠️ {error}
                    <X size={14} />
                </div>
            )}

            <div className="accounts-grid">
                {groupedByPlatform.map((platform) => (
                    <div key={platform.id} className="platform-card glass-card">
                        {/* Platform header */}
                        <div className="platform-header">
                            <div className="platform-icon" style={{ background: platform.color }}>
                                {platform.icon}
                            </div>
                            <div className="platform-info">
                                <h3 className="platform-name">{platform.name}</h3>
                                <span className="platform-count">
                                    {platform.accounts.length} account{platform.accounts.length !== 1 ? 's' : ''} linked
                                </span>
                            </div>
                            <button
                                className="platform-add-btn"
                                onClick={() => {
                                    setAddingPlatform(addingPlatform === platform.id ? null : platform.id);
                                    setFormHandle('');
                                    setFormLabel('');
                                    setError('');
                                }}
                                style={{ color: platform.color }}
                                title="Add account"
                            >
                                {addingPlatform === platform.id ? <X size={18} /> : <Plus size={18} />}
                            </button>
                        </div>

                        {/* Add form */}
                        {addingPlatform === platform.id && (
                            <div className="add-form animate-fade-in">
                                <div className="add-form-row">
                                    <input
                                        type="text"
                                        value={formHandle}
                                        onChange={(e) => setFormHandle(e.target.value)}
                                        placeholder={platform.placeholder}
                                        className="add-form-input"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={formLabel}
                                        onChange={(e) => setFormLabel(e.target.value)}
                                        placeholder="Label (optional)"
                                        className="add-form-input add-form-label-input"
                                    />
                                </div>
                                <button
                                    className="add-form-submit"
                                    onClick={() => handleLink(platform.id)}
                                    disabled={submitting || !formHandle.trim()}
                                    style={{ background: platform.color }}
                                >
                                    {submitting ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                                    Link Account
                                </button>
                            </div>
                        )}

                        {/* Linked accounts list */}
                        {platform.accounts.length > 0 ? (
                            <div className="account-list">
                                {platform.accounts.map((acc) => (
                                    <div key={acc.id} className={`account-item ${acc.isPrimary ? 'account-primary' : ''}`}>
                                        <div className="account-main">
                                            <div className="account-handle-row">
                                                <span className="account-handle">{acc.handle}</span>
                                                {acc.isPrimary && (
                                                    <span className="account-badge" style={{ background: platform.color }}>
                                                        <Star size={10} /> Primary
                                                    </span>
                                                )}
                                                {acc.label && (
                                                    <span className="account-label">{acc.label}</span>
                                                )}
                                            </div>
                                            {acc.lastSync && (
                                                <span className="account-sync">
                                                    Synced {new Date(acc.lastSync).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Edit label inline */}
                                        {editingId === acc.id && (
                                            <div className="edit-label-form animate-fade-in">
                                                <input
                                                    type="text"
                                                    value={formLabel}
                                                    onChange={(e) => setFormLabel(e.target.value)}
                                                    placeholder="Label (e.g. Main, Practice)"
                                                    className="add-form-input"
                                                    autoFocus
                                                />
                                                <div className="edit-label-actions">
                                                    <button
                                                        className="edit-save-btn"
                                                        onClick={() => handleUpdateLabel(acc.id)}
                                                        disabled={submitting}
                                                    >
                                                        Save
                                                    </button>
                                                    <button className="edit-cancel-btn" onClick={() => setEditingId(null)}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="account-actions">
                                            <button
                                                className={`account-action-btn ${syncingId === acc.id ? 'syncing' : ''}`}
                                                onClick={() => handleSync(acc.id)}
                                                disabled={!!syncingId}
                                                title="Sync now"
                                            >
                                                {syncingId === acc.id ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                                            </button>
                                            <a
                                                href={platform.profileUrl(acc.handle)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="account-action-btn"
                                                title="View profile"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                            {!acc.isPrimary && platform.accounts.length > 1 && (
                                                <button
                                                    className="account-action-btn"
                                                    onClick={() => handleSetPrimary(acc.id)}
                                                    title="Set as primary"
                                                >
                                                    <Star size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="account-action-btn"
                                                onClick={() => {
                                                    setEditingId(editingId === acc.id ? null : acc.id);
                                                    setFormLabel(acc.label || '');
                                                }}
                                                title="Edit label"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                className="account-action-btn account-action-danger"
                                                onClick={() => handleUnlink(acc.id)}
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="account-empty">
                                <p>No accounts linked yet</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{pageStyle}</style>
        </div>
    );
}

const loadingStyle = `
    .accounts-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        gap: 12px;
        color: var(--text-secondary);
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
`;

const pageStyle = `
    .accounts-page {
        max-width: 900px;
        margin: 0 auto;
    }

    .accounts-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 28px;
    }

    .accounts-title {
        font-size: 1.75rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 6px;
    }

    .accounts-subtitle {
        color: var(--text-secondary);
        font-size: 0.9375rem;
        line-height: 1.6;
        max-width: 500px;
    }

    .accounts-refresh-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        padding: 10px;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .accounts-refresh-btn:hover {
        color: var(--text-primary);
        border-color: var(--border-strong);
    }

    .accounts-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .accounts-sync-all-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 16px;
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.8125rem;
        font-weight: 600;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .accounts-sync-all-btn:hover:not(:disabled) {
        background: var(--accent-hover);
    }

    .accounts-sync-all-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .account-action-btn.syncing {
        color: var(--accent);
    }

    .accounts-error {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--error-bg, rgba(255,85,85,0.1));
        color: var(--error);
        border-radius: var(--radius-md);
        font-size: 0.8125rem;
        font-weight: 500;
        margin-bottom: 20px;
        cursor: pointer;
    }

    .accounts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        gap: 20px;
    }

    /* Platform Card */
    .platform-card {
        padding: 24px;
        border-radius: var(--radius-lg);
    }

    .platform-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 16px;
    }

    .platform-icon {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.75rem;
        color: #fff;
        flex-shrink: 0;
    }

    .platform-info {
        flex: 1;
    }

    .platform-name {
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 2px;
    }

    .platform-count {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .platform-add-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 8px;
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
    }

    .platform-add-btn:hover {
        border-color: currentColor;
        background: var(--bg-hover);
    }

    /* Add Form */
    .add-form {
        padding: 14px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .add-form-row {
        display: flex;
        gap: 8px;
    }

    .add-form-input {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: var(--font-sans);
        outline: none;
        transition: border-color var(--transition-fast);
    }

    .add-form-input:focus {
        border-color: var(--accent);
    }

    .add-form-input::placeholder {
        color: var(--text-muted);
    }

    .add-form-label-input {
        max-width: 140px;
    }

    .add-form-submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 16px;
        border: none;
        border-radius: var(--radius-sm);
        color: #fff;
        font-size: 0.8125rem;
        font-weight: 600;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: opacity var(--transition-fast);
        align-self: flex-start;
    }

    .add-form-submit:hover:not(:disabled) {
        opacity: 0.9;
    }

    .add-form-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Account List */
    .account-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .account-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        transition: border-color var(--transition-fast);
        flex-wrap: wrap;
        gap: 8px;
    }

    .account-item:hover {
        border-color: var(--border);
    }

    .account-primary {
        border-color: var(--border);
    }

    .account-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
    }

    .account-handle-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .account-handle {
        font-weight: 600;
        font-size: 0.9375rem;
        font-family: var(--font-mono, monospace);
    }

    .account-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 0.625rem;
        font-weight: 700;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .account-label {
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: 0.6875rem;
        font-weight: 500;
        background: var(--accent-subtle, rgba(108,92,231,0.1));
        color: var(--accent);
    }

    .account-sync {
        font-size: 0.6875rem;
        color: var(--text-muted);
    }

    .account-actions {
        display: flex;
        gap: 4px;
    }

    .account-action-btn {
        background: none;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        color: var(--text-muted);
        padding: 6px;
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
    }

    .account-action-btn:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
        border-color: var(--border);
    }

    .account-action-danger:hover {
        color: var(--error);
    }

    /* Edit label form */
    .edit-label-form {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        margin-top: 4px;
    }

    .edit-label-actions {
        display: flex;
        gap: 4px;
    }

    .edit-save-btn,
    .edit-cancel-btn {
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: 1px solid var(--border);
    }

    .edit-save-btn {
        background: var(--accent);
        color: #fff;
        border: none;
    }

    .edit-cancel-btn {
        background: var(--bg-secondary);
        color: var(--text-secondary);
    }

    /* Empty state */
    .account-empty {
        padding: 20px;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.8125rem;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px dashed var(--border);
    }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
