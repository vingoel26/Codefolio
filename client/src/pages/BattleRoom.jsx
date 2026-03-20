import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocketStore } from '../stores/socketStore';
import { useAuthStore } from '../stores/authStore';
import { Swords, Loader2, ExternalLink, Trophy, AlertCircle, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function BattleRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const { socket: io, setActiveTab, activeConversation } = useSocketStore();
    
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liveVerdicts, setLiveVerdicts] = useState({}); // { userId: { verdict, testset, passedTestCount, timestamp } }

    useEffect(() => {
        if (!io) return; // Wait until connection is ready

        const fetchMatch = async () => {
            try {
                const res = await fetch(`${API_URL}/battles/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load match');
                
                setMatch(data);

                // Check if user explicitly selected a handle via URL query match
                const searchParams = new URLSearchParams(window.location.search);
                const cfHandle = searchParams.get('handle');
                
                io.emit('battle:join', { matchId: id, cfHandle });
                
                useSocketStore.getState().joinRoom(null, data.conversationId);
                setActiveTab('messages'); 
            } catch (err) {
                setError('Failed to load battle room');
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();

        // Socket Listeners
        const handleStateUpdate = (updatedMatch) => {
            setMatch(updatedMatch);
        };

        const handleSubmission = (data) => {
            // data: { userId, verdict, testset, passedTestCount }
            setLiveVerdicts(prev => ({
                ...prev,
                [data.userId]: { ...data, timestamp: Date.now() }
            }));
        };

        const handleCompleted = (updatedMatch) => {
            setMatch(updatedMatch);
            // Could show a giant celebration animation here
        };

        const handleError = (msg) => {
            setError(msg);
        };

        io.on('battle:state', handleStateUpdate);
        io.on('battle:started', handleStateUpdate);
        io.on('battle:playerJoined', (player) => {
            setMatch(prev => {
                if (!prev) return prev;
                if (prev.players.some(p => p.userId === player.userId)) return prev;
                return { ...prev, players: [...prev.players, player] };
            });
        });
        io.on('battle:submission', handleSubmission);
        io.on('battle:completed', handleCompleted);
        io.on('battle:error', handleError);

        return () => {
            io.off('battle:state', handleStateUpdate);
            io.off('battle:started', handleStateUpdate);
            io.off('battle:playerJoined');
            io.off('battle:submission', handleSubmission);
            io.off('battle:completed', handleCompleted);
            io.off('battle:error', handleError);
        };
    }, [id, io, setActiveTab]);

    if (loading) return <div className="flex-center h-screen"><Loader2 size={40} className="spin text-accent" /></div>;
    if (error) return <div className="flex-center h-screen flex-col"><AlertCircle size={40} className="text-error mb-4"/><h2>{error}</h2><button className="btn-secondary mt-4" onClick={() => navigate('/arena')}>Back to Arena</button></div>;
    if (!match) return null;

    const isPlayer = match.players.some(p => p.userId === user?.id);
    const player1 = match.players[0];
    const player2 = match.players[1];

    const renderPlayerDeck = (player, label) => {
        if (!player) return (
            <div className="player-deck empty">
                <div className="spinner-pulse"><RefreshCw className="spin opacity-30" size={32} /></div>
                <p>Waiting for {label}...</p>
            </div>
        );

        const isWinner = match.winnerId === player.userId;
        const liveStatus = liveVerdicts[player.userId];

        return (
            <div className={`player-deck ${isWinner ? 'winner' : ''}`}>
                <div className="deck-header">
                    <img src={player.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.user.username}`} alt="" className="deck-avatar" />
                    <div>
                        <h3>{player.user.displayName || player.user.username}</h3>
                        <p className="text-muted text-sm">@{player.user.username}</p>
                    </div>
                </div>
                
                <div className="deck-status-area">
                    {isWinner ? (
                        <div className="win-banner">
                            <Trophy size={48} />
                            <h2>VICTOR</h2>
                        </div>
                    ) : match.status === 'IN_PROGRESS' ? (
                        <div className="live-feed">
                            <h4 className="flex items-center gap-2 mb-4 text-sm text-muted uppercase tracking-wider">
                                <span className="online-dot-small relative"></span> Live Status
                            </h4>
                            {liveStatus ? (
                                <div className={`verdict-box ${liveStatus.verdict === 'OK' ? 'ac' : 'wa'}`}>
                                    <span className="verdict-word">{liveStatus.verdict === 'OK' ? 'Accepted' : liveStatus.verdict}</span>
                                    {liveStatus.verdict !== 'OK' && liveStatus.passedTestCount > 0 && (
                                        <span className="test-count">on test {liveStatus.passedTestCount + 1}</span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted text-center italic py-8 opacity-50">Coding...</p>
                            )}
                        </div>
                    ) : match.status === 'WAITING' ? (
                        <div className="deck-placeholder flex-center h-full">
                            <p className="text-muted uppercase tracking-widest text-xs">Ready</p>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <div className="battle-room-layout">
            <div className="battle-main-content">
                <header className="room-header">
                    <div className="room-header-left">
                        <button className="btn-secondary btn-sm mr-4" onClick={() => navigate('/arena')}>← Leave</button>
                        <h1 className="text-xl font-bold flex items-center gap-3">
                            <Swords className="text-accent" /> 
                            {match.problemName}
                            <span className="badge-difficulty">★ {match.difficulty || 'N/A'}</span>
                        </h1>
                    </div>
                    {match.status === 'IN_PROGRESS' && (
                        <a href={match.problemLink} target="_blank" rel="noreferrer" className="btn-primary">
                            Solve on Codeforces <ExternalLink size={16} className="ml-2" />
                        </a>
                    )}
                </header>

                <div className="arena-stage">
                    {match.status === 'WAITING' && (
                        <div className="waiting-banner">
                            <Loader2 className="spin mr-3" /> Waiting for players to join...
                        </div>
                    )}
                    
                    <div className="players-container">
                        {renderPlayerDeck(player1, "Player 1")}
                        <div className="vs-divider"><h1>VS</h1></div>
                        {renderPlayerDeck(player2, "Player 2")}
                    </div>
                </div>
            </div>

            <div className="battle-sidebar">
                <div className="spectator-chat-box">
                    <div className="chat-box-header">Live Commentary</div>
                    <div className="chat-wrapper">
                        {/* We reuse ChatInterface but force it to show solely messages for the current room */}
                        {/* By virtue of having joined the room in socketStore, it should act just like a DM if we hack it, OR we just let the floating ChatPanel do its thing. */}
                        {/* Actually, it's better to implement a simple standalone chat log here linked to the match.conversationId to keep it completely isolated from the main DM tabs. */}
                        <IsolatedRoomChat conversationId={match.conversationId} />
                    </div>
                </div>
            </div>

            <style>{`
                .battle-room-layout {
                    display: flex;
                    height: calc(100vh - 64px); /* assuming navbar height */
                    background: var(--bg-primary);
                }
                .battle-main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .room-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border);
                }
                .room-header-left { display: flex; align-items: center; }
                .badge-difficulty {
                    font-size: 0.75rem;
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--warning);
                    padding: 4px 8px;
                    border-radius: var(--radius-sm);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }
                .arena-stage {
                    flex: 1;
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .waiting-banner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    border-radius: var(--radius-lg);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    margin-bottom: 32px;
                    font-weight: 600;
                }
                .players-container {
                    flex: 1;
                    display: flex;
                    gap: 32px;
                    position: relative;
                }
                .player-deck {
                    flex: 1;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-2xl);
                    border: 2px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.3s;
                }
                .player-deck.empty {
                    border: 2px dashed var(--border);
                    background: transparent;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                }
                .deck-header {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: rgba(0,0,0,0.2);
                    border-bottom: 1px solid var(--border);
                }
                .deck-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: var(--radius-xl);
                    background: var(--bg-tertiary);
                }
                .deck-header h3 { font-size: 1.5rem; margin: 0; }
                .deck-status-area {
                    flex: 1;
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                }
                .player-deck.winner {
                    border-color: var(--success);
                    box-shadow: 0 0 40px rgba(16, 185, 129, 0.1);
                }
                .win-banner {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--success);
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .win-banner h2 { font-size: 2.5rem; margin-top: 16px; letter-spacing: 0.1em; }
                @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                
                .verdict-box {
                    padding: 20px;
                    border-radius: var(--radius-lg);
                    text-align: center;
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-top: auto;
                    margin-bottom: auto;
                    animation: pulse 2s infinite;
                }
                .verdict-box.ac { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 2px solid var(--success); animation: none; }
                .verdict-box.wa { background: rgba(239, 68, 68, 0.1); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.3); }
                .test-count { display: block; font-size: 0.875rem; opacity: 0.7; margin-top: 4px; font-weight: 500; }
                
                .vs-divider {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 80px;
                    height: 80px;
                    background: var(--bg-primary);
                    border: 4px solid var(--border);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                }
                .vs-divider h1 { font-style: italic; font-weight: 900; color: var(--text-muted); margin: 0; }

                .battle-sidebar {
                    width: 320px;
                    border-left: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-secondary);
                }
                .spectator-chat-box { flex: 1; display: flex; flex-direction: column; }
                .chat-box-header {
                    padding: 16px 20px;
                    font-weight: 700;
                    border-bottom: 1px solid var(--border);
                    background: rgba(0,0,0,0.2);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 0.8125rem;
                    color: var(--text-muted);
                }
                .chat-wrapper { flex: 1; position: relative; display: flex; flex-direction: column; }
            `}</style>
        </div>
    );
}

function IsolatedRoomChat({ conversationId }) {
    const { socket: io, sendChatMessage } = useSocketStore();
    const user = useAuthStore(s => s.user);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!io || !conversationId) return;

        // Listen for new messages targeting this conversation
        const handleNewMessage = (msg) => {
            if (msg.conversationId === conversationId) {
                setMessages(prev => [...prev, msg]);
            }
        };

        io.on('chat:newMessage', handleNewMessage);

        // Fetch history via REST
        fetch(`${API_URL}/users/conversations/${conversationId}`, {
            headers: { 'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}` }
        })
           .then(res => res.json())
           .then(data => setMessages(data.messages || []))
           .catch(() => {});

        return () => io.off('chat:newMessage', handleNewMessage);
    }, [conversationId, io]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        // Use the global store's socket payload directly for simplicity in isolated component
        if (io) {
            io.emit('chat:sendMessage', { conversationId, content: input.trim() });
        }
        setInput('');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <span className="text-[10px] text-accent font-bold mb-1">{msg.sender?.username}</span>}
                            <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${isMe ? 'bg-accent text-white rounded-br-sm' : 'bg-[var(--bg-tertiary)] rounded-bl-sm'}`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-[var(--border)] flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 bg-[var(--bg-tertiary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 ring-accent"
                />
            </form>
        </div>
    );
}
