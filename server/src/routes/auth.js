import { Router } from 'express';
import passport from 'passport';
import config from '../config.js';
import prisma from '../lib/prisma.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
} from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── Cookie options ──
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

/**
 * Helper — issue tokens and set refresh cookie.
 */
async function issueTokens(res, user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken, user: sanitizeUser(user) };
}

/**
 * Strip sensitive fields from user object.
 */
function sanitizeUser(user) {
    const { providerId, ...safe } = user;
    return safe;
}

// ═══════════════════════════════════════════
// Google OAuth
// ═══════════════════════════════════════════

// GET /api/auth/google — start OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback — handle OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${config.clientUrl}/login?error=google_failed` }),
    async (req, res) => {
        try {
            const { accessToken } = await issueTokens(res, req.user);
            // Redirect to frontend with token
            res.redirect(`${config.clientUrl}/auth/callback/google?token=${accessToken}`);
        } catch (err) {
            console.error('Google callback error:', err);
            res.redirect(`${config.clientUrl}/login?error=server_error`);
        }
    }
);

// ═══════════════════════════════════════════
// GitHub OAuth
// ═══════════════════════════════════════════

// GET /api/auth/github — start OAuth flow
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GET /api/auth/github/callback — handle OAuth callback
router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${config.clientUrl}/login?error=github_failed` }),
    async (req, res) => {
        try {
            const { accessToken } = await issueTokens(res, req.user);
            res.redirect(`${config.clientUrl}/auth/callback/github?token=${accessToken}`);
        } catch (err) {
            console.error('GitHub callback error:', err);
            res.redirect(`${config.clientUrl}/login?error=server_error`);
        }
    }
);

// ═══════════════════════════════════════════
// Token Management
// ═══════════════════════════════════════════

// POST /api/auth/refresh — refresh access token using HttpOnly cookie
router.post('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        return res.status(401).json({ error: 'No refresh token' });
    }

    const user = await verifyRefreshToken(token);

    if (!user) {
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke old, issue new
    await revokeRefreshToken(token);
    const result = await issueTokens(res, user);

    res.json(result);
});

// POST /api/auth/logout — revoke refresh token
router.post('/logout', async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        await revokeRefreshToken(token);
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    }

    res.json({ message: 'Logged out' });
});

// ═══════════════════════════════════════════
// Current User
// ═══════════════════════════════════════════

// GET /api/auth/me — get current user
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
});

// PATCH /api/auth/me — update profile
router.patch('/me', requireAuth, async (req, res) => {
    const { displayName, bio, username } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(username !== undefined && { username }),
            },
        });

        res.json({ user: sanitizeUser(user) });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        throw err;
    }
});

export default router;
