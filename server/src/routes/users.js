import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════
// Public Profile (no auth required)
// ═══════════════════════════════════════════

router.get('/u/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
                linkedAccounts: {
                    where: { isPrimary: true },
                    select: {
                        id: true,
                        platform: true,
                        handle: true,
                        isPrimary: true,
                        lastSync: true,
                        data: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Extract platform-specific stats from cached data
        let grandTotalSolved = 0;
        let bestRating = 0;
        let totalContests = 0;

        const platforms = user.linkedAccounts.map((acc) => {
            const d = typeof acc.data === 'string' ? JSON.parse(acc.data) : acc.data;
            let solved = 0, rating = 0, contests = 0, heatmap = null;

            if (d) {
                if (acc.platform === 'leetcode') {
                    solved = d.stats?.totalSolved || 0;
                    rating = d.contest?.rating || 0;
                    contests = d.contest?.contestsAttended || 0;
                    heatmap = d.submissionHeatmap || null;
                } else if (acc.platform === 'codeforces') {
                    solved = d.stats?.problemsSolved || 0;
                    rating = d.profile?.rating || 0;
                    contests = d.stats?.contestsParticipated || 0;
                    heatmap = d.submissionHeatmap || null;
                } else if (acc.platform === 'codechef') {
                    solved = d.stats?.totalProblemsSolved || 0;
                    rating = d.stats?.currentRating || 0;
                    heatmap = d.submissionHeatmap || null;
                } else if (acc.platform === 'gfg') {
                    solved = d.stats?.totalProblemsSolved || 0;
                    rating = d.stats?.codingScore || 0;
                }
            }

            grandTotalSolved += solved;
            totalContests += contests;
            if (rating > bestRating) bestRating = rating;

            return {
                platform: acc.platform,
                handle: acc.handle,
                solved,
                rating,
                contests,
                heatmap,
            };
        });

        const platformsLinked = platforms.length;

        res.json({
            profile: {
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                joinedAt: user.createdAt,
                grandTotalSolved,
                bestRating,
                totalContests,
                platformsLinked,
            },
            platforms,
        });
    } catch (err) {
        console.error('Error fetching public profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// All remaining user routes require authentication
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
