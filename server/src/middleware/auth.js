import { verifyAccessToken } from '../lib/jwt.js';
import prisma from '../lib/prisma.js';

/**
 * Auth middleware — validates JWT access token from Authorization header.
 * Attaches `req.user` if valid.
 */
export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    // Fetch full user from DB
    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
    });

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
export async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payload = verifyAccessToken(token);

        if (payload) {
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
            });
            req.user = user;
        }
    }

    next();
}
