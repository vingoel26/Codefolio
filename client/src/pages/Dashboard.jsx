import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { RefreshCw, Loader2, Trophy, Target, TrendingUp, Code, Award, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLATFORMS = [
    { id: 'codeforces', name: 'Codeforces', color: '#1a8cff', icon: 'CF', path: '/codeforces' },
    { id: 'leetcode', name: 'LeetCode', color: '#ffa116', icon: 'LC', path: '/leetcode' },
    { id: 'codechef', name: 'CodeChef', color: '#5b4638', icon: 'CC', path: '/codechef' },
    { id: 'gfg', name: 'GeeksforGeeks', color: '#2f8d46', icon: 'GFG', path: '/gfg' },
];

export default function Dashboard() {
    const { accessToken, user } = useAuthStore();
    const [platformData, setPlatformData] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const results = {};
        await Promise.all(
            PLATFORMS.map(async (p) => {
                try {
                    const res = await fetch(`${API_URL}/sync/data/${p.id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        credentials: 'include',
                    });
                    if (res.ok) {
                        const json = await res.json();
                        results[p.id] = json;
                    }
                } catch { /* platform not linked */ }
            })
        );
        setPlatformData(results);
        setLoading(false);
    }, [accessToken]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Aggregate stats
    const linked = PLATFORMS.filter((p) => platformData[p.id]?.data);
    const totalSolved = linked.reduce((sum, p) => {
        const d = platformData[p.id]?.data;
        const s = d?.stats;
        return sum + (s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0);
    }, 0);

    const totalContests = linked.reduce((sum, p) => {
        const d = platformData[p.id]?.data;
        const s = d?.stats;
        const c = d?.contest;
        return sum + (s?.contestsParticipated || c?.contestsAttended || 0);
    }, 0);

    // Per-platform solved for bar chart
    const solvedByPlatform = PLATFORMS.map((p) => {
        const d = platformData[p.id]?.data;
        const s = d?.stats;
        return {
            name: p.name,
            solved: s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0,
            color: p.color,
        };
    }).filter((d) => d.solved > 0);

    if (loading) {
        return (
            <div className="dash-status">
                <Loader2 size={32} className="spin" />
                <p>Loading dashboard...</p>
                <style>{statusStyle}</style>
            </div>
        );
    }

    return (
        <div className="master-dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">
                        <Trophy size={24} /> Dashboard
                    </h1>
                    <p className="dash-subtitle">
                        Welcome back, {user?.displayName || user?.email}! Here's your coding overview.
                    </p>
                </div>
                <button className="dash-sync-btn" onClick={fetchAll}><RefreshCw size={16} /> Refresh</button>
            </div>

            {/* Grand Total Stats */}
            <div className="stats-grid">
                <StatCard icon={Target} label="Total Solved" value={totalSolved} color="var(--accent)" size="lg" />
                <StatCard icon={Award} label="Contests" value={totalContests} color="#ffa116" size="lg" />
                <StatCard icon={Code} label="Platforms" value={linked.length} color="#6366f1" size="lg" />
            </div>

            {/* Platform Cards */}
            <div className="platform-grid">
                {PLATFORMS.map((p) => {
                    const d = platformData[p.id]?.data;
                    const acct = platformData[p.id]?.account;
                    const s = d?.stats;
                    const isLinked = !!d;
                    const solved = s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0;
                    const rating = s?.currentRating || d?.contest?.rating || d?.profile?.rating || 0;

                    return (
                        <a key={p.id} href={p.path} className={`platform-card glass-card ${isLinked ? '' : 'dim'}`}>
                            <div className="platform-card-header">
                                <span className="platform-icon" style={{ background: p.color }}>{p.icon}</span>
                                <span className="platform-name">{p.name}</span>
                                {isLinked && <ExternalLink size={14} className="platform-arrow" />}
                            </div>
                            {isLinked ? (
                                <div className="platform-stats">
                                    <div className="platform-stat">
                                        <span className="platform-stat-value">{solved}</span>
                                        <span className="platform-stat-label">Solved</span>
                                    </div>
                                    {rating > 0 && (
                                        <div className="platform-stat">
                                            <span className="platform-stat-value">{rating}</span>
                                            <span className="platform-stat-label">Rating</span>
                                        </div>
                                    )}
                                    <div className="platform-handle">{acct?.handle}</div>
                                </div>
                            ) : (
                                <div className="platform-unlinked">Not linked yet</div>
                            )}
                        </a>
                    );
                })}
            </div>

            {/* Problems by Platform Chart */}
            {solvedByPlatform.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Problems Solved by Platform</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={solvedByPlatform}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                                {solvedByPlatform.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <style>{masterStyles}</style>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, size }) {
    return (
        <div className={`stat-card glass-card ${size === 'lg' ? 'stat-lg' : ''}`}>
            <div style={{ color }}><Icon size={size === 'lg' ? 24 : 20} /></div>
            <div className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}

const statusStyle = `
    .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:12px; color:var(--text-secondary); }
    .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
`;

const masterStyles = `
    .master-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:10px; font-size:1.5rem; font-weight:800; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    .stats-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px; }
    .stat-card { padding:20px; text-align:center; border-radius:var(--radius-lg); }
    .stat-lg .stat-value { font-size:2rem; }
    .stat-value { font-size:1.4rem; font-weight:800; margin:6px 0 2px; }
    .stat-label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }

    .platform-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:24px; }
    .platform-card { display:block; padding:20px; border-radius:var(--radius-lg); text-decoration:none; color:inherit; transition:all var(--transition-fast); cursor:pointer; }
    .platform-card:hover { transform:translateY(-2px); border-color:var(--accent); }
    .platform-card.dim { opacity:0.5; }
    .platform-card-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .platform-icon { width:32px; height:32px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.6rem; color:#fff; flex-shrink:0; }
    .platform-name { font-weight:700; font-size:0.9375rem; flex:1; }
    .platform-arrow { color:var(--text-muted); }
    .platform-stats { display:flex; gap:20px; flex-wrap:wrap; }
    .platform-stat { display:flex; flex-direction:column; }
    .platform-stat-value { font-size:1.25rem; font-weight:800; }
    .platform-stat-label { font-size:0.6875rem; color:var(--text-muted); text-transform:uppercase; }
    .platform-handle { font-size:0.75rem; color:var(--text-secondary); margin-top:4px; width:100%; }
    .platform-unlinked { font-size:0.8125rem; color:var(--text-muted); }

    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9375rem; font-weight:700; margin-bottom:16px; }

    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr 1fr; } }
`;
