import { useState, useEffect, useRef } from 'react';
import { 
    Hash, 
    Send, 
    Users,
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

export default function ChatInterface({ mode = 'widget' }) {
    const [message, setMessage] = useState('');
    const {
        isConnected,
        activeTab,
        setActiveTab,
        activeConversation,
        joinRoom,
        sendChatMessage,
        privateConversations,
        fetchPrivateConversations,
        friends,
        lastError,
        onlineUsers 
    } = useSocketStore();
    const user = useAuthStore((s) => s.user);
    const scrollRef = useRef(null);

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

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        sendChatMessage(message);
        setMessage('');
    };

    return (
        <div className={`chat-interface ${mode === 'page' ? 'chat-interface-page' : ''}`}>
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
                            {friends.length > 0 && (
                                <div className="chat-sidebar-section">
                                    <span className="section-title">Friends</span>
                                    {friends
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

                            {!privateConversations.length && !friends.length && (
                                <div className="chat-empty-state">
                                    <Users size={20} style={{opacity: 0.3}} />
                                    <p style={{fontSize: '0.65rem'}}>No DMs yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="chat-main">
                    {lastError && (
                        <div className="chat-error-toast">
                            {lastError}
                        </div>
                    )}
                    
                    {/* Chat Area Header (only in page mode) */}
                    {mode === 'page' && (
                        <div className="chat-view-header">
                            <div className="chat-header-info">
                                {activeConversation?.slug ? (
                                    <>
                                        <Hash size={20} className="text-accent" />
                                        <h2>{activeConversation.slug}</h2>
                                    </>
                                ) : activeConversation?.peer ? (
                                    <>
                                        <div className="message-avatar">
                                            {activeConversation.peer.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2>{activeConversation.peer.displayName || activeConversation.peer.username}</h2>
                                            <span className="text-xs text-muted">@{activeConversation.peer.username}</span>
                                        </div>
                                    </>
                                ) : (
                                    <h2>Select a conversation</h2>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="chat-messages" ref={scrollRef}>
                        {activeConversation?.loading && (
                            <div className="chat-loading-overlay">
                                <Loader2 size={24} className="spin text-accent" />
                                <span>Loading messages...</span>
                            </div>
                        )}
                        {activeConversation && (
                            (activeTab === 'channels' && activeConversation.slug) || 
                            (activeTab === 'messages' && activeConversation.peer)
                        ) ? (
                            activeConversation.messages?.map((msg, i) => {
                                const isMe = msg.senderId === user?.id;
                                return (
                                    <div key={msg.id || i} className={`chat-message-row ${isMe ? 'message-me' : ''}`}>
                                        <div className="message-bubble">
                                            {!isMe && <span className="message-author">{msg.sender.username}</span>}
                                            <p className="message-content">{msg.content}</p>
                                            <span className="message-time">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="chat-empty-state-main">
                                {activeTab === 'channels' ? (
                                    <>
                                        <Hash size={48} className="opacity-20 mb-4" />
                                        <h3>Community Hub</h3>
                                        <p>Select a channel to join the discussion with other developers.</p>
                                    </>
                                ) : (
                                    <>
                                        <Users size={48} className="opacity-20 mb-4" />
                                        <h3>Your Messages</h3>
                                        <p>Communicate directly with your peers and collaborators.</p>
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
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                .chat-interface {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    width: 100%;
                    background: transparent;
                    color: var(--text-primary);
                }

                .chat-interface-page {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-xl);
                    border: 1px solid var(--border);
                    overflow: hidden;
                }

                .chat-tabs {
                    display: flex;
                    padding: 4px;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    border-bottom: 1px solid var(--border);
                }

                .chat-tab {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    border-radius: var(--radius-md);
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .chat-tab-active {
                    background: var(--bg-tertiary);
                    color: var(--accent);
                }

                .chat-container { flex: 1; display: flex; min-height: 0; }

                .chat-sidebar {
                    width: 200px;
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    gap: 6px;
                    background: rgba(0,0,0,0.05);
                    overflow-y: auto;
                }

                .chat-interface-page .chat-sidebar {
                    width: 240px;
                }

                .chat-channel-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }

                .chat-channel-item:hover { background: var(--bg-hover); color: white; }
                .chat-channel-active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }

                .chat-main { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    min-width: 0;
                    background: var(--bg-primary);
                }

                .chat-view-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border);
                    background: var(--bg-secondary);
                }

                .chat-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chat-header-info h2 {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin: 0;
                }

                .chat-messages { 
                    flex: 1; 
                    padding: 24px; 
                    overflow-y: auto; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 16px; 
                }

                .chat-message-row { display: flex; flex-direction: column; max-width: 80%; }
                .message-me { align-self: flex-end; align-items: flex-end; }
                
                .message-bubble { 
                    background: var(--bg-tertiary); 
                    padding: 12px 16px; 
                    border-radius: 16px; 
                    border-bottom-left-radius: 4px;
                    font-size: 0.9375rem; 
                    position: relative;
                }

                .message-me .message-bubble { 
                    background: var(--accent); 
                    color: white; 
                    border-bottom-left-radius: 16px;
                    border-bottom-right-radius: 4px;
                }

                .message-author { 
                    display: block; 
                    font-size: 0.75rem; 
                    font-weight: 800; 
                    margin-bottom: 4px; 
                    color: var(--accent); 
                }

                .message-content { margin: 0; line-height: 1.5; }

                .message-time {
                    display: block;
                    font-size: 0.625rem;
                    margin-top: 4px;
                    opacity: 0.5;
                }

                .chat-input-area { 
                    padding: 20px 24px; 
                    border-top: 1px solid var(--border); 
                    display: flex; 
                    gap: 12px; 
                    background: var(--bg-primary);
                }

                .chat-input-area input {
                    flex: 1; 
                    background: var(--bg-tertiary); 
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg); 
                    padding: 12px 20px; 
                    font-size: 0.9375rem; 
                    color: white; 
                    outline: none;
                    transition: border-color 0.2s;
                }

                .chat-input-area input:focus { border-color: var(--accent); }

                .chat-input-area button {
                    width: 48px; 
                    height: 48px; 
                    border-radius: var(--radius-md); 
                    background: var(--accent);
                    color: white; 
                    border: none; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .chat-input-area button:hover:not(:disabled) { transform: translateY(-2px); }
                .chat-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }

                .chat-loading-overlay {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

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

                .chat-empty-state-main h3 { color: white; margin-bottom: 8px; font-size: 1.25rem; }

                .chat-sidebar-section {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--border);
                }

                .section-title {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-muted);
                    font-weight: 800;
                    padding: 0 14px;
                    margin-bottom: 8px;
                    display: block;
                }

                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                }

                .online-dot-small {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 10px;
                    height: 10px;
                    background: #10b981;
                    border: 2px solid var(--bg-secondary);
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
}
