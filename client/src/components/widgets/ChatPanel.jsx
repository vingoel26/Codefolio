import { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, 
    Hash, 
    Send, 
    X, 
    Users,
    Maximize2,
    Move,
    Loader2
} from 'lucide-react';
import { useSocketStore } from '../../stores/socketStore';
import { useAuthStore } from '../../stores/authStore';

const CHANNELS = [
    { name: 'General', slug: 'general' },
    { name: 'LeetCode', slug: 'leetcode' },
    { name: 'Codeforces', slug: 'codeforces' },
    { name: 'CodeChef', slug: 'codechef' },
    { name: 'GeeksforGeeks', slug: 'gfg' },
];

export default function ChatPanel() {
    const [message, setMessage] = useState('');
    
    // Position and Size state
    const [pos, setPos] = useState({ x: window.innerWidth - 500, y: 100 });
    const [size, setSize] = useState({ width: 450, height: 650 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const { 
        isConnected, 
        isPanelOpen: isOpen,
        setPanelOpen: setIsOpen,
        activeTab,
        setActiveTab,
        activeConversation, 
        joinRoom, 
        sendChatMessage,
        privateConversations,
        fetchPrivateConversations,
        onlineUsers 
    } = useSocketStore();
    const user = useAuthStore((s) => s.user);
    
    const scrollRef = useRef(null);
    const dragRef = useRef(null);
    const panelRef = useRef(null);

    // Fetch DMs when tab switches to 'messages'
    useEffect(() => {
        if (activeTab === 'messages' && isConnected) {
            fetchPrivateConversations();
        }
    }, [activeTab, isConnected, fetchPrivateConversations]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeConversation?.messages]);

    useEffect(() => {
        if (isOpen && !activeConversation) {
            joinRoom('general');
        }
    }, [isOpen, activeConversation, joinRoom]);

    // Dragging Logic
    const onMouseDownDrag = (e) => {
        if (e.target.closest('.chat-close-btn')) return;
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX - pos.x,
            startY: e.clientY - pos.y
        };
    };

    // Resizing Logic
    const onMouseDownResize = (e) => {
        e.preventDefault();
        setIsResizing(true);
        dragRef.current = {
            startW: size.width,
            startH: size.height,
            startX: e.clientX,
            startY: e.clientY
        };
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (isDragging) {
                setPos({
                    x: e.clientX - dragRef.current.startX,
                    y: e.clientY - dragRef.current.startY
                });
            }
            if (isResizing) {
                const deltaX = e.clientX - dragRef.current.startX;
                const deltaY = e.clientY - dragRef.current.startY;
                setSize({
                    width: Math.max(300, dragRef.current.startW + deltaX),
                    height: Math.max(400, dragRef.current.startH + deltaY)
                });
            }
        };

        const onMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, isResizing]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        sendChatMessage(message);
        setMessage('');
    };

    return (
        <>
            {!isOpen && (
                <button 
                    className="chat-toggle-btn"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageSquare size={20} />
                    {isConnected && <span className="online-indicator" />}
                </button>
            )}

            <aside 
                ref={panelRef}
                className={`chat-panel-v2 ${isOpen ? 'chat-panel-v2-open' : ''}`}
                style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`
                }}
            >
                {/* Drag Handle Header */}
                <div className="chat-header" onMouseDown={onMouseDownDrag} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                    <div className="chat-header-title">
                        <Move size={14} className="opacity-50" />
                        <MessageSquare size={18} className="text-accent" />
                        <span>
                            {activeConversation?.slug 
                                ? `@${activeConversation.slug}` 
                                : activeConversation?.peer 
                                    ? `Message @${activeConversation.peer.username}`
                                    : 'Community Chat'}
                        </span>
                    </div>
                    <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                <div className="chat-tabs">
                    <button 
                        className={`chat-tab ${activeTab === 'channels' ? 'chat-tab-active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                    >
                        <Hash size={14} />
                        Channels
                    </button>
                    <button 
                        className={`chat-tab ${activeTab === 'messages' ? 'chat-tab-active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        <Users size={14} />
                        Direct
                    </button>
                </div>

                <div className="chat-container">
                    <div className="chat-sidebar">
                        {activeTab === 'channels' ? (
                            CHANNELS.map((ch) => (
                                <button
                                    key={ch.slug}
                                    className={`chat-channel-item ${activeConversation?.slug === ch.slug ? 'chat-channel-active' : ''}`}
                                    onClick={() => joinRoom(ch.slug)}
                                >
                                    <Hash size={14} />
                                    <span>{ch.name}</span>
                                </button>
                            ))
                        ) : (
                        <div className="chat-dm-list">
                                {privateConversations.map((conv) => {
                                    const peerArr = conv.participants;
                                    if (!peerArr || peerArr.length === 0) return null;
                                    const peer = peerArr[0].user;
                                    if (!peer) return null;
                                    
                                    const isOnline = onlineUsers.includes(peer.id);
                                    return (
                                        <button
                                            key={conv.id}
                                            className={`chat-channel-item ${activeConversation?.id === conv.id ? 'chat-channel-active' : ''}`}
                                            onClick={() => joinRoom(null, conv.id)}
                                        >
                                            <div className="relative">
                                                <div className="message-avatar" style={{width: 20, height: 20, fontSize: '0.5rem'}}>
                                                    {peer.username[0].toUpperCase()}
                                                </div>
                                                {isOnline && <span className="online-dot-small" />}
                                            </div>
                                            <span className="truncate">{peer.username}</span>
                                        </button>
                                    );
                                })}

                                {/* Friends Section */}
                                {useSocketStore.getState().friends.length > 0 && (
                                    <div className="chat-sidebar-section">
                                        <span className="section-title">Friends</span>
                                        {useSocketStore.getState().friends
                                            .filter(f => !privateConversations.some(c => c.participants.some(p => p.userId === f.id)))
                                            .map(friend => {
                                                const isOnline = onlineUsers.includes(friend.id);
                                                return (
                                                    <button
                                                        key={friend.id}
                                                        className="chat-channel-item opacity-70 hover:opacity-100"
                                                        onClick={() => useSocketStore.getState().getPrivateConversation(friend.id)}
                                                    >
                                                        <div className="relative">
                                                            <div className="message-avatar" style={{width: 20, height: 20, fontSize: '0.5rem', background: 'var(--bg-tertiary)'}}>
                                                                {friend.username[0].toUpperCase()}
                                                            </div>
                                                            {isOnline && <span className="online-dot-small" />}
                                                        </div>
                                                        <span className="truncate">{friend.username}</span>
                                                    </button>
                                                )
                                            })
                                        }
                                    </div>
                                )}

                                {!privateConversations.length && !useSocketStore.getState().friends.length && (
                                    <div className="chat-empty-state">
                                        <Users size={20} style={{opacity: 0.3}} />
                                        <p style={{fontSize: '0.65rem'}}>No DMs or mutual friends yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="chat-main">
                        {useSocketStore.getState().lastError && (
                            <div className="chat-error-toast">
                                {useSocketStore.getState().lastError}
                            </div>
                        )}
                        <div className="chat-messages" ref={scrollRef}>
                            {activeConversation?.loading && (
                                <div className="chat-loading-overlay">
                                    <Loader2 size={20} className="spin" />
                                    <span>Loading messages...</span>
                                </div>
                            )}
                            {activeConversation ? (
                                activeConversation.messages?.map((msg, i) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id || i} className={`chat-message-row ${isMe ? 'message-me' : ''}`}>
                                            <div className="message-bubble">
                                                {!isMe && <span className="message-author">{msg.sender.username}</span>}
                                                <p className="message-content">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="chat-empty-state-main">
                                    {activeTab === 'channels' ? (
                                        <>
                                            <Hash size={40} className="opacity-20 mb-4" />
                                            <h3>Welcome to Community Chat</h3>
                                            <p>Select a channel from the left to start talking.</p>
                                        </>
                                    ) : (
                                        <>
                                            <Users size={40} className="opacity-20 mb-4" />
                                            <h3>Direct Messages</h3>
                                            <p>Select a friend from the list or go to their profile to start a chat.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
 
                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder={activeConversation?.slug 
                                    ? `Message #${activeConversation.slug}...` 
                                    : activeConversation?.peer 
                                        ? `Message @${activeConversation.peer.username}...`
                                        : 'Type a message...'
                                }
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={!isConnected || activeConversation?.loading}
                            />
                            <button type="submit" disabled={!message.trim() || !isConnected}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Resize Handle */}
                <div className="resize-handle" onMouseDown={onMouseDownResize}>
                    <Maximize2 size={12} className="rotate-90 pointer-events-none" />
                </div>
            </aside>

            <style>{`
                .chat-toggle-btn {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius-full);
                    background: var(--accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                    border: none;
                    z-index: 100;
                    transition: transform var(--transition-base);
                }

                .chat-toggle-btn:hover { transform: scale(1.05); }

                .chat-panel-v2 {
                    position: fixed;
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    display: none;
                    flex-direction: column;
                    z-index: 1000;
                    box-shadow: var(--shadow-2xl);
                    overflow: hidden;
                    user-select: none;
                }

                .chat-panel-v2-open {
                    display: flex;
                }

                .chat-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border);
                    background: rgba(0,0,0,0.2);
                }

                .chat-header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .chat-close-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: var(--radius-sm);
                }

                .chat-close-btn:hover { background: var(--bg-hover); color: white; }

                .chat-tabs {
                    display: flex;
                    padding: 4px;
                    gap: 2px;
                    background: rgba(0,0,0,0.3);
                }

                .chat-tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                }

                .chat-tab-active {
                    background: var(--bg-tertiary);
                    color: var(--accent);
                }

                .chat-container { flex: 1; display: flex; min-height: 0; }

                .chat-sidebar {
                    width: 140px;
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    padding: 8px;
                    gap: 4px;
                    background: rgba(0,0,0,0.1);
                    overflow-y: auto;
                }

                .chat-channel-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 10px;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                }

                .chat-channel-item:hover { background: var(--bg-hover); }
                .chat-channel-active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }

                .online-dot-small {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border: 1.5px solid var(--bg-secondary);
                    border-radius: 50%;
                }

                .chat-dm-list { display: flex; flex-direction: column; gap: 4px; }

                .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                .chat-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }

                .chat-empty-state-main {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    padding: 40px;
                    color: var(--text-muted);
                }

                .chat-empty-state-main h3 { color: white; margin-bottom: 8px; font-size: 1rem; }
                .chat-empty-state-main p { font-size: 0.8125rem; }

                .chat-message-row { display: flex; max-width: 85%; }
                .message-me { align-self: flex-end; }
                .message-bubble { background: var(--bg-tertiary); padding: 8px 12px; border-radius: 12px; font-size: 0.8125rem; }
                .message-me .message-bubble { background: var(--accent); color: white; }
                .message-author { display: block; font-size: 0.625rem; font-weight: 800; margin-bottom: 2px; color: var(--accent); }
                .message-me .message-author { display: none; }

                .chat-sidebar-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .section-title {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    font-weight: 800;
                    padding: 0 10px;
                    margin-bottom: 4px;
                }

                .chat-error-toast {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    right: 8px;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: var(--radius-md);
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-align: center;
                    z-index: 50;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .chat-input-area { padding: 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; position: relative; }
                .chat-input-area input {
                    flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border);
                    border-radius: var(--radius-full); padding: 8px 16px; font-size: 0.8125rem; color: white; outline: none;
                }
                .chat-input-area input:focus { border-color: var(--accent); }
                .chat-input-area button {
                    width: 32px; height: 32px; border-radius: 50%; background: var(--accent);
                    color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
                }

                .resize-handle {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 20px;
                    height: 20px;
                    cursor: nwse-resize;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 2px;
                    color: var(--text-muted);
                    opacity: 0.5;
                }
                .resize-handle:hover { color: var(--accent); opacity: 1; }
            `}</style>
        </>
    );
}
