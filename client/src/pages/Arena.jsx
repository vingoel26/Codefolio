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
                    cfHandle: selectedHandle
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
            <div className="arena-header">
                <div>
                    <h1><Swords size={28} className="text-accent inline-block mr-3 mb-1" /> CF Battle Arena</h1>
                    <p className="text-muted">Race your friends in real-time 1v1 algorithmic battles.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Create Match
                </button>
            </div>

            <div className="arena-content">
                {loading ? (
                    <div className="flex-center py-20">
                        <Loader2 size={32} className="spin text-accent" />
                    </div>
                ) : matches.length === 0 ? (
                    <div className="empty-state">
                        <Trophy size={48} className="opacity-20 mb-4" />
                        <h2>No active battles</h2>
                        <p>Be the first to create a room and challenge others!</p>
                    </div>
                ) : (
                    <div className="matches-grid">
                        {matches.map(match => (
                            <div key={match.id} className="match-card">
                                <div className="match-header">
                                    <span className={`status-badge ${match.status.toLowerCase()}`}>
                                        {match.status}
                                    </span>
                                    <span className="difficulty-badge">★ {match.difficulty || 'Any'}</span>
                                </div>
                                <h3 className="match-title">{match.problemName}</h3>
                                
                                <div className="match-players">
                                    <div className="player-avatars">
                                        {match.players.map(p => (
                                            <div key={p.id} className="player-avatar" title={p.user.username || p.user.displayName || 'Player'}>
                                                {(p.user.username || p.user.displayName || p.user.email || '?')[0].toUpperCase()}
                                            </div>
                                        ))}
                                        {match.players.length === 1 && (
                                            <div className="player-avatar empty">?</div>
                                        )}
                                    </div>
                                    <span className="player-count">
                                        <Users size={14} className="mr-1 inline" />
                                        {match.players.length}/2
                                    </span>
                                </div>

                                <button 
                                    className={`btn-${match.players.length === 2 ? 'secondary' : 'primary'} w-full mt-4`}
                                    onClick={() => {
                                        if (match.players.some(p => p.userId === user?.id) || match.players.length === 2) {
                                            navigate(`/arena/${match.id}`);
                                        } else {
                                            if (linkedCFAccounts.length > 1) {
                                                setJoinTargetId(match.id);
                                                setShowJoinModal(true);
                                            } else {
                                                navigate(`/arena/${match.id}?handle=${selectedHandle}`);
                                            }
                                        }
                                    }}
                                >
                                    {match.players.some(p => p.userId === user?.id) ? 'Return to Match' : 
                                     match.players.length === 2 ? 'Spectate' : 'Join Battle'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Match Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Create Battle Room</h2>
                        <p className="text-muted mb-6">Select a target difficulty. We'll pick a random Codeforces problem in this range.</p>
                        
                        <form onSubmit={handleCreateMatch}>
                            <div className="form-group">
                                <label>Target Difficulty (Rating)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="800" 
                                        max="3500" 
                                        step="100"
                                        value={difficulty}
                                        onChange={e => setDifficulty(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <span className="font-bold text-lg w-16 text-right">{difficulty}</span>
                                </div>
                                <p className="text-xs text-muted mt-2">Problem will be between {Math.max(800, difficulty - 200)} and {difficulty + 200}</p>
                            </div>

                            {linkedCFAccounts.length > 0 && (
                                <div className="form-group mt-6">
                                    <label>Battle As (Codeforces Handle)</label>
                                    <select 
                                        value={selectedHandle} 
                                        onChange={e => setSelectedHandle(e.target.value)}
                                        className="w-full bg-tertiary border border-border rounded-md p-2 mt-2 focus:ring-1 focus:ring-accent"
                                    >
                                        {linkedCFAccounts.map(acc => (
                                            <option key={acc.id} value={acc.handle}>{acc.handle} {acc.isPrimary ? '(Primary)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={creating}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={creating}>
                                    {creating ? <Loader2 size={18} className="spin" /> : 'Create Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Match Modal (for multi-account users) */}
            {showJoinModal && (
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Join Battle</h2>
                        <p className="text-muted mb-6">Which Codeforces account would you like to use for this match?</p>
                        
                        <div className="form-group">
                            <label>Battle As (Codeforces Handle)</label>
                            <select 
                                value={selectedHandle} 
                                onChange={e => setSelectedHandle(e.target.value)}
                                className="w-full bg-tertiary border border-border rounded-md p-2 mt-2 focus:ring-1 focus:ring-accent"
                            >
                                {linkedCFAccounts.map(acc => (
                                    <option key={acc.id} value={acc.handle}>{acc.handle} {acc.isPrimary ? '(Primary)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" className="btn-secondary" onClick={() => setShowJoinModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn-primary" onClick={() => {
                                setShowJoinModal(false);
                                navigate(`/arena/${joinTargetId}?handle=${selectedHandle}`);
                            }}>
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .arena-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 32px 24px;
                }
                .arena-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                }
                .matches-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }
                .match-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .match-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--border-strong);
                }
                .match-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-badge.waiting { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
                .status-badge.in_progress { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
                
                .difficulty-badge {
                    font-size: 0.8125rem;
                    color: var(--warning);
                    font-weight: 600;
                }
                .match-title {
                    font-size: 1.125rem;
                    margin-bottom: 20px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .match-players {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .player-avatars {
                    display: flex;
                    gap: 8px;
                }
                .player-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    border: 2px solid var(--bg-secondary);
                }
                .player-avatar.empty {
                    border: 2px dashed var(--border);
                    background: transparent;
                    color: var(--text-muted);
                }
                .player-count {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-xl);
                    border: 1px dashed var(--border);
                    color: var(--text-muted);
                }
                .empty-state h2 { color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem; }
            `}</style>
        </div>
    );
}
