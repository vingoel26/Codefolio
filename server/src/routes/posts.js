import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

async function uniqueSlug(base) {
    let slug = base;
    let i = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
    }
    return slug;
}

const POST_SELECT = {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    type: true,
    tags: true,
    status: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
    },
    _count: { select: { votes: true, comments: true, bookmarks: true } },
};

// ═══════════════════════════════════════════
// Public: List published posts
// ═══════════════════════════════════════════

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { sort = 'latest', type, tag, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = { status: 'published' };
        if (type) where.type = type;
        if (tag) where.tags = { has: tag };

        const orderBy =
            sort === 'top'
                ? { votes: { _count: 'desc' } }
                : { publishedAt: 'desc' };

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                select: {
                    ...POST_SELECT,
                    // If user is logged in, check if they voted/bookmarked
                },
                orderBy,
                skip,
                take: parseInt(limit),
            }),
            prisma.post.count({ where }),
        ]);

        // Enrich with user-specific data
        let enriched = posts;
        if (req.user) {
            const postIds = posts.map((p) => p.id);
            const [votes, bookmarks] = await Promise.all([
                prisma.postVote.findMany({
                    where: { userId: req.user.id, postId: { in: postIds } },
                    select: { postId: true },
                }),
                prisma.bookmark.findMany({
                    where: { userId: req.user.id, postId: { in: postIds } },
                    select: { postId: true },
                }),
            ]);
            const votedSet = new Set(votes.map((v) => v.postId));
            const bookmarkedSet = new Set(bookmarks.map((b) => b.postId));
            enriched = posts.map((p) => ({
                ...p,
                hasVoted: votedSet.has(p.id),
                hasBookmarked: bookmarkedSet.has(p.id),
            }));
        }

        res.json({ posts: enriched, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error('Error listing posts:', err);
        res.status(500).json({ error: 'Failed to list posts' });
    }
});

// ═══════════════════════════════════════════
// Auth: List current user's drafts
// ═══════════════════════════════════════════

router.get('/drafts', requireAuth, async (req, res) => {
    try {
        const drafts = await prisma.post.findMany({
            where: { authorId: req.user.id, status: 'draft' },
            select: POST_SELECT,
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ posts: drafts });
    } catch (err) {
        console.error('Error listing drafts:', err);
        res.status(500).json({ error: 'Failed to list drafts' });
    }
});

// ═══════════════════════════════════════════
// Auth: List bookmarked posts
// ═══════════════════════════════════════════

router.get('/bookmarked', requireAuth, async (req, res) => {
    try {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: req.user.id },
            select: {
                post: { select: POST_SELECT },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ posts: bookmarks.map((b) => ({ ...b.post, hasBookmarked: true })) });
    } catch (err) {
        console.error('Error listing bookmarks:', err);
        res.status(500).json({ error: 'Failed to list bookmarks' });
    }
});

// ═══════════════════════════════════════════
// Public: Get single post by slug
// ═══════════════════════════════════════════

router.get('/:slug', optionalAuth, async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { slug: req.params.slug },
            select: {
                ...POST_SELECT,
                content: true,
            },
        });

        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Drafts only visible to author
        if (post.status === 'draft') {
            if (!req.user || post.author.id !== req.user.id) {
                return res.status(404).json({ error: 'Post not found' });
            }
        }

        let result = { ...post, hasVoted: false, hasBookmarked: false };

        if (req.user) {
            const [vote, bookmark] = await Promise.all([
                prisma.postVote.findUnique({
                    where: { userId_postId: { userId: req.user.id, postId: post.id } },
                }),
                prisma.bookmark.findUnique({
                    where: { userId_postId: { userId: req.user.id, postId: post.id } },
                }),
            ]);
            result.hasVoted = !!vote;
            result.hasBookmarked = !!bookmark;
        }

        res.json({ post: result });
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// ═══════════════════════════════════════════
// Auth: Create post
// ═══════════════════════════════════════════

router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, content, excerpt, type = 'article', tags = [], status = 'draft' } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const slug = await uniqueSlug(slugify(title));
        const publishedAt = status === 'published' ? new Date() : null;

        const post = await prisma.post.create({
            data: {
                authorId: req.user.id,
                title,
                slug,
                content,
                excerpt: excerpt || null,
                type,
                tags,
                status,
                publishedAt,
            },
            select: POST_SELECT,
        });

        // Create activity event if published
        if (status === 'published') {
            await prisma.activityEvent.create({
                data: {
                    userId: req.user.id,
                    type: 'NEW_POST',
                    metadata: { postId: post.id, title, slug, postType: type },
                },
            });
        }

        res.status(201).json({ post });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// ═══════════════════════════════════════════
// Auth: Update post
// ═══════════════════════════════════════════

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Post not found' });
        if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not your post' });

        const { title, content, excerpt, type, tags, status } = req.body;

        const data = {};
        if (title !== undefined) {
            data.title = title;
            // Only update slug if title changed and post is still a draft
            if (existing.status === 'draft' && title !== existing.title) {
                data.slug = await uniqueSlug(slugify(title));
            }
        }
        if (content !== undefined) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;
        if (type !== undefined) data.type = type;
        if (tags !== undefined) data.tags = tags;
        if (status !== undefined) {
            data.status = status;
            // Set publishedAt when first published
            if (status === 'published' && !existing.publishedAt) {
                data.publishedAt = new Date();
                // Create activity event
                await prisma.activityEvent.create({
                    data: {
                        userId: req.user.id,
                        type: 'NEW_POST',
                        metadata: {
                            postId: existing.id,
                            title: title || existing.title,
                            slug: data.slug || existing.slug,
                            postType: type || existing.type,
                        },
                    },
                });
            }
        }

        const post = await prisma.post.update({
            where: { id: req.params.id },
            data,
            select: POST_SELECT,
        });

        res.json({ post });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// ═══════════════════════════════════════════
// Auth: Delete post
// ═══════════════════════════════════════════

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Post not found' });
        if (existing.authorId !== req.user.id) return res.status(403).json({ error: 'Not your post' });

        await prisma.post.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// ═══════════════════════════════════════════
// Auth: Toggle upvote
// ═══════════════════════════════════════════

router.post('/:id/vote', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const existing = await prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            await prisma.postVote.delete({ where: { userId_postId: { userId, postId } } });
        } else {
            await prisma.postVote.create({ data: { userId, postId } });
        }

        const count = await prisma.postVote.count({ where: { postId } });
        res.json({ hasVoted: !existing, voteCount: count });
    } catch (err) {
        console.error('Error toggling vote:', err);
        res.status(500).json({ error: 'Failed to toggle vote' });
    }
});

// ═══════════════════════════════════════════
// Auth: Toggle bookmark
// ═══════════════════════════════════════════

router.post('/:id/bookmark', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const existing = await prisma.bookmark.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            await prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
        } else {
            await prisma.bookmark.create({ data: { userId, postId } });
        }

        res.json({ hasBookmarked: !existing });
    } catch (err) {
        console.error('Error toggling bookmark:', err);
        res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
});

export default router;
