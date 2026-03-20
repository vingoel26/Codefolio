import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { configurePassport } from './lib/passport.js';
import { startCron } from './lib/cron.js';
import { initSocket } from './lib/socket.js';
import { seedDatabase } from './lib/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';
import snippetRoutes from './routes/snippets.js';
import feedRoutes from './routes/feed.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import focusRoutes from './routes/focus.js';
import badgeRoutes from './routes/badges.js';
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
app.use('/api/snippets', snippetRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes); // Comments are nested under /api/posts/:postId/comments
app.use('/api/focus', focusRoutes);
app.use('/api/badge', badgeRoutes);

// ── Global Error Handler ──
app.use((err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

// ── Start Server ──
httpServer.listen(config.port, async () => {
    await seedDatabase();
    console.log(`\n  🚀 Codefolio API running at http://localhost:${config.port}`);
    console.log(`  📡 Health check: http://localhost:${config.port}/api/health`);
    console.log(`  🌐 Client URL: ${config.clientUrl}`);
    console.log(`  🔑 Google OAuth: ${config.google.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  🔑 GitHub OAuth: ${config.github.clientId ? '✓ configured' : '✗ not configured'}`);
    console.log(`  📦 Environment: ${config.nodeEnv}\n`);
    startCron();
});

export default app;
