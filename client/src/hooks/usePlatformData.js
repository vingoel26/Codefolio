import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Hook to fetch synced platform data from the backend.
 * @param {string} platform - 'codeforces' | 'leetcode' | 'codechef' | 'gfg'
 */
export function usePlatformData(platform) {
    const { accessToken } = useAuthStore();
    const [data, setData] = useState(null);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/sync/data/${platform}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `No ${platform} data available`);
            }
            const json = await res.json();
            setAccount(json.account);
            setData(json.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, platform]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sync = useCallback(async () => {
        if (!account?.id || !accessToken) return;
        setLoading(true);
        try {
            await fetch(`${API_URL}/sync/account/${account.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            await fetchData();
        } catch {
            // ignore sync errors, data will refresh on next load
        }
    }, [account, accessToken, fetchData]);

    return { data, account, loading, error, refetch: fetchData, sync };
}
