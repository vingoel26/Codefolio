import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from '../config.js';
import prisma from '../lib/prisma.js';

/**
 * Shared handler for OAuth profile — find or create user.
 */
async function handleOAuthProfile(provider, profile) {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;
    const displayName = profile.displayName || profile.username || email?.split('@')[0];
    const avatarUrl = profile.photos?.[0]?.value || null;
    const username = profile.username || null;

    if (!email) {
        throw new Error(`No email provided by ${provider}. Please ensure your ${provider} account has a public email.`);
    }

    // Try to find existing user by provider + providerId
    let user = await prisma.user.findUnique({
        where: {
            provider_providerId: {
                provider,
                providerId,
            },
        },
    });

    if (!user) {
        // Check if a user with this email already exists (linking accounts)
        user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            // Update provider info for existing user
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    provider,
                    providerId,
                    avatarUrl: user.avatarUrl || avatarUrl,
                    displayName: user.displayName || displayName,
                },
            });
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    displayName,
                    avatarUrl,
                    provider,
                    providerId,
                },
            });
        }
    }

    return user;
}

/**
 * Configure Passport strategies.
 */
export function configurePassport() {
    // ── Google OAuth 2.0 ──
    if (config.google.clientId && config.google.clientSecret) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: config.google.clientId,
                    clientSecret: config.google.clientSecret,
                    callbackURL: config.google.callbackUrl,
                    scope: ['profile', 'email'],
                },
                async (_accessToken, _refreshToken, profile, done) => {
                    try {
                        const user = await handleOAuthProfile('google', profile);
                        done(null, user);
                    } catch (err) {
                        done(err, null);
                    }
                }
            )
        );
    }

    // ── GitHub OAuth ──
    if (config.github.clientId && config.github.clientSecret) {
        passport.use(
            new GitHubStrategy(
                {
                    clientID: config.github.clientId,
                    clientSecret: config.github.clientSecret,
                    callbackURL: config.github.callbackUrl,
                    scope: ['user:email'],
                },
                async (_accessToken, _refreshToken, profile, done) => {
                    try {
                        const user = await handleOAuthProfile('github', profile);
                        done(null, user);
                    } catch (err) {
                        done(err, null);
                    }
                }
            )
        );
    }

    // Serialization (not using sessions, but Passport requires these)
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}
