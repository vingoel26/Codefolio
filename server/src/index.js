import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { configurePassport } from './lib/passport.js';
import { initSocket } from './lib/socket.js';
import { seedDatabase } from './lib/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';
import snippetsRouter from './routes/snippets.js';
import feedRouter from './routes/feed.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import focusRoutes from './routes/focus.js';
import badgeRoutes from './routes/badges.js';
import battlesRouter from './routes/battles.js';
import aiRouter from './routes/ai.js';
import contestsRouter from './routes/contests.js';

import config from './config.js'; // Keep config for server start logs

const app = express();
const httpServer = createServer(app);

// ── Socket.io Setup ──
initSocket(httpServer);

// ── Middleware ──
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '5mb' })); // Increased for rich-text content
app.use(cookieParser());
configurePassport();
app.use(passport.initialize());

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/snippets', snippetsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes); // Comments are nested under /api/posts/:postId/comments
app.use('/api/focus', focusRoutes);
app.use('/api/badge', badgeRoutes);
app.use('/api/battles', battlesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contests', contestsRouter);

// Database seed (development only)
// ── Global Error Handler ──
app.use((err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

// ── Start Server ──
httpServer.listen(config.port, async () => {
    if (config.nodeEnv === 'development') {
        await seedDatabase();
    }
    console.log(`\n  🚀 Codefolio API running at http://localhost:${config.port}`);
    console.log(`  📡 Health check: http://localhost:${config.port}/api/health`);
    console.log(`  🌐 Client URL: ${config.clientUrl}`);
    console.log(`  🔑 Google OAuth: ${config.google.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  🔑 GitHub OAuth: ${config.github.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  📦 Environment: ${config.nodeEnv}\n`);
});

export default app;
