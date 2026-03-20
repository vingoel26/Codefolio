import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocketStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    isPanelOpen: false,
    onlineUsers: [],
    activeTab: 'channels',
    conversations: [],
    privateConversations: [],
    friends: [],
    lastError: null,

    setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    setActiveTab: (tab) => {
        const { activeConversation } = get();
        // Clear active conversation if switching to a tab that doesn't match current type
        if (tab === 'messages' && activeConversation?.slug) {
            set({ activeConversation: null });
        } else if (tab === 'channels' && activeConversation?.peer) {
            set({ activeConversation: null });
        }

        // Auto-fetch friends when switching to messages
        if (tab === 'messages') {
            const { socket } = get();
            if (socket) socket.emit('chat:private:friends');
        }

        set({ activeTab: tab });
    },
    clearError: () => set({ lastError: null }),

    connect: (token) => {
        const { socket: existingSocket } = get();
        if (existingSocket?.connected) return;

        console.log('[Socket] Connecting...');
        const socket = io(SOCKET_URL, {
            auth: { token },
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected with ID:', socket.id);
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            set({ isConnected: false });
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
            set({ isConnected: false });
        });

        // Presence listeners
        socket.on('user:online', ({ userId, username }) => {
            console.log(`[Socket] Peer Online: ${username}`);
            set((state) => ({
                onlineUsers: [...new Set([...state.onlineUsers, userId])]
            }));
        });

        socket.on('user:offline', ({ userId, username }) => {
            console.log(`[Socket] Peer Offline: ${username}`);
            set((state) => ({
                onlineUsers: state.onlineUsers.filter(id => id !== userId)
            }));
        });

        // Chat listeners
        socket.on('chat:history', ({ conversationId, messages }) => {
            console.log(`[Socket] Loaded history for ${conversationId}`);
            set((state) => ({
                activeConversation: {
                    ...state.activeConversation,
                    id: conversationId,
                    messages,
                    loading: false
                }
            }));
        });

        socket.on('chat:message', (message) => {
            set((state) => {
                if (state.activeConversation?.id === message.conversationId) {
                    // Deduplicate
                    const exists = state.activeConversation.messages.some(m => m.id === message.id);
                    if (exists) return state;

                    return {
                        activeConversation: {
                            ...state.activeConversation,
                            messages: [...state.activeConversation.messages, message]
                        }
                    };
                }
                return state;
            });
        });

        socket.on('chat:error', ({ message }) => {
            console.error('[Socket Chat Error]:', message);
            set({ lastError: message });
            // Auto-clear after 4s
            setTimeout(() => set({ lastError: null }), 4000);
        });

        socket.on('chat:private:list', (list) => {
            set({ privateConversations: list });
        });

        socket.on('chat:private:ready', ({ conversationId, peer }) => {
            console.log(`[Socket] Private conversation ready: ${conversationId}`);
            set({
                activeConversation: {
                    id: conversationId,
                    messages: [],
                    loading: true,
                    peer
                }
            });
            socket.emit('chat:join', { conversationId });
            // Refresh lists
            socket.emit('chat:private:list');
            socket.emit('chat:private:friends');
        });

        socket.on('chat:private:friends', (list) => {
            set({ friends: list });
        });

        set({ socket });
    },

    joinRoom: (slug, conversationId = null) => {
        const { socket, privateConversations } = get();
        if (!socket) return;

        // Reset with meta
        const peer = conversationId ? privateConversations.find(c => c.id === conversationId)?.participants[0].user : null;

        set({
            activeConversation: {
                slug: slug || null,
                id: conversationId,
                messages: [],
                loading: true,
                peer
            }
        });

        if (slug) {
            socket.emit('chat:join', { slug });
        } else if (conversationId) {
            socket.emit('chat:join', { conversationId });
        }
    },

    fetchPrivateConversations: () => {
        const { socket } = get();
        if (socket) socket.emit('chat:private:list');
    },

    getPrivateConversation: (targetUserId) => {
        const { socket, privateConversations } = get();
        if (socket) {
            console.log(`[Socket] Requesting DM with ${targetUserId}`);
            socket.emit('chat:private:get', { targetUserId });

            // Proactively set loading state for the target
            const existing = privateConversations.find(c => c.participants.some(p => p.userId === targetUserId));
            set({
                isPanelOpen: true,
                activeTab: 'messages',
                activeConversation: {
                    id: existing?.id || null,
                    messages: existing?.messages || [],
                    loading: true,
                    peer: existing?.participants[0].user || { username: 'User...' } // placeholder
                }
            });
        }
    },

    sendChatMessage: (content) => {
        const { socket, activeConversation } = get();
        if (!socket || !activeConversation?.id) return;
        socket.emit('chat:message', {
            conversationId: activeConversation.id,
            content
        });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false, onlineUsers: [] });
        }
    },
}));
