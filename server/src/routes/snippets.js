import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ═══════════════════════════════════════════
// GET /api/snippets — list all snippets for the user
// ═══════════════════════════════════════════
router.get('/', async (req, res) => {
    const { search, language, category, tag } = req.query;

    const where = { userId: req.user.id };

    // Search by title
    if (search) {
        where.title = { contains: search, mode: 'insensitive' };
    }

    // Filter by language
    if (language) {
        where.language = language;
    }

    // Filter by category
    if (category) {
        where.category = category;
    }

    // Filter by tag
    if (tag) {
        where.tags = { has: tag };
    }

    const snippets = await prisma.snippet.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            language: true,
            category: true,
            tags: true,
            code: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    res.json({ snippets });
});

// ═══════════════════════════════════════════
// GET /api/snippets/:id — get a single snippet
// ═══════════════════════════════════════════
router.get('/:id', async (req, res) => {
    const snippet = await prisma.snippet.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });

    if (!snippet) {
        return res.status(404).json({ error: 'Snippet not found' });
    }

    res.json({ snippet });
});

// ═══════════════════════════════════════════
// POST /api/snippets — create a new snippet
// ═══════════════════════════════════════════
router.post('/', async (req, res) => {
    const { title, code, language, category, tags } = req.body;

    if (!title || !code || !language) {
        return res.status(400).json({ error: 'Title, code, and language are required' });
    }

    const snippet = await prisma.snippet.create({
        data: {
            userId: req.user.id,
            title: title.trim(),
            code,
            language,
            category: category?.trim() || null,
            tags: tags || [],
        },
    });

    res.status(201).json({ snippet });
});

// ═══════════════════════════════════════════
// PUT /api/snippets/:id — update a snippet
// ═══════════════════════════════════════════
router.put('/:id', async (req, res) => {
    const existing = await prisma.snippet.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
        return res.status(404).json({ error: 'Snippet not found' });
    }

    const { title, code, language, category, tags } = req.body;

    const snippet = await prisma.snippet.update({
        where: { id: req.params.id },
        data: {
            ...(title !== undefined && { title: title.trim() }),
            ...(code !== undefined && { code }),
            ...(language !== undefined && { language }),
            ...(category !== undefined && { category: category?.trim() || null }),
            ...(tags !== undefined && { tags }),
        },
    });

    res.json({ snippet });
});

// ═══════════════════════════════════════════
// DELETE /api/snippets/:id — delete a snippet
// ═══════════════════════════════════════════
router.delete('/:id', async (req, res) => {
    const existing = await prisma.snippet.findFirst({
        where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
        return res.status(404).json({ error: 'Snippet not found' });
    }

    await prisma.snippet.delete({ where: { id: req.params.id } });

    res.json({ deleted: true });
});

// ═══════════════════════════════════════════
// GET /api/snippets/meta/filters — get available languages, categories, tags
// ═══════════════════════════════════════════
router.get('/meta/filters', async (req, res) => {
    const snippets = await prisma.snippet.findMany({
        where: { userId: req.user.id },
        select: { language: true, category: true, tags: true },
    });

    const languages = [...new Set(snippets.map((s) => s.language))].sort();
    const categories = [...new Set(snippets.map((s) => s.category).filter(Boolean))].sort();
    const tags = [...new Set(snippets.flatMap((s) => s.tags))].sort();

    res.json({ languages, categories, tags });
});

export default router;
