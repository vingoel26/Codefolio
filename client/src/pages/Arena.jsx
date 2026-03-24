import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Swords, 
    Plus, 
    Trophy,
    Loader2,
    Users
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Arena() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [difficulty, setDifficulty] = useState(1000);
    const [selectedHandle, setSelectedHandle] = useState('');
    const [linkedCFAccounts, setLinkedCFAccounts] = useState([]);
    
    // For joining an existing match
    const [joinTargetId, setJoinTargetId] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const [duration, setDuration] = useState(60);

    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);

    useEffect(() => {
        const fetchLinkedAccounts = async () => {
            try {
                const res = await fetch(`${API_URL}/users/linked-accounts`, {
                    headers: { 'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const cfAccts = data.accounts.filter(a => a.platform === 'codeforces');
                    setLinkedCFAccounts(cfAccts);
                    if (cfAccts.length > 0) {
                        const primary = cfAccts.find(a => a.isPrimary) || cfAccts[0];
                        setSelectedHandle(primary.handle);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch linked accounts");
            }
        };
        fetchLinkedAccounts();
    }, [user]);

    const fetchMatches = async () => {
        try {
            const res = await fetch(`${API_URL}/battles`);
            if (res.ok) {
                const data = await res.json();
                setMatches(data);
            }
        } catch (error) {
            console.error('Failed to fetch battles', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(fetchMatches, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/battles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                    minDifficulty: difficulty - 200,
                    maxDifficulty: difficulty + 200,
                    cfHandle: selectedHandle,
                    duration: duration
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create match');
            
            setShowModal(false);
            navigate(`/arena/${data.id}`);
        } catch (error) {
            console.error('Failed to create match', error);
            alert(error.message || 'Failed to create match');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="arena-page">
            <style>{`
                .arena-page { max-width: 1400px; margin: 0 auto; padding: 40px; position: relative; color: var(--text-primary); transition: all 0.3s; }
                .arena-hud-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; border-bottom: 1px solid var(--border); padding-bottom: 32px; }
                .arena-title-v5 { font-size: 2.5rem; font-weight: 950; letter-spacing: -0.03em; display: flex; align-items: center; gap: 20px; color: var(--text-primary); }
                .arena-title-v5 span { background: linear-gradient(135deg, var(--accent) 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .arena-sub-v5 { color: var(--text-muted); font-size: 1.1rem; margin-top: 4px; font-weight: 500; }
                
                .create-btn-v5 { padding: 14px 28px; background: var(--accent); color: white; border-radius: 14px; display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: var(--shadow-glow); border: 1px solid rgba(255,255,255,0.1); }
                .create-btn-v5:hover { transform: translateY(-4px) scale(1.05); background: var(--accent-hover); box-shadow: 0 15px 30px var(--accent-glow); }

                /* Grid Matrix */
                .matches-matrix-v5 { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 32px; }
                .match-node-v5 { background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border); border-radius: 24px; padding: 28px; transition: all 0.4s; position: relative; overflow: hidden; box-shadow: var(--shadow-sm); }
                .match-node-v5:hover { transform: translateY(-8px); border-color: var(--accent); box-shadow: var(--shadow-lg); background: var(--bg-secondary); }
                .node-accent-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent); opacity: 0.4; transition: all 0.3s; }
                .match-node-v5:hover .node-accent-bar { width: 6px; opacity: 1; }

                .status-v5 { font-size: 0.65rem; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.2em; padding: 6px 14px; border-radius: 8px; margin-bottom: 20px; display: inline-block; }
                .status-v5.waiting { background: var(--accent-subtle); color: var(--accent); border: 1px solid var(--accent-glow); }
                .status-v5.in_progress { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }

                .match-title-v5 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 24px; line-height: 1.4; display: flex; align-items: center; gap: 10px; }
                .match-metadata-v5 { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--border); }
                .p-avatar-v5 { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--bg-secondary); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; margin-left: -10px; color: var(--text-primary); }
                .p-avatar-v5:first-child { margin-left: 0; }
                .p-avatar-empty { border: 2px dashed var(--border); color: var(--text-muted); }

                .node-action-v5 { margin-top: 24px; width: 100%; padding: 12px; border-radius: 12px; font-weight: 1000; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15rem; transition: all 0.3s; cursor: pointer; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-muted); }
                .match-node-v5:hover .node-action-v5 { background: var(--accent); color: white; border-color: var(--accent); box-shadow: var(--shadow-glow); }

                /* HUD Modal Cleanup */
                .hud-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(15px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; transition: all 0.3s; }
                :global(html:not(.dark)) .hud-modal-overlay { background: rgba(241, 245, 249, 0.8); }
                
                .hud-modal-panel { width: 100%; max-width: 600px; background: var(--bg-secondary); border: 2px solid var(--accent); border-radius: 32px; position: relative; padding: 48px; box-shadow: var(--shadow-lg); overflow: hidden; transition: all 0.3s; }
                .hud-modal-panel::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(var(--accent-glow) 1px, transparent 1px); background-size: 30px 30px; opacity: 0.1; pointer-events: none; }
                .hud-ruler-v5 { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, transparent, var(--accent), transparent); }
                .hud-tag-v5 { font-size: 10px; font-weight: 1000; color: var(--accent); text-transform: uppercase; letter-spacing: 0.4em; border: 1px solid var(--accent-glow); padding: 4px 12px; border-radius: 4px; display: inline-block; margin-bottom: 16px; position: relative; z-index: 1; }
                .hud-modal-title { font-size: 2.25rem; font-weight: 950; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.02em; position: relative; z-index: 1; }
                .hud-modal-sub { color: var(--text-muted); font-size: 1rem; margin-bottom: 40px; position: relative; z-index: 1; }

                .v5-form-group { margin-bottom: 32px; position: relative; z-index: 1; }
                .v5-label { display: block; font-size: 0.75rem; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 16px; opacity: 0.8; }
                .v5-select { width: 100%; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; padding: 14px 20px; color: var(--text-primary); font-weight: 700; outline: none; transition: all 0.3s; cursor: pointer; -webkit-appearance: none; }
                .v5-select:focus { border-color: var(--accent); box-shadow: var(--shadow-glow); }
                .v5-val-display { font-size: 3.5rem; font-weight: 1000; color: var(--text-primary); line-height: 1; display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; transition: color 0.3s; }
                .v5-val-unit { font-size: 1rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
                
                .v5-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: var(--bg-tertiary); outline: none; margin-top: 20px; }
                .v5-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 4px solid var(--bg-secondary); box-shadow: var(--shadow-glow); transition: transform 0.2s; }
                .v5-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }

                .v5-action-row { display: flex; gap: 16px; position: relative; z-index: 1; margin-top: 40px; }
                .v5-btn-confirm { flex: 1; padding: 18px; background: var(--accent); color: white; border-radius: 16px; font-weight: 1000; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; box-shadow: var(--shadow-glow); transition: all 0.3s; border: none; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                .v5-btn-confirm:hover:not(:disabled) { transform: translateY(-4px); box-shadow: 0 15px 30px var(--accent-glow); background: var(--accent-hover); }
                .v5-btn-confirm:disabled { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
                .v5-btn-abort { padding: 18px 32px; background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary); border-radius: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s; cursor: pointer; }
                .v5-btn-abort:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-strong); }

                .empty-v5 { text-align: center; padding: 100px 40px; border: 1px dashed var(--border); border-radius: 40px; background: rgba(var(--accent-rgb), 0.01); color: var(--text-muted); }
                .empty-v5-icon { color: var(--accent); margin-bottom: 24px; opacity: 0.3; }
            `}</style>

            <div className="arena-hud-header">
                <div>
                    <h1 className="arena-title-v5">
                        <Swords size={40} className="text-accent" /> 
                        <span>CF Arena v4.0</span>
                    </h1>
                    <p className="arena-sub-v5">Global synchronized 1v1 matchmaking protocols initialized.</p>
                </div>
                <button className="create-btn-v5" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    Create Match
                </button>
            </div>

            <div className="arena-content">
                {loading ? (
                    <div className="flex-center py-40">
                        <Loader2 size={48} className="spin text-accent" />
                    </div>
                ) : matches.length === 0 ? (
                    <div className="empty-v5">
                        <div className="empty-v5-icon"><Trophy size={40} /></div>
                        <h2 className="text-2xl font-bold mb-4">No active nodes detected</h2>
                    </div>
                ) : (
                    <div className="matches-matrix-v5">
                        {matches.map(match => (
                            <div key={match.id} className="match-node-v5 group">
                                <div className="node-accent-bar" style={{ background: match.status === 'IN_PROGRESS' ? 'var(--success)' : 'var(--accent)' }}></div>
                                <div className={`status-v5 ${match.status.toLowerCase()}`}>
                                    {match.status.replace('_', ' ')}
                                </div>
                                <div className="match-title-v5">
                                    <span className="flex-1 truncate">{match.problemName}</span>
                                    <span className="text-warning text-sm">★{match.difficulty || '???'}</span>
                                </div>
                                
                                <div className="flex items-center gap-6 mb-8">
                                   <div className="flex flex-col">
                                       <span className="text-[10px] uppercase tracking-widest text-muted font-black mb-1">Time Limit</span>
                                       <span className="font-mono text-lg font-bold">{(match.duration || 60)}:00</span>
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="text-[10px] uppercase tracking-widest text-muted font-black mb-1">Room Power</span>
                                       <span className="font-mono text-lg font-bold text-accent">Lvl {Math.floor((match.difficulty || 800) / 400)}</span>
                                   </div>
                                </div>

                                <div className="match-metadata-v5">
                                    <div className="player-cluster-v5">
                                        {match.players.map(p => (
                                            <div key={p.id} className="p-avatar-v5" title={p.user.username}>
                                                {(p.user.displayName || p.user.username)[0].toUpperCase()}
                                            </div>
                                        ))}
                                        {match.players.length === 1 && (
                                            <div className="p-avatar-v5 p-avatar-empty">?</div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-black tracking-tighter text-muted">
                                        SYNC {match.players.length}/2
                                    </span>
                                </div>

                                <button 
                                    className="node-action-v5"
                                    onClick={() => {
                                        if (match.players.some(p => p.userId === user?.id) || match.players.length === 2) {
                                            navigate(`/arena/${match.id}`);
                                        } else {
                                            if (linkedCFAccounts.length === 0) {
                                                alert("Identity Link Required. Please link your Codeforces account in your profile to participate in battles.");
                                                return;
                                            }
                                            if (linkedCFAccounts.length > 1) {
                                                setJoinTargetId(match.id);
                                                setShowJoinModal(true);
                                            } else {
                                                navigate(`/arena/${match.id}?handle=${selectedHandle}`);
                                            }
                                        }
                                    }}
                                >
                                    {match.players.some(p => p.userId === user?.id) ? 'Resume Link' : 
                                     match.players.length === 2 ? 'Passive Observation' : 'Initiate Link'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Match Modal - HUD Style */}
            {showModal && (
                <div className="hud-modal-overlay" onClick={() => !creating && setShowModal(false)}>
                    <div className="hud-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="hud-ruler-v5"></div>
                        <span className="hud-tag-v5">Room Creation Protocol</span>
                        <h2 className="hud-modal-title">Initialize Arena</h2>
                        <p className="hud-modal-sub mb-12">Allocate resources and select target difficulty for synchronized combat.</p>
                        
                        <form onSubmit={handleCreateMatch}>
                            <div className="v5-form-group">
                                <label className="v5-label">Target Rating Threshold</label>
                                <div className="range-wrapper-v5">
                                    <div className="v5-val-display">
                                        <span>{difficulty}</span>
                                        <span className="v5-val-unit">Points</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="800" 
                                        max="3500" 
                                        step="100"
                                        value={difficulty}
                                        onChange={e => setDifficulty(Number(e.target.value))}
                                        className="v5-slider"
                                    />
                                    <p className="text-[10px] text-[#4a4a68] font-bold uppercase tracking-[0.2em]">Rating Variance: ±200 Points</p>
                                </div>
                            </div>

                            <div className="v5-form-group">
                                <label className="v5-label">Match Duration Limit</label>
                                <div className="range-wrapper-v5">
                                    <div className="v5-val-display">
                                        <span>{duration}</span>
                                        <span className="v5-val-unit">Minutes</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="120" 
                                        step="10"
                                        value={duration}
                                        onChange={e => setDuration(Number(e.target.value))}
                                        className="v5-slider"
                                    />
                                </div>
                            </div>

                            {linkedCFAccounts.length > 0 ? (
                                <div className="v5-form-group">
                                    <label className="v5-label">Operator Handle Identification</label>
                                    <select 
                                        value={selectedHandle} 
                                        onChange={e => setSelectedHandle(e.target.value)}
                                        className="v5-select"
                                    >
                                        {linkedCFAccounts.map(acc => (
                                            <option key={acc.id} value={acc.handle}>{acc.handle} {acc.isPrimary ? '— (PRIMARY)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="v5-form-group">
                                    <label className="v5-label text-error">Identity Link Required</label>
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 leading-relaxed font-bold uppercase tracking-widest">
                                        No Codeforces account detected. Deployment requires a verified identity link.
                                        <Link to="/profile" className="block mt-3 text-accent hover:underline">Sync Profile Identity →</Link>
                                    </div>
                                </div>
                            )}
                            
                            <div className="v5-action-row">
                                <button type="button" className="v5-btn-abort" onClick={() => setShowModal(false)} disabled={creating}>
                                    Abort
                                </button>
                                <button 
                                    type="submit" 
                                    className="v5-btn-confirm" 
                                    disabled={creating || linkedCFAccounts.length === 0}
                                >
                                    {creating ? <Loader2 size={18} className="spin" /> : 'Confirm Initialization'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Match Modal - HUD Style */}
            {showJoinModal && (
                <div className="hud-modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="hud-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="hud-ruler-v5"></div>
                        <span className="hud-tag-v5">Link Protocol</span>
                        <h2 className="hud-modal-title">Identify Operator</h2>
                        <p className="hud-modal-sub mb-10">Select the Codeforces identity you wish to deploy for this synchronized match.</p>
                        
                        <div className="v5-form-group">
                            <label className="v5-label">Active Handle</label>
                            <select 
                                value={selectedHandle} 
                                onChange={e => setSelectedHandle(e.target.value)}
                                className="v5-select"
                            >
                                {linkedCFAccounts.map(acc => (
                                    <option key={acc.id} value={acc.handle}>{acc.handle} {acc.isPrimary ? '— PRIMARY' : ''}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="v5-action-row">
                            <button type="button" className="v5-btn-cancel" onClick={() => setShowJoinModal(false)}>
                                Abort
                            </button>
                            <button type="button" className="v5-btn-confirm" onClick={() => {
                                setShowJoinModal(false);
                                navigate(`/arena/${joinTargetId}?handle=${selectedHandle}`);
                            }}>
                                Confirm Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
