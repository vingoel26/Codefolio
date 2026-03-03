import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { syncAccount, syncUserAccounts } from '../services/sync.js';

const router = Router();

router.use(requireAuth);

// ═══════════════════════════════════════════
// Sync Routes
// ═══════════════════════════════════════════

// POST /api/sync/account/:id — sync a single linked account
router.post('/account/:id', async (req, res) => {
    const { id } = req.params;

    // Verify the account belongs to the user
    const account = await prisma.linkedAccount.findFirst({
        where: { id, userId: req.user.id },
    });

    if (!account) {
        return res.status(404).json({ error: 'Linked account not found' });
    }

    try {
        const result = await syncAccount(id);

        // Fetch updated account
        const updated = await prisma.linkedAccount.findUnique({ where: { id } });

        res.json({ result, account: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sync/all — sync all accounts for the current user
router.post('/all', async (req, res) => {
    try {
        const results = await syncUserAccounts(req.user.id);

        // Fetch all updated accounts
        const accounts = await prisma.linkedAccount.findMany({
            where: { userId: req.user.id },
            orderBy: [{ platform: 'asc' }, { isPrimary: 'desc' }],
        });

        res.json({ results, accounts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/sync/data/:platform — get cached data for a platform (primary account)
router.get('/data/:platform', async (req, res) => {
    const { platform } = req.params;

    const account = await prisma.linkedAccount.findFirst({
        where: {
            userId: req.user.id,
            platform,
            isPrimary: true,
        },
    });

    if (!account) {
        return res.status(404).json({ error: `No primary ${platform} account linked` });
    }

    res.json({
        account: {
            id: account.id,
            handle: account.handle,
            platform: account.platform,
            label: account.label,
            isPrimary: account.isPrimary,
            lastSync: account.lastSync,
        },
        data: account.data,
    });
});

// GET /api/sync/data/:platform/:accountId — get cached data for a specific account
router.get('/data/:platform/:accountId', async (req, res) => {
    const { platform, accountId } = req.params;

    const account = await prisma.linkedAccount.findFirst({
        where: {
            id: accountId,
            userId: req.user.id,
            platform,
        },
    });

    if (!account) {
        return res.status(404).json({ error: 'Linked account not found' });
    }

    res.json({
        account: {
            id: account.id,
            handle: account.handle,
            platform: account.platform,
            label: account.label,
            isPrimary: account.isPrimary,
            lastSync: account.lastSync,
        },
        data: account.data,
    });
});

// GET /api/sync/accounts/:platform — get ALL accounts for a platform (multi-account)
router.get('/accounts/:platform', async (req, res) => {
    const { platform } = req.params;

    const accounts = await prisma.linkedAccount.findMany({
        where: {
            userId: req.user.id,
            platform,
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    res.json({
        accounts: accounts.map((a) => ({
            id: a.id,
            handle: a.handle,
            platform: a.platform,
            label: a.label,
            isPrimary: a.isPrimary,
            lastSync: a.lastSync,
            data: a.data,
        })),
    });
});

export default router;
