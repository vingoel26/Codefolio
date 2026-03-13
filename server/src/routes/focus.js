import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// =============================================
// Auth: Get Focus Stats & Recent Sessions
// =============================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get last 30 days of sessions
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sessions = await prisma.focusSession.findMany({
            where: {
                userId,
                startTime: { gte: thirtyDaysAgo },
            },
            orderBy: { startTime: 'desc' },
        });

        // Calculate total focused time (in minutes)
        const totalDurationSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
        const totalFocusedMinutes = Math.floor(totalDurationSeconds / 60);

        res.json({
            stats: {
                totalSessions: sessions.length,
                totalFocusedMinutes,
            },
            recentSessions: sessions.slice(0, 50), // Return up to 50 recent
        });

    } catch (err) {
        console.error('Error fetching focus data:', err);
        res.status(500).json({ error: 'Failed to fetch focus data' });
    }
});

// =============================================
// Auth: Save a Focus Session
// =============================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const { startTime, endTime, duration, task, status } = req.body;

        if (!startTime || !endTime || duration === undefined) {
            return res.status(400).json({ error: 'Missing required session parameters' });
        }

        const session = await prisma.focusSession.create({
            data: {
                userId: req.user.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: parseInt(duration, 10),
                task: task || null,
                status: status || 'completed',
            },
        });

        res.status(201).json({ session });
    } catch (err) {
        console.error('Error saving focus session:', err);
        res.status(500).json({ error: 'Failed to save focus session' });
    }
});

export default router;
