import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════
// Public Profile (no auth required)
// ═══════════════════════════════════════════

router.get('/u/:username', optionalAuth, async (req, res) => {
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
                portfolioTheme: true,
                portfolioTagline: true,
                portfolioSections: true,
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
                posts: {
                    where: { status: 'published' },
                    orderBy: { publishedAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        excerpt: true,
                        publishedAt: true,
                        tags: true,
                    }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get follower/following counts
        const followersCount = await prisma.follows.count({ where: { followingId: user.id } });
        const followingCount = await prisma.follows.count({ where: { followerId: user.id } });

        // Check if the requesting user is following this profile (optional auth)
        let isFollowing = false;
        if (req.user) {
            const follows = await prisma.follows.findUnique({
                where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } }
            });
            if (follows) isFollowing = true;
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
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                joinedAt: user.createdAt,
                portfolioTheme: user.portfolioTheme,
                portfolioTagline: user.portfolioTagline,
                portfolioSections: user.portfolioSections,
                grandTotalSolved,
                bestRating,
                totalContests,
                platformsLinked,
                followersCount,
                followingCount,
                isFollowing,
            },
            platforms,
            recentPosts: user.posts || []
        });
    } catch (err) {
        console.error('Error fetching public profile:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// All remaining user routes require authentication
router.use(requireAuth);

// ═══════════════════════════════════════════
// Follower System (Social)
// ═══════════════════════════════════════════

// POST /api/users/u/:username/follow
router.post('/u/:username/follow', async (req, res) => {

    try {
        const { username } = req.params;
        const targetUser = await prisma.user.findUnique({ where: { username } });

        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

        await prisma.follows.create({
            data: {
                followerId: req.user.id,
                followingId: targetUser.id
            }
        });

        // Trigger an activity event for the target user (so they see they got a follower)
        // Wait, the feed shows activities *by* the people you follow. So if I follow John,
        // it creates an event for *me* hitting a milestone? No, a follow is an event.
        // For now let's just create the follow relationship.
        await prisma.activityEvent.create({
            data: {
                userId: req.user.id,
                type: 'NEW_FOLLOW',
                metadata: { targetUsername: username, targetDisplayName: targetUser.displayName }
            }
        });

        res.json({ success: true, isFollowing: true });
    } catch (err) {
        if (err.code === 'P2002') return res.json({ success: true, isFollowing: true }); // already following
        console.error('Follow error:', err);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// DELETE /api/users/u/:username/follow
router.delete('/u/:username/follow', async (req, res) => {

    try {
        const { username } = req.params;
        const targetUser = await prisma.user.findUnique({ where: { username } });

        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: targetUser.id
                }
            }
        });
        res.json({ success: true, isFollowing: false });
    } catch (err) {
        if (err.code === 'P2025') return res.json({ success: true, isFollowing: false }); // already not following
        console.error('Unfollow error:', err);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// GET /api/users/u/:username/followers
router.get('/u/:username/followers', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const follows = await prisma.follows.findMany({
            where: { followingId: user.id },
            include: {
                follower: { select: { username: true, displayName: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ followers: follows.map(f => f.follower) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/users/u/:username/following
router.get('/u/:username/following', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const follows = await prisma.follows.findMany({
            where: { followerId: user.id },
            include: {
                following: { select: { username: true, displayName: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ following: follows.map(f => f.following) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

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

        // Trigger feed activity
        await prisma.activityEvent.create({
            data: {
                userId: req.user.id,
                type: 'NEW_LINK_ACCOUNT',
                metadata: { platform, handle: handle.trim() }
            }
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
