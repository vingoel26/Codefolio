import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config.js';

import { registerChatHandlers } from './chat.js';
import { registerBattleHandlers } from '../socket/battleHandler.js';

let io;
const onlineUsers = new Map(); // userId -> Set of socketIds (to handle multiple tabs)

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: config.clientUrl || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ── Authentication Middleware ──
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret);
            socket.user = {
                id: decoded.sub,
                email: decoded.email,
                username: decoded.username
            };
            next();
        } catch (err) {
            console.error('[Socket Auth] Invalid token:', err.message);
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // ── Connection Logic ──
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const username = socket.user.username;



        // Track presence
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
            // Notify neighbors/followers here in Step 16
            io.emit('user:online', { userId, username });
        }
        onlineUsers.get(userId).add(socket.id);

        // ── Register Feature Handlers ──
        registerChatHandlers(io, socket);
        registerBattleHandlers(io, socket);

        // Standard handlers
        socket.on('disconnect', () => {


            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user:offline', { userId, username });
                }
            }
        });

        // Error handling
        socket.on('error', (err) => {
            console.error('[Socket Error]:', err);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};
