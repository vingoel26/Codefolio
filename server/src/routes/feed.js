import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// GET /api/feed
// Fetch chronological activity from followed users (and self)
// ==========================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // 1. Get the IDs of users the current user is following
        const followingRows = await prisma.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const followingIds = followingRows.map(row => row.followingId);

        // Include self
        followingIds.push(userId);

        // 2. Fetch activity events for all these users
        const events = await prisma.activityEvent.findMany({
            where: {
                userId: { in: followingIds }
            },
            include: {
                user: {
                    select: {
                        username: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // 3. Count total for pagination
        const total = await prisma.activityEvent.count({
            where: {
                userId: { in: followingIds }
            }
        });

        res.json({
            events,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + events.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
});

export default router;
