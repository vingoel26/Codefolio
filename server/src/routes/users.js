import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════
// Linked Accounts (Platform Account Linking)
// ═══════════════════════════════════════════

// GET /api/users/linked-accounts — list all linked accounts
router.get('/linked-accounts', async (req, res) => {
    const accounts = await prisma.linkedAccount.findMany({
        where: { userId: req.user.id },
        orderBy: [{ platform: 'asc' }, { isPrimary: 'desc' }],
    });

    res.json({ accounts });
});

// POST /api/users/linked-accounts — link a new account
router.post('/linked-accounts', async (req, res) => {
    const { platform, handle, label } = req.body;

    if (!platform || !handle) {
        return res.status(400).json({ error: 'Platform and handle are required' });
    }

    const validPlatforms = ['codeforces', 'leetcode', 'codechef', 'gfg'];
    if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
    }

    try {
        // Check if this is the first account for this platform (auto-primary)
        const existingCount = await prisma.linkedAccount.count({
            where: { userId: req.user.id, platform },
        });

        const account = await prisma.linkedAccount.create({
            data: {
                userId: req.user.id,
                platform,
                handle: handle.trim(),
                label: label || null,
                isPrimary: existingCount === 0, // First account is auto-primary
            },
        });

        res.status(201).json({ account });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'This account is already linked' });
        }
        throw err;
    }
});

// PATCH /api/users/linked-accounts/:id — update account (label, primary)
router.patch('/linked-accounts/:id', async (req, res) => {
    const { id } = req.params;
    const { label, isPrimary } = req.body;

    const account = await prisma.linkedAccount.findFirst({
        where: { id, userId: req.user.id },
    });

    if (!account) {
        return res.status(404).json({ error: 'Linked account not found' });
    }

    // If setting as primary, unset others for this platform
    if (isPrimary) {
        await prisma.linkedAccount.updateMany({
            where: { userId: req.user.id, platform: account.platform },
            data: { isPrimary: false },
        });
    }

    const updated = await prisma.linkedAccount.update({
        where: { id },
        data: {
            ...(label !== undefined && { label }),
            ...(isPrimary !== undefined && { isPrimary }),
        },
    });

    res.json({ account: updated });
});

// DELETE /api/users/linked-accounts/:id — unlink account
router.delete('/linked-accounts/:id', async (req, res) => {
    const { id } = req.params;

    const account = await prisma.linkedAccount.findFirst({
        where: { id, userId: req.user.id },
    });

    if (!account) {
        return res.status(404).json({ error: 'Linked account not found' });
    }

    await prisma.linkedAccount.delete({ where: { id } });

    // If the deleted was primary, promote another
    if (account.isPrimary) {
        const nextPrimary = await prisma.linkedAccount.findFirst({
            where: { userId: req.user.id, platform: account.platform },
            orderBy: { createdAt: 'asc' },
        });

        if (nextPrimary) {
            await prisma.linkedAccount.update({
                where: { id: nextPrimary.id },
                data: { isPrimary: true },
            });
        }
    }

    res.json({ message: 'Account unlinked' });
});

export default router;
