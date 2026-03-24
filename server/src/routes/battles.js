import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// In-memory cache for CF problems to avoid hitting the heavy API on every request
let cfProblemsCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function getCFProblems() {
    if (cfProblemsCache && Date.now() - lastCacheUpdate < CACHE_TTL) {
        return cfProblemsCache;
    }
    try {
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        if (response.data.status === 'OK') {
            cfProblemsCache = response.data.result.problems;
            lastCacheUpdate = Date.now();
            return cfProblemsCache;
        }
        throw new Error('Codeforces API returned non-OK status');
    } catch (error) {
        console.error('Error fetching CF problems:', error.message);
        if (cfProblemsCache) return cfProblemsCache; // Fallback to stale cache
        throw error;
    }
}

// Create a new match room
router.post('/', requireAuth, async (req, res) => {
    try {
        const { minDifficulty, maxDifficulty, tags, cfHandle, duration } = req.body;

        const allProblems = await getCFProblems();

        // Filter problems
        let available = allProblems.filter(p => p.rating && p.rating >= (minDifficulty || 800) && p.rating <= (maxDifficulty || 3500));
        if (tags && tags.length > 0) {
            available = available.filter(p => tags.every(t => p.tags.includes(t)));
        }

        if (available.length === 0) {
            return res.status(404).json({ error: 'No problems found matching criteria' });
        }

        // Select random problem
        const problem = available[Math.floor(Math.random() * available.length)];
        const problemId = `${problem.contestId}-${problem.index}`;
        const problemLink = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;

        // Create conversation for chat (spectators and players)
        const conversation = await prisma.conversation.create({
            data: {
                type: 'battle',
                name: `Battle Room: ${problemId}`,
                participants: {
                    create: { userId: req.user.id }
                }
            }
        });

        // Create match
        const match = await prisma.battleMatch.create({
            data: {
                problemId,
                problemName: problem.name,
                problemLink,
                difficulty: problem.rating,
                tags: problem.tags,
                status: 'WAITING',
                duration: duration || 60,
                conversationId: conversation.id,
                players: {
                    create: { userId: req.user.id, cfHandle }
                }
            },
            include: {
                players: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } }
            }
        });

        res.json(match);
    } catch (error) {
        console.error('Error creating battle:', error);
        res.status(500).json({ error: 'Failed to create battle room' });
    }
});

// List open/active matches
router.get('/', async (req, res) => {
    try {
        const matches = await prisma.battleMatch.findMany({
            where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
            orderBy: { createdAt: 'desc' },
            include: {
                players: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } }
            }
        });
        res.json(matches);
    } catch (error) {
        console.error('Error fetching active battles:', error);
        res.status(500).json({ error: 'Failed to fetch active battles' });
    }
});

// Get match details
router.get('/:id', async (req, res) => {
    try {
        const match = await prisma.battleMatch.findUnique({
            where: { id: req.params.id },
            include: {
                players: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } }
            }
        });
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Mask details if WAITING
        if (match.status === 'WAITING') {
            match.problemName = '???';
            match.problemLink = '#';
        }

        res.json(match);
    } catch (error) {
        console.error('Error fetching battle detail:', error);
        res.status(500).json({ error: 'Failed to fetch match details' });
    }
});

export default router;
