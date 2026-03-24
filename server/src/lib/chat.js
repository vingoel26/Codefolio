import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerChatHandlers = (io, socket) => {
    // ── Join a conversation/room ──
    socket.on('chat:join', async ({ conversationId, slug }) => {
        try {
            let conversation;
            if (slug) {
                conversation = await prisma.conversation.findUnique({ where: { slug } });
            } else if (conversationId) {
                conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
            }

            if (!conversation) {
                return socket.emit('chat:error', { message: 'Conversation not found' });
            }

            // Join the socket.io room
            socket.join(conversation.id);


            // Fetch last 50 messages
            const messages = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                include: { sender: { select: { id: true, username: true, avatarUrl: true, displayName: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            socket.emit('chat:history', {
                conversationId: conversation.id,
                messages: messages.reverse()
            });
        } catch (err) {
            console.error('[Chat Join Error]:', err);
            socket.emit('chat:error', { message: 'Failed to join conversation' });
        }
    });

    // ── Send a message ──
    socket.on('chat:message', async ({ conversationId, content }) => {
        try {
            if (!content || !content.trim()) return;

            const message = await prisma.message.create({
                data: {
                    conversationId,
                    content,
                    senderId: socket.user.id,
                },
                include: {
                    sender: { select: { id: true, username: true, avatarUrl: true, displayName: true } }
                }
            });

            // Broadcast to all in room
            io.to(conversationId).emit('chat:message', message);
        } catch (err) {
            console.error('[Chat Message Error]:', err);
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    });

    // ── Leave a room ──
    socket.on('chat:leave', ({ conversationId }) => {
        socket.leave(conversationId);

    });

    // ── Get/List DM Conversations ──
    socket.on('chat:private:list', async () => {
        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    type: 'private',
                    participants: { some: { userId: socket.user.id } }
                },
                include: {
                    participants: {
                        where: { userId: { not: socket.user.id } },
                        include: { user: { select: { id: true, username: true, avatarUrl: true, displayName: true } } }
                    },
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });
            socket.emit('chat:private:list', conversations);
        } catch (err) {
            console.error('[Chat Private List Error]:', err);
        }
    });

    // ── Start/Join a DM with another user ──
    socket.on('chat:private:get', async ({ targetUserId }) => {
        try {
            // 1. Check mutual follow
            const isFollowing = await prisma.follows.findUnique({
                where: { followerId_followingId: { followerId: socket.user.id, followingId: targetUserId } }
            });
            const isFollowed = await prisma.follows.findUnique({
                where: { followerId_followingId: { followerId: targetUserId, followingId: socket.user.id } }
            });

            if (!isFollowing) {
                return socket.emit('chat:error', { message: 'You must follow this user to send a private message.' });
            }

            // 2. Find existing private conversation
            let conversation = await prisma.conversation.findFirst({
                where: {
                    type: 'private',
                    AND: [
                        { participants: { some: { userId: socket.user.id } } },
                        { participants: { some: { userId: targetUserId } } }
                    ]
                }
            });

            // 3. Create if not exists
            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: {
                        type: 'private',
                        participants: {
                            create: [
                                { userId: socket.user.id },
                                { userId: targetUserId }
                            ]
                        }
                    }
                });
            }

            // 4. Fetch peer info for immediate client display
            const peer = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, username: true, avatarUrl: true, displayName: true }
            });

            // 5. Return conversation info so client can join
            socket.emit('chat:private:ready', {
                conversationId: conversation.id,
                peer
            });
        } catch (err) {
            console.error('[Chat Private Get Error]:', err);
            socket.emit('chat:error', { message: 'Failed to initiate private chat.' });
        }
    });
    // ── Get list of mutual followers (Friends) ──
    socket.on('chat:private:friends', async () => {
        try {
            // Find users who I follow AND who follow me
            const friends = await prisma.user.findMany({
                where: {
                    followers: { some: { followerId: socket.user.id } }, // I follow them
                    following: { some: { followingId: socket.user.id } }  // They follow me
                },
                select: { id: true, username: true, avatarUrl: true, displayName: true }
            });
            socket.emit('chat:private:friends', friends);
        } catch (err) {
            console.error('[Chat Private Friends Error]:', err);
        }
    });
};
