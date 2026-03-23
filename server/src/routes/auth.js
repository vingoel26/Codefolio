import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
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
    secure: true,
    sameSite: 'none',
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
    const { providerId, passwordHash, ...safe } = user;
    return safe;
}

// ═══════════════════════════════════════════
// Email/Password — Register
// ═══════════════════════════════════════════

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, displayName, username } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Check username uniqueness if provided
        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                passwordHash,
                displayName: displayName || email.split('@')[0],
                username: username || null,
                provider: null,
                providerId: null,
            },
        });

        // Issue tokens
        const result = await issueTokens(res, user);
        res.status(201).json(result);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Email or username already taken' });
        }
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ═══════════════════════════════════════════
// Email/Password — Login
// ═══════════════════════════════════════════

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user has a password (might be an OAuth-only account)
        if (!user.passwordHash) {
            return res.status(401).json({
                error: `This account uses ${user.provider} sign-in. Please use the "${user.provider}" button instead.`,
            });
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Issue tokens
        const result = await issueTokens(res, user);
        res.json(result);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

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
    console.log('[Auth] /refresh hit. Cookie present:', !!token);

    if (!token) {
        return res.status(401).json({ error: 'No refresh token' });
    }

    const user = await verifyRefreshToken(token);
    console.log('[Auth] Token verified in DB:', !!user);

    if (!user) {
        res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate a fresh access token without revolving the underlying refresh token database record.
    // This entirely prevents Token Rotation Race Conditions during page reloads or minor network drops.
    const accessToken = generateAccessToken(user);

    // Refresh the cookie's explicit Expiration date in the browser using the same existing token.
    res.cookie('refreshToken', token, REFRESH_COOKIE_OPTIONS);

    res.json({ accessToken, user: sanitizeUser(user) });
});

// POST /api/auth/logout — revoke refresh token
router.post('/logout', async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        await revokeRefreshToken(token);
    }

    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS });
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

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
    const { displayName, bio, username, portfolioTheme, portfolioTagline, portfolioSections } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(username !== undefined && { username }),
                ...(portfolioTheme !== undefined && { portfolioTheme }),
                ...(portfolioTagline !== undefined && { portfolioTagline }),
                ...(portfolioSections !== undefined && { portfolioSections }),
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

// PATCH /api/auth/me/password — change password
router.patch('/me/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // If user has an existing password, verify it
    if (req.user.passwordHash) {
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password is required' });
        }
        const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash },
    });

    res.json({ message: 'Password updated' });
});

export default router;
