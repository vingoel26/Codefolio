/**
 * Sync Service — orchestrates platform data fetching.
 */
import prisma from '../lib/prisma.js';
import { fetchCodeforcesData } from './codeforces.js';
import { fetchLeetCodeData } from './leetcode.js';
import { fetchCodeChefData } from './codechef.js';
import { fetchGFGData } from './gfg.js';

const fetchers = {
    codeforces: fetchCodeforcesData,
    leetcode: fetchLeetCodeData,
    codechef: fetchCodeChefData,
    gfg: fetchGFGData,
};

/**
 * Sync a single linked account — fetch data and store it.
 */
export async function syncAccount(accountId) {
    const account = await prisma.linkedAccount.findUnique({
        where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    const fetcher = fetchers[account.platform];
    if (!fetcher) throw new Error(`No fetcher for platform: ${account.platform}`);

    console.log(`[Sync] Fetching ${account.platform}/${account.handle}...`);

    try {
        const data = await fetcher(account.handle);

        await prisma.linkedAccount.update({
            where: { id: accountId },
            data: {
                data,
                lastSync: new Date(),
            },
        });

        console.log(`[Sync] ✓ ${account.platform}/${account.handle} synced`);
        return { success: true, platform: account.platform, handle: account.handle };
    } catch (err) {
        console.error(`[Sync] ✗ ${account.platform}/${account.handle}: ${err.message}`);
        return { success: false, platform: account.platform, handle: account.handle, error: err.message };
    }
}

/**
 * Sync all accounts for a user.
 */
export async function syncUserAccounts(userId) {
    const accounts = await prisma.linkedAccount.findMany({
        where: { userId },
    });

    console.log(`[Sync] Syncing ${accounts.length} accounts for user ${userId}`);

    const results = [];
    for (const account of accounts) {
        // Sequential to avoid rate limiting
        const result = await syncAccount(account.id);
        results.push(result);

        // Small delay between requests to be nice to APIs
        if (accounts.indexOf(account) < accounts.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    return results;
}

/**
 * Sync all accounts that haven't been synced recently.
 * @param {number} staleMins — consider stale after this many minutes (default: 360 = 6h)
 */
export async function syncStaleAccounts(staleMins = 360) {
    const staleDate = new Date(Date.now() - staleMins * 60 * 1000);

    const staleAccounts = await prisma.linkedAccount.findMany({
        where: {
            OR: [
                { lastSync: null },
                { lastSync: { lt: staleDate } },
            ],
        },
    });

    if (staleAccounts.length === 0) {
        console.log('[Cron] No stale accounts to sync');
        return [];
    }

    console.log(`[Cron] Found ${staleAccounts.length} stale accounts, syncing...`);

    const results = [];
    for (const account of staleAccounts) {
        const result = await syncAccount(account.id);
        results.push(result);
        await new Promise((r) => setTimeout(r, 1000)); // 1s delay between accounts
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[Cron] Sync complete: ${successCount}/${results.length} succeeded`);

    return results;
}
