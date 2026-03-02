import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';
import prisma from './prisma.js';

/**
 * Generate a JWT access token (short-lived, 15min).
 */
export function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            username: user.username,
        },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiry }
    );
}

/**
 * Generate a refresh token (long-lived, 7 days).
 * Stored in the database for rotation and revocation.
 */
export async function generateRefreshToken(userId) {
    const token = crypto.randomBytes(64).toString('hex');

    // Parse expiry duration
    const expiresAt = new Date();
    const daysMatch = config.jwt.refreshExpiry.match(/(\d+)d/);
    if (daysMatch) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(daysMatch[1]));
    } else {
        expiresAt.setDate(expiresAt.getDate() + 7); // default 7 days
    }

    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    return token;
}

/**
 * Verify an access token and return the payload.
 */
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, config.jwt.accessSecret);
    } catch {
        return null;
    }
}

/**
 * Verify a refresh token from the database.
 * Returns the associated user if valid.
 */
export async function verifyRefreshToken(token) {
    const record = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record) return null;
    if (record.expiresAt < new Date()) {
        // Expired — clean up
        await prisma.refreshToken.delete({ where: { id: record.id } });
        return null;
    }

    return record.user;
}

/**
 * Revoke a specific refresh token.
 */
export async function revokeRefreshToken(token) {
    try {
        await prisma.refreshToken.delete({ where: { token } });
    } catch {
        // Token might not exist
    }
}

/**
 * Revoke all refresh tokens for a user (e.g., on password change / logout-all).
 */
export async function revokeAllUserTokens(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}
