import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════
// Public: List comments for a post (threaded)
// ═══════════════════════════════════════════

router.get('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;

        // Get all comments for this post
        const comments = await prisma.comment.findMany({
            where: { postId },
            select: {
                id: true,
                content: true,
                parentId: true,
                createdAt: true,
                updatedAt: true,
                author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Build tree structure
        const map = {};
        const roots = [];
        for (const c of comments) {
            map[c.id] = { ...c, replies: [] };
        }
        for (const c of comments) {
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].replies.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        }

        res.json({ comments: roots, total: comments.length });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// ═══════════════════════════════════════════
// Auth: Create comment
// ═══════════════════════════════════════════

router.post('/:postId/comments', requireAuth, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        // Verify post exists
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Verify parent exists if replying
        if (parentId) {
            const parent = await prisma.comment.findUnique({ where: { id: parentId } });
            if (!parent || parent.postId !== postId) {
                return res.status(400).json({ error: 'Invalid parent comment' });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                postId,
                authorId: req.user.id,
                content: content.trim(),
                parentId: parentId || null,
            },
            select: {
                id: true,
                content: true,
                parentId: true,
                createdAt: true,
                updatedAt: true,
                author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                },
            },
        });

        res.status(201).json({ comment: { ...comment, replies: [] } });
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// ═══════════════════════════════════════════
// Auth: Update comment
// ═══════════════════════════════════════════

router.put('/comments/:id', requireAuth, async (req, res) => {
    try {
        const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Comment not found' });
        if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not your comment' });

        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

        const comment = await prisma.comment.update({
            where: { id: req.params.id },
            data: { content: content.trim() },
            select: {
                id: true,
                content: true,
                parentId: true,
                createdAt: true,
                updatedAt: true,
                author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true },
                },
            },
        });

        res.json({ comment });
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// ═══════════════════════════════════════════
// Auth: Delete comment
// ═══════════════════════════════════════════

router.delete('/comments/:id', requireAuth, async (req, res) => {
    try {
        const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Comment not found' });
        if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not your comment' });

        await prisma.comment.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
