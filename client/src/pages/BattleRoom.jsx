import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    const [liveVerdicts, setLiveVerdicts] = useState({});
    const [timeLeft, setTimeLeft] = useState(null); 
    const [showEntryProtocol, setShowEntryProtocol] = useState(false);
    const [linkedCFAccounts, setLinkedCFAccounts] = useState([]);
    const [confirmedHandle, setConfirmedHandle] = useState(null);

    // Timer Logic
    useEffect(() => {
        if (!match || match.status !== 'IN_PROGRESS' || !match.startTime) return;

        const calculateTime = () => {
            const start = new Date(match.startTime).getTime();
            const durationMs = (match.duration || 60) * 60 * 1000;
            const end = start + durationMs;
            const remaining = Math.max(0, end - Date.now());
            
            if (remaining === 0) return "00:00:00";
            
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTime());
        const timer = setInterval(() => {
            const next = calculateTime();
            setTimeLeft(next);
            if (next === "00:00:00") clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [match]);

    useEffect(() => {
        if (!io) return;

        const fetchMatch = async () => {
            try {
                const res = await fetch(`${API_URL}/battles/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load match');
                setMatch(data);

                const searchParams = new URLSearchParams(window.location.search);
                const cfHandle = searchParams.get('handle') || confirmedHandle;
                
                // If user is a player but has NO handle confirmed yet, we need to prompt
                const currentPlayer = data.players.find(p => p.userId === user?.id);
                if (currentPlayer && !currentPlayer.cfHandle && !cfHandle) {
                    setShowEntryProtocol(true);
                    // Fetch accounts for the modal
                    const accRes = await fetch(`${API_URL}/users/linked-accounts`, {
                        headers: { 'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}` }
                    });
                    if (accRes.ok) {
                        const accData = await accRes.json();
                        setLinkedCFAccounts(accData.accounts.filter(a => a.platform === 'codeforces'));
                    }
                    setLoading(false);
                    return;
                }

                io.emit('battle:join', { matchId: id, cfHandle });
                
                useSocketStore.getState().joinRoom(null, data.conversationId);
                setActiveTab('messages'); 
            } catch (err) {
                setError('Match not found or access denied.');
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();

        const handleStateUpdate = (u) => setMatch(u);
        const handleSubmission = (d) => setLiveVerdicts(prev => ({ ...prev, [d.userId]: { ...d, timestamp: Date.now() } }));
        const handleCompleted = (u) => setMatch(u);
        const handleError = (m) => setError(m);

        io.on('battle:state', handleStateUpdate);
        io.on('battle:started', handleStateUpdate);
        io.on('battle:playerJoined', (p) => setMatch(prev => prev && !prev.players.find(x => x.userId === p.userId) ? { ...prev, players: [...prev.players, p] } : prev));
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

    if (loading) return <div className="flex-center h-screen bg-[#0a0a0f]"><Loader2 size={40} className="spin text-accent" /></div>;
    if (error) return <div className="flex-center h-screen bg-[#0a0a0f] flex-col px-6 text-center"><AlertCircle size={40} className="text-error mb-4"/><h2>{error}</h2><button className="btn-secondary mt-8" onClick={() => navigate('/arena')}>Abort to Lobby</button></div>;
    if (!match) return null;

    const isPlayer = match.players.some(p => p.userId === user?.id);
    const p1 = match.players[0];
    const p2 = match.players[1];

    const isMatchHost = p1?.userId === user?.id;
    const isWaiting = match.status === 'WAITING';

    const renderTacticalDeck = (player, label) => {
        if (!player) return (
            <div className="tactical-deck empty">
                <div className="deck-ruler"></div>
                <div className="scanning-line"></div>
                <div className="flex flex-col items-center">
                   <Loader2 className="spin text-accent mb-4 opacity-40" size={40} />
                   <span className="deck-tag">Searching for Opponent...</span>
                </div>
            </div>
        );

        const isWin = match.winnerId === player.userId;
        const live = liveVerdicts[player.userId];

        return (
            <div className={`tactical-deck ${isWin ? 'victory-glow' : ''}`}>
                <div className="deck-ruler" style={{ background: isWin ? 'var(--success)' : 'var(--accent)' }}></div>
                <div className="deck-header-v5">
                    <img src={player.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.user.username}`} alt="" className="deck-avatar-v5" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                           <span className="deck-tag">Combatant Identified</span>
                           {isWin && <span className="victory-tag">Superior Performance</span>}
                        </div>
                        <h3 className="deck-name-v5">{player.user.displayName || player.user.username}</h3>
                        <div className="handle-pill-v5">ID: {player.cfHandle || 'N/A'}</div>
                    </div>
                </div>
                
                <div className="deck-telemetry-v5">
                    {isWin ? (
                        <div className="victory-screen animate-fade-in">
                            <Trophy size={64} className="text-success mb-2" />
                            <h2 className="text-success font-black tracking-widest text-3xl">VICTOR</h2>
                            <p className="text-[10px] text-success/60 uppercase mt-2 tracking-[0.3em]">Match Analysis: Complete</p>
                        </div>
                    ) : match.status === 'IN_PROGRESS' || match.status === 'COMPLETED' ? (
                        <div className="live-telemetry">
                            <div className="flex items-center justify-between mb-6">
                               <span className="text-[10px] items-center flex gap-2 font-black text-muted tracking-widest leading-none">
                                   <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span> SYSTEM LINK ACTIVE
                               </span>
                               <span className="font-mono text-[10px] opacity-40">UTC-{new Date().getHours()}:55</span>
                            </div>
                            {live ? (
                                <div className={`verdict-display ${live.verdict === 'OK' ? 'ac' : 'wa'}`}>
                                    <h2 className="text-2xl font-black mb-1">{live.verdict === 'OK' ? 'ACCEPTED' : live.verdict}</h2>
                                    <p className="text-[10px] opacity-70 uppercase tracking-widest">
                                        Test: {live.passedTestCount + 1} / <span className="opacity-40">{live.testset || '??'}</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="coding-loader">
                                    <div className="coding-bar"></div>
                                    <span className="text-xs font-bold text-muted animate-pulse">TRANSMITTING SOLUTIONS...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-center h-full opacity-30">
                            <span className="text-xs font-black tracking-[0.5em] text-muted">AWAITING COMMENCEMENT</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="arena-v6-layout">
            <div className="arena-v6-main">
                <header className="arena-v6-nav">
                    <div className="flex items-center gap-8">
                        <button className="v6-btn-back" onClick={() => navigate('/arena')}>LOBBY EXIT</button>
                        <div className="node-info">
                            <div className="flex items-center gap-3">
                               <span className="hud-label-v6">Room-ID:</span>
                               <span className="font-mono text-xs opacity-60">CFX-{match.id.slice(0,8).toUpperCase()}</span>
                                <div className={`status-v5 ${match.status.toLowerCase()}`}>
                                    {isWaiting ? 'WAITING FOR OPPONENT' : match.status === 'IN_PROGRESS' ? 'LIVE COMBAT' : 'ARCHIVED'}
                                </div>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-4">
                                <Swords className="text-accent" /> 
                                {isWaiting ? 'DECRYPTING NODE DATA...' : match.problemName}
                                <span className="v6-difficulty">RANK {match.difficulty || '???'}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-12">
                         {!isWaiting && match.status !== 'CANCELLED' && timeLeft && (
                             <div className="v6-timer">
                                 <span className="hud-label-v6 block text-center mb-1">Time Remaining</span>
                                 <span className="font-mono text-3xl font-black text-accent drop-shadow-[0_0_10px_rgba(108,92,231,0.5)]">
                                     {timeLeft}
                                 </span>
                             </div>
                         )}
                         {match.status === 'IN_PROGRESS' && (
                             <a href={match.problemLink} target="_blank" rel="noreferrer" className="v6-solve-btn">
                                 UNLEASH CODE <ExternalLink size={18} className="ml-2" />
                             </a>
                         )}
                    </div>
                </header>

                <div className="arena-v6-stage">
                    <div className="hud-grid-v6"></div>
                    <div className="asymmetric-split">
                        {renderTacticalDeck(p1, "Command Alpha")}
                        <div className="vs-core">
                           <div className="vs-logo-v6">VS</div>
                           <div className="hud-line"></div>
                        </div>
                        {renderTacticalDeck(p2, "Command Bravo")}
                    </div>
                    {match.status === 'WAITING' && (
                        <div className="v6-waiting-overlay animate-pulse">
                            <div className="flex items-center gap-4 text-accent text-sm font-black tracking-[0.4em] uppercase">
                                <Loader2 className="spin" size={24} /> Initiating Combat Link...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .arena-v6-layout { position: fixed; inset: 0; background: var(--bg-primary); z-index: 50; display: flex; flex-direction: column; overflow: hidden; transition: all 0.5s; color: var(--text-primary); }
                
                .arena-v6-main { flex: 1; display: flex; flex-direction: column; position: relative; }
                .hud-grid-v6 { position: absolute; inset: 0; background-image: radial-gradient(var(--accent-glow) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; opacity: 0.1; z-index: 0; }
                
                /* Nav */
                .arena-v6-nav { background: var(--bg-secondary); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; z-index: 10; box-shadow: var(--shadow-sm); }
                .v6-btn-back { background: var(--bg-tertiary); border: 1px solid var(--border); padding: 10px 20px; border-radius: 10px; font-size: 10px; font-weight: 900; color: var(--text-muted); cursor: pointer; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.1em; }
                .v6-btn-back:hover { color: var(--text-primary); border-color: var(--accent); background: var(--bg-hover); }
                .v6-difficulty { font-size: 10px; background: var(--accent-subtle); color: var(--accent); padding: 6px 14px; border-radius: 8px; font-weight: 1000; letter-spacing: 0.1em; }
                .hud-label-v6 { font-size: 10px; font-weight: 900; color: var(--accent); text-transform: uppercase; letter-spacing: 0.2em; }
                .status-v5 { font-size: 8px; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.15em; padding: 4px 10px; border-radius: 6px; margin-left: 12px; border: 1px solid var(--border); }
                .status-v5.waiting { color: var(--accent); background: var(--accent-subtle); border-color: var(--accent-glow); }
                .status-v5.in_progress { color: var(--success); background: var(--success-bg); border-color: var(--success); }
                
                .v6-solve-btn { background: var(--accent); color: white !important; padding: 16px 32px; border-radius: 12px; font-weight: 1000; font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; display: flex; align-items: center; box-shadow: var(--shadow-glow); transition: all 0.3s ease; border: none; cursor: pointer; }
                .v6-solve-btn:hover { transform: translateY(-4px); box-shadow: 0 15px 40px var(--accent-glow); background: var(--accent-hover); }

                /* Stage */
                .arena-v6-stage { flex: 1; position: relative; padding: 60px; display: flex; align-items: center; justify-content: center; z-index: 1; overflow-y: auto; }
                .asymmetric-split { display: flex; align-items: center; gap: 60px; width: 100%; max-width: 1400px; }
                
                /* Tactical Deck */
                .tactical-deck { flex: 1; min-height: 520px; background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border); border-radius: 32px; position: relative; overflow: hidden; display: flex; flex-direction: column; transition: all 0.5s; box-shadow: var(--shadow-lg); }
                .tactical-deck.empty { background: transparent; border: 2px dashed var(--border); align-items: center; justify-content: center; opacity: 0.5; }
                .deck-ruler { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent); }
                .scanning-line { position: absolute; left: 0; right: 0; height: 120px; background: linear-gradient(to bottom, transparent, var(--accent-glow), transparent); opacity: 0.1; animation: scan-v6 4s infinite linear; }
                @keyframes scan-v6 { from { top: -120px; } to { top: 100%; } }

                .deck-header-v5 { padding: 40px; display: flex; gap: 24px; border-bottom: 1px solid var(--border); background: var(--bg-tertiary); opacity: 0.8; }
                .deck-avatar-v5 { width: 80px; height: 80px; border-radius: 20px; border: 2px solid var(--border); box-shadow: var(--shadow-sm); }
                .deck-name-v5 { font-size: 2rem; font-weight: 1000; letter-spacing: -0.02em; margin-bottom: 8px; color: var(--text-primary); }
                .deck-tag { font-size: 10px; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.3em; color: var(--accent); margin-bottom: 10px; display: block; }
                .handle-pill-v5 { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-primary); border: 1px solid var(--border); padding: 4px 12px; border-radius: 6px; display: inline-block; }
                
                .deck-telemetry-v5 { flex: 1; padding: 40px; display: flex; flex-direction: column; }
                .coding-loader { padding-top: 40px; border-top: 1px solid var(--border); }
                .coding-bar { height: 4px; width: 100%; background: var(--bg-tertiary); margin-bottom: 12px; border-radius: 4px; position: relative; overflow: hidden; }
                .coding-bar::after { content: ''; position: absolute; left:0; top:0; height:100%; width: 40%; background: var(--accent); animation: coding-active 2s infinite linear; }
                @keyframes coding-active { from { left: -40%; } to { left: 100%; } }

                .verdict-display { padding: 32px; border-radius: 20px; text-align: center; position: relative; font-weight: 900; }
                .verdict-display.ac { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
                .verdict-display.wa { background: var(--error-bg); color: var(--error); border: 1px solid var(--error); }

                .victory-glow { transform: scale(1.05); border-color: var(--success); box-shadow: 0 0 60px var(--success-bg); z-index: 5; }
                .victory-tag { font-size: 10px; background: var(--success); color: white; padding: 6px 16px; border-radius: 8px; font-weight: 1000; letter-spacing: 0.1em; text-transform: uppercase; }
                
                /* VS Divider */
                .vs-core { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; }
                .vs-logo-v6 { font-size: 4rem; font-weight: 950; font-style: italic; color: var(--text-muted); opacity: 0.2; letter-spacing: -0.1em; transition: opacity 0.3s; }
                .vs-core:hover .vs-logo-v6 { opacity: 0.4; }
                .hud-line { width: 1px; height: 100%; background: linear-gradient(to bottom, transparent, var(--border), transparent); position: absolute; }
                
                /* HUD Modal - Shared */
                .hud-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(15px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; transition: all 0.3s; }
                .hud-modal-panel { width: 100%; max-width: 600px; background: var(--bg-secondary); border: 2px solid var(--accent); border-radius: 32px; position: relative; padding: 48px; box-shadow: var(--shadow-lg); overflow: hidden; }
                .hud-ruler-v5 { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, transparent, var(--accent), transparent); }
                .hud-tag-v5 { font-size: 10px; font-weight: 1000; color: var(--accent); text-transform: uppercase; letter-spacing: 0.4em; border: 1px solid var(--accent-glow); padding: 4px 12px; border-radius: 4px; display: inline-block; margin-bottom: 16px; }
                .hud-modal-title { font-size: 2.25rem; font-weight: 950; color: var(--text-primary); margin-bottom: 12px; letter-spacing: -0.02em; }
                .hud-modal-sub { color: var(--text-muted); font-size: 1rem; margin-bottom: 32px; }

                .v5-form-group { margin-bottom: 32px; }
                .v5-label { display: block; font-size: 0.75rem; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 16px; opacity: 0.8; }
                .v5-select { width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; padding: 14px 20px; color: var(--text-primary); font-weight: 700; outline: none; cursor: pointer; -webkit-appearance: none; }
                .v5-select:focus { border-color: var(--accent); box-shadow: var(--shadow-glow); }

                .v5-action-row { display: flex; gap: 16px; margin-top: 40px; }
                .v5-btn-confirm { flex: 1; padding: 18px; background: var(--accent); color: white; border-radius: 16px; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; box-shadow: var(--shadow-glow); transition: all 0.3s; border: none; cursor: pointer; }
                .v5-btn-confirm:hover:not(:disabled) { transform: translateY(-4px); box-shadow: 0 15px 30px var(--accent-glow); background: var(--accent-hover); }
                .v5-btn-abort { padding: 18px 32px; background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 16px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s; cursor: pointer; }
                .v5-btn-abort:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-strong); }
                
                :global(html:not(.dark)) .hud-modal-overlay { background: rgba(241, 245, 249, 0.8); }
                :global(.dark) .hud-modal-panel { background: #0a0a0f; }
            `}</style>

            {/* Entry Protocol Modal - HUD Style */}
            {showEntryProtocol && (
                <div className="hud-modal-overlay">
                    <div className="hud-modal-panel">
                        <div className="hud-ruler-v5"></div>
                        <span className="hud-tag-v5">Identity Verification Required</span>
                        <h2 className="hud-modal-title">Entry Protocol</h2>
                        <p className="hud-modal-sub mb-10">You are identified as a primary combatant. Select your deployment handle to initialize the link.</p>
                        
                        {linkedCFAccounts.length > 0 ? (
                            <div className="v5-form-group">
                                <label className="v5-label">Active Handle</label>
                                <select 
                                    className="v5-select"
                                    value={confirmedHandle || ''}
                                    onChange={e => setConfirmedHandle(e.target.value)}
                                >
                                    <option value="" disabled>-- SELECT IDENTITY --</option>
                                    {linkedCFAccounts.map(acc => (
                                        <option key={acc.id} value={acc.handle}>{acc.handle} {acc.isPrimary ? '— (PRIMARY)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="v5-form-group">
                                <label className="v5-label text-error">Critical Failure: No Identities Linked</label>
                                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-xs text-red-200 leading-relaxed font-bold uppercase tracking-widest">
                                    No Codeforces identity detected in your profile. Deployment is restricted to verified operators only.
                                    <Link to="/profile" className="block mt-4 text-accent hover:underline">Sync Profile Identity →</Link>
                                </div>
                            </div>
                        )}
                        
                        <div className="v5-action-row">
                            <button type="button" className="v5-btn-abort" onClick={() => navigate('/arena')}>
                                Abort Mission
                            </button>
                            <button 
                                type="button" 
                                className="v5-btn-confirm" 
                                disabled={!confirmedHandle || linkedCFAccounts.length === 0}
                                onClick={() => {
                                    setShowEntryProtocol(false);
                                    io.emit('battle:join', { matchId: id, cfHandle: confirmedHandle });
                                }}
                            >
                                Confirm & Deploy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

