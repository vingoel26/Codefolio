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
        <div className={`chat-ui-shell ${mode === 'page' ? 'shell-page' : 'shell-widget'}`}>
            <div className="chat-layout-engine">
                {/* Secondary Sidebar (Channel List) */}
                <aside className="chat-nav-sidebar glass-panel">
                    <div className="nav-header">
                        <h3 className="nav-title">Neural Hub</h3>
                        <div className="nav-pill-switcher">
                            <button 
                                className={`pill-btn ${activeTab === 'channels' ? 'pill-active' : ''}`}
                                onClick={() => setActiveTab('channels')}
                            >
                                <Hash size={14} />
                                <span>Channels</span>
                            </button>
                            <button 
                                className={`pill-btn ${activeTab === 'messages' ? 'pill-active' : ''}`}
                                onClick={() => setActiveTab('messages')}
                            >
                                <Users size={14} />
                                <span>Direct</span>
                            </button>
                        </div>
                    </div>

                    <div className="nav-scroll-area">
                        {activeTab === 'channels' ? (
                            <div className="nav-group">
                                <span className="group-label">Global Nodes</span>
                                {CHANNELS.map((ch) => (
                                    <button
                                        key={ch.slug}
                                        className={`nav-item ${activeConversation?.slug === ch.slug ? 'nav-item-active' : ''}`}
                                        onClick={() => joinRoom(ch.slug)}
                                    >
                                        <div className="nav-item-dot" />
                                        <Hash size={16} className="nav-icon" />
                                        <span className="nav-text">{ch.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="nav-group">
                                <span className="group-label">Direct Streams</span>
                                {privateConversations.map((conv) => {
                                    const peerArr = conv.participants;
                                    if (!peerArr || peerArr.length === 0) return null;
                                    const peer = peerArr[0].user;
                                    if (!peer) return null;
                                    
                                    const isOnline = onlineUsers.includes(peer.id);
                                    return (
                                        <button
                                            key={conv.id}
                                            className={`nav-item item-dm ${activeConversation?.id === conv.id ? 'nav-item-active' : ''}`}
                                            onClick={() => joinRoom(null, conv.id)}
                                        >
                                            <div className="dm-avatar-wrapper">
                                                <div className="dm-avatar">
                                                    {peer.username[0].toUpperCase()}
                                                </div>
                                                {isOnline && <span className="dm-online-indicator" />}
                                            </div>
                                            <span className="nav-text text-truncate">{peer.username}</span>
                                        </button>
                                    );
                                })}

                                {friends.length > 0 && (
                                    <>
                                        <div className="nav-divider" />
                                        <span className="group-label">Peers</span>
                                        {friends
                                            .filter(f => !privateConversations.some(c => c.participants.some(p => p.userId === f.id)))
                                            .map(friend => {
                                                const isOnline = onlineUsers.includes(friend.id);
                                                return (
                                                    <button
                                                        key={friend.id}
                                                        className="nav-item item-dm"
                                                        onClick={() => useSocketStore.getState().getPrivateConversation(friend.id)}
                                                    >
                                                        <div className="dm-avatar-wrapper">
                                                            <div className="dm-avatar avatar-muted">
                                                                {friend.username[0].toUpperCase()}
                                                            </div>
                                                            {isOnline && <span className="dm-online-indicator" />}
                                                        </div>
                                                        <span className="nav-text text-truncate italic opacity-70">{friend.username}</span>
                                                    </button>
                                                )
                                            })
                                        }
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Pane */}
                <main className="chat-viewport">
                    {lastError && (
                        <div className="chat-system-error animate-slide-down">
                            {lastError}
                        </div>
                    )}
                    
                    {/* View Header */}
                    <div className="view-header">
                        <div className="view-header-content">
                            {activeConversation?.slug ? (
                                <>
                                    <div className="header-icon-box">
                                        <Hash size={20} className="text-accent" />
                                    </div>
                                    <div className="header-text-stack">
                                        <h2 className="header-main-title">{activeConversation.slug}</h2>
                                        <p className="header-sub-title">Global community broadcast stream</p>
                                    </div>
                                </>
                            ) : activeConversation?.peer ? (
                                <>
                                    <div className="header-avatar-box">
                                        {activeConversation.peer.username[0].toUpperCase()}
                                    </div>
                                    <div className="header-text-stack">
                                        <h2 className="header-main-title">{activeConversation.peer.displayName || activeConversation.peer.username}</h2>
                                        <p className="header-sub-title">@{activeConversation.peer.username}</p>
                                    </div>
                                </>
                            ) : (
                                <h2 className="header-main-title opacity-40">Initialize Connection...</h2>
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="messages-stream" ref={scrollRef}>
                        {activeConversation?.loading && (
                            <div className="stream-loading-shell">
                                <Loader2 size={32} className="spin text-accent" />
                                <p>Decrypting message history...</p>
                            </div>
                        )}
                        {activeConversation && (
                            (activeTab === 'channels' && activeConversation.slug) || 
                            (activeTab === 'messages' && activeConversation.peer)
                        ) ? (
                            <div className="messages-grid">
                                {activeConversation.messages?.map((msg, i) => {
                                    const isMe = String(msg.senderId) === String(user?.id);
                                    const isChannel = !!activeConversation.slug;
                                    return (
                                        <div key={msg.id || i} className={`msg-block ${isMe ? 'msg-me' : 'msg-them'}`}>
                                            <div className="msg-bubble-container">
                                                {!isMe && isChannel && <span className="msg-sender-slug">{msg.sender.username}</span>}
                                                <div className="msg-payload">
                                                    <p>{msg.content}</p>
                                                </div>
                                                <span className="msg-timestamp">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="neural-hub-empty">
                                <div className="neural-graphic-container">
                                    <svg viewBox="0 0 200 120" className="neural-svg">
                                        <defs>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                                </feMerge>
                                            </filter>
                                            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="var(--accent)" />
                                                <stop offset="100%" stopColor="var(--info)" />
                                            </linearGradient>
                                        </defs>
                                        {/* Simplified Neural Lines */}
                                        <path d="M20,60 L60,30 L100,60 L140,30 L180,60" stroke="var(--accent)" strokeWidth="0.5" fill="none" opacity="0.3" strokeDasharray="2,2" />
                                        <path d="M20,60 L60,90 L100,60 L140,90 L180,60" stroke="var(--info)" strokeWidth="0.5" fill="none" opacity="0.3" strokeDasharray="2,2" />
                                        {/* Nodes */}
                                        <circle cx="20" cy="60" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                        <circle cx="60" cy="30" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                        <circle cx="60" cy="90" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                        <circle cx="100" cy="60" r="5" fill="url(#nodeGradient)" filter="url(#glow)" className="pulse-central" />
                                        <circle cx="140" cy="30" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                        <circle cx="140" cy="90" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                        <circle cx="180" cy="60" r="4" fill="url(#nodeGradient)" filter="url(#glow)" />
                                    </svg>
                                </div>
                                <div className="empty-content-stack">
                                    <h3 className="empty-title">Neural Connection Offline</h3>
                                    <p className="empty-desc">Select a data stream from the side panel to initiate synchronized communication with your network peers.</p>
                                </div>
                            </div>
                        )}
                    </div>
 
                    {/* Control Bar */}
                    <div className="control-bar-shell">
                        <form className="control-bar-pill glass-card" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                className="control-input"
                                placeholder={activeConversation?.slug 
                                    ? `Broadcast to #${activeConversation.slug.toLowerCase()}...` 
                                    : activeConversation?.peer 
                                        ? `Direct stream to @${activeConversation.peer.username.toLowerCase()}...`
                                        : 'Select stream source...'
                                }
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={!isConnected || activeConversation?.loading}
                            />
                            <button type="submit" className="control-send-btn" disabled={!message.trim() || !isConnected}>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </main>
            </div>

            <style>{`
                .chat-ui-shell { height: 100%; width: 100%; display: flex; flex-direction: column; overflow: hidden; background: transparent; }
                
                .chat-layout-engine { flex: 1; display: flex; min-height: 0; background: var(--bg-primary); }

                /* Sidebar */
                .chat-nav-sidebar { width: 260px; display: flex; flex-direction: column; border-right: 1px solid var(--border); background: var(--bg-secondary); transition: width 0.3s ease; }
                .shell-widget .chat-nav-sidebar { width: 180px; }
                
                .nav-header { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; border-bottom: 1px solid var(--border); }
                .shell-widget .nav-header { padding: 12px 16px; gap: 8px; }
                
                .nav-title { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); text-align: center; }
                .shell-widget .nav-title { font-size: 0.6rem; letter-spacing: 0.1em; }

                .nav-pill-switcher { display: flex; background: var(--bg-tertiary); padding: 4px; border-radius: 12px; width: 100%; }
                .pill-btn { flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; color: var(--text-muted); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-size: 0.75rem; font-weight: 700; border: none; background: transparent; cursor: pointer; }
                .shell-widget .pill-btn { height: 28px; font-size: 0.65rem; gap: 4px; }
                .pill-active { background: var(--bg-secondary); color: var(--accent); box-shadow: var(--shadow-sm); }

                .nav-scroll-area { flex: 1; overflow-y: auto; padding: 12px; }
                .nav-group { margin-bottom: 32px; }
                .group-label { display: block; padding: 0 12px 12px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }

                .nav-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px; margin-bottom: 4px; color: var(--text-secondary); transition: all 0.2s; cursor: pointer; text-align: left; }
                .shell-widget .nav-item { padding: 8px 10px; border-radius: 8px; gap: 8px; }
                .nav-item-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--text-muted); opacity: 0.4; }
                .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
                .nav-item-active { background: var(--accent-subtle); color: var(--accent); font-weight: 700; border-left: 3px solid var(--accent); border-top-left-radius: 0; border-bottom-left-radius: 0; }
                .nav-item-active .nav-item-dot { background: var(--accent); opacity: 1; }
                .nav-text { font-size: 0.875rem; }
                .shell-widget .nav-text { font-size: 0.75rem; }

                .msg-sender-slug { font-size: 0.75rem; font-weight: 600; color: var(--accent); margin-bottom: 6px; margin-left: 20px; opacity: 0.8; }
                .shell-widget .msg-sender-slug { font-size: 0.65rem; margin-left: 12px; }

                /* DM specific nav */
                .dm-avatar-wrapper { position: relative; }
                .dm-avatar { width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; }
                .avatar-muted { background: var(--bg-tertiary); color: var(--text-muted); }
                .dm-online-indicator { position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; background: var(--success); border: 1.5px solid var(--bg-secondary); border-radius: 50%; }

                /* Main pane */
                .chat-viewport { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-primary); position: relative; }
                .chat-system-error { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 100; background: var(--error-bg); color: var(--error); border: 1px solid var(--error); padding: 8px 16px; border-radius: 10px; font-size: 0.8125rem; font-weight: 600; box-shadow: var(--shadow-lg); }
                
                .view-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 16px 32px; min-height: 80px; display: flex; align-items: center; }
                .shell-widget .view-header { padding: 10px 16px; min-height: 60px; }
                .view-header-content { display: flex; align-items: center; gap: 16px; width: 100%; }
                .shell-widget .view-header-content { gap: 10px; }
                .header-icon-box { width: 44px; height: 44px; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; border-radius: 12px; }
                .shell-widget .header-icon-box { width: 34px; height: 34px; border-radius: 8px; }
                .header-avatar-box { width: 44px; height: 44px; background: linear-gradient(135deg, var(--accent), var(--info)); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 800; }
                .shell-widget .header-avatar-box { width: 34px; height: 34px; font-size: 0.75rem; }
                .header-text-stack { display: flex; flex-direction: column; justify-content: center; line-height: 1.2; }
                .header-main-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }
                .shell-widget .header-main-title { font-size: 1.05rem; }
                .header-sub-title { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; margin: 4px 0 0; line-height: 1; }
                .shell-widget .header-sub-title { font-size: 0.65rem; margin-top: 2px; }

                /* Messages Area */
                .messages-stream { flex: 1; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; background: var(--bg-primary); }
                .shell-widget .messages-stream { padding: 16px 20px; }
                .stream-loading-shell { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 16px; }
                .messages-grid { display: flex; flex-direction: column; gap: 24px; }
                .shell-widget .messages-grid { gap: 16px; }
                
                .msg-block { display: flex; flex-direction: column; max-width: 75%; }
                .shell-widget .msg-block { max-width: 85%; }
                .msg-me { align-self: flex-end; }
                .msg-them { align-self: flex-start; }
                
                .msg-bubble-container { display: flex; flex-direction: column; position: relative; }
                .msg-payload { padding: 14px 20px; border-radius: 18px; font-size: 0.9375rem; line-height: 1.4; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
                .shell-widget .msg-payload { padding: 10px 14px; border-radius: 12px; font-size: 0.8125rem; }
                .msg-payload p { margin: 0; padding: 0; line-height: inherit; }
                .msg-them .msg-payload { background: var(--bg-secondary); color: var(--text-primary); border-bottom-left-radius: 4px; }
                .msg-me .msg-payload { background: var(--accent); color: white; border-color: var(--accent); border-bottom-right-radius: 4px; }
                .msg-timestamp { font-size: 0.65rem; color: var(--text-muted); margin-top: 6px; align-self: flex-start; opacity: 0.6; }
                .shell-widget .msg-timestamp { font-size: 0.6rem; margin-top: 4px; }
                .msg-me .msg-timestamp { align-self: flex-end; }

                /* Control Bar */
                .control-bar-shell { padding: 20px 32px 32px; }
                .shell-widget .control-bar-shell { padding: 12px 16px 20px; }
                .control-bar-pill { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 24px; background: var(--bg-secondary); border-radius: var(--radius-full); border: 1px solid var(--border); box-shadow: var(--shadow-md); transition: transform 0.2s ease, border-color 0.2s ease; }
                .shell-widget .control-bar-pill { padding: 8px 8px 8px 16px; gap: 8px; }
                .control-bar-pill:focus-within { border-color: var(--accent); transform: translateY(-2px); }
                .control-input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 0.9375rem; outline: none; }
                .shell-widget .control-input { font-size: 0.8125rem; }
                .control-send-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--accent); color: white; border-radius: 50%; transition: all 0.2s; }
                .shell-widget .control-send-btn { width: 32px; height: 32px; }
                .control-send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 0 15px rgba(108, 92, 231, 0.4); }
                .control-send-btn:disabled { opacity: 0.3; }

                /* Empty state Neural hub */
                .neural-hub-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px; }
                .neural-svg { width: 320px; height: auto; margin-bottom: 32px; filter: drop-shadow(0 0 15px var(--accent-glow)); }
                .empty-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; }
                .empty-desc { max-width: 480px; font-size: 1rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
                .empty-action-hint { display: flex; gap: 12px; }
                .hint-pill { font-size: 0.65rem; font-weight: 800; padding: 4px 12px; border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); }

                /* Extra animations */
                @keyframes slide-down { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes pulse-node { 0%, 100% { r: 5; opacity: 1; } 50% { r: 7; opacity: 0.7; } }
                .pulse-central { animation: pulse-node 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
