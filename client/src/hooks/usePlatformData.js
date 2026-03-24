import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Hook to fetch synced platform data from the backend.
 * Supports multi-account: fetches all accounts for a platform,
 * lets user switch between them.
 * @param {string} platform - 'codeforces' | 'leetcode' | 'codechef' | 'gfg'
 */
export function usePlatformData(platform) {
    const { accessToken } = useAuthStore();
    const [accounts, setAccounts] = useState([]);       // all linked accounts
    const [activeIdx, setActiveIdx] = useState(0);       // currently selected account index
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const fetchAll = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/sync/accounts/${platform}?_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `No ${platform} data available`);
            }
            const json = await res.json();
            const accts = json.accounts || [];
            setAccounts(accts);
            if (accts.length === 0) {
                setError(`No ${platform} account linked. Go to Settings → Accounts to add one.`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, platform]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Currently active account and its data
    const activeAccount = accounts[activeIdx] || null;
    const data = activeAccount?.data || null;

    // Sync current account
    const sync = useCallback(async () => {
        if (!activeAccount?.id || !accessToken) return;
        setSyncing(true);
        try {
            await fetch(`${API_URL}/sync/account/${activeAccount.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            await fetchAll();
        } catch {
            // ignore
        } finally {
            setSyncing(false);
        }
    }, [activeAccount, accessToken, fetchAll]);

    return {
        data,
        account: activeAccount,
        accounts,
        activeIdx,
        setActiveIdx,
        loading,
        error,
        syncing,
        refetch: fetchAll,
        sync,
    };
}
