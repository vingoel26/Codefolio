/**
 * Cron scheduler — periodic background sync.
 */
import cron from 'node-cron';
import { syncStaleAccounts } from '../services/sync.js';

/**
 * Start the cron scheduler.
 * Runs every 6 hours to sync stale accounts.
 */
export function startCron() {
    // Run every 6 hours: at minute 0 of hours 0, 6, 12, 18
    cron.schedule('0 */6 * * *', async () => {
        console.log('[Cron] Starting scheduled sync...');
        try {
            await syncStaleAccounts();
        } catch (err) {
            console.error('[Cron] Scheduled sync failed:', err.message);
        }
    });

    console.log('  ⏰ Cron: background sync every 6h');
}
