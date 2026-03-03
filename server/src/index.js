import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import config from './config.js';
import { configurePassport } from './lib/passport.js';
import { startCron } from './lib/cron.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';
import snippetRoutes from './routes/snippets.js';

const app = express();

// ── Core Middleware ──
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: config.clientUrl,
        credentials: true, // Allow cookies
    })
);

// ── Passport ──
configurePassport();
app.use(passport.initialize());

// ── Health Check ──
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: config.nodeEnv,
    });
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/snippets', snippetRoutes);

// ── Global Error Handler ──
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
});

// ── Start Server ──
app.listen(config.port, () => {
    console.log(`\n  🚀 Codefolio API running at http://localhost:${config.port}`);
    console.log(`  📡 Health check: http://localhost:${config.port}/api/health`);
    console.log(`  🌐 Client URL: ${config.clientUrl}`);
    console.log(`  🔑 Google OAuth: ${config.google.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  🔑 GitHub OAuth: ${config.github.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  📦 Environment: ${config.nodeEnv}\n`);
    startCron();
});

export default app;
