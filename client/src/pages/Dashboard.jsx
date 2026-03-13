import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { RefreshCw, Loader2, Trophy, Target, TrendingUp, Code, Award, ExternalLink, Calendar, Flame, Hash, Brain, LayoutTemplate } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLATFORMS = [
    { id: 'codeforces', name: 'Codeforces', color: '#1a8cff', icon: 'CF', path: '/codeforces' },
    { id: 'leetcode', name: 'LeetCode', color: '#ffa116', icon: 'LC', path: '/leetcode' },
    { id: 'codechef', name: 'CodeChef', color: '#5b4638', icon: 'CC', path: '/codechef' },
    { id: 'gfg', name: 'GeeksforGeeks', color: '#2f8d46', icon: 'GFG', path: '/gfg' },
];

export default function Dashboard() {
    const { accessToken, user } = useAuthStore();
    const [allData, setAllData] = useState({});
    const [focusData, setFocusData] = useState({ stats: { totalSessions: 0, totalFocusedMinutes: 0 }, recentSessions: [] });
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const results = {};
        await Promise.all(
            PLATFORMS.map(async (p) => {
                try {
                    const res = await fetch(`${API_URL}/sync/accounts/${p.id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        credentials: 'include',
                    });
                    if (res.ok) {
                        const json = await res.json();
                        results[p.id] = json.accounts || [];
                    }
                } catch { /* not linked */ }
            })
        );
        
        // Fetch focus stats
        try {
            const focusRes = await fetch(`${API_URL}/focus`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            if (focusRes.ok) {
                const fData = await focusRes.json();
                setFocusData(fData);
            }
        } catch (err) {
            console.error('Failed to fetch focus stats:', err);
        }

        setAllData(results);
        setLoading(false);
    }, [accessToken]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Aggregations across all accounts
    const platformSummaries = PLATFORMS.map((p) => {
        const accounts = allData[p.id] || [];
        const linked = accounts.filter((a) => a.data);
        let totalSolved = 0, bestRating = 0, contests = 0;

        for (const a of linked) {
            const s = a.data?.stats;
            const c = a.data?.contest;
            totalSolved += s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0;
            const r = s?.currentRating || c?.rating || a.data?.profile?.rating || 0;
            if (r > bestRating) bestRating = r;
            contests += s?.contestsParticipated || c?.contestsAttended || 0;
        }

        return { ...p, accounts, linkedCount: linked.length, totalSolved, bestRating, contests };
    });

    const grandSolved = platformSummaries.reduce((s, p) => s + p.totalSolved, 0);
    const grandContests = platformSummaries.reduce((s, p) => s + p.contests, 0);
    const totalAccounts = platformSummaries.reduce((s, p) => s + p.linkedCount, 0);
    const linkedPlatforms = platformSummaries.filter((p) => p.linkedCount > 0).length;

    // Bar chart data
    const solvedChart = platformSummaries.filter((p) => p.totalSolved > 0).map((p) => ({ name: p.name, solved: p.totalSolved, color: p.color }));

    // Per-account breakdown for pie
    const accountBreakdown = [];
    for (const p of platformSummaries) {
        for (const a of p.accounts.filter((a) => a.data)) {
            const s = a.data?.stats;
            const solved = s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0;
            if (solved > 0) accountBreakdown.push({ name: `${a.handle} (${p.name})`, solved, color: p.color });
        }
    }

    if (loading) return <div className="dash-status"><Loader2 size={32} className="spin" /><p>Loading dashboard...</p><style>{statusCSS}</style></div>;

    return (
        <div className="master-dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title"><Trophy size={24} /> Dashboard</h1>
                    <p className="dash-subtitle">Welcome back, {user?.displayName || user?.email}!</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {user?.username && (
                        <Link 
                            to={`/portfolio/${user.username}`} 
                            target="_blank" 
                            className="dash-sync-btn" 
                            style={{ background: 'var(--accent)', color: '#fff', border: 'none', textDecoration: 'none' }}
                            title="View your public developer portfolio"
                        >
                            <LayoutTemplate size={16} /> 
                            <span>Portfolio</span>
                        </Link>
                    )}
                    <button className="dash-sync-btn" onClick={fetchAll}><RefreshCw size={16} /> Refresh</button>
                </div>
            </div>

            {/* Grand Stats */}
            <div className="stats-grid grand">
                <Stat icon={Target} label="Total Solved" value={grandSolved} color="var(--accent)" size="lg" />
                <Stat icon={Award} label="Total Contests" value={grandContests} color="#ffa116" size="lg" />
                <Stat icon={Code} label="Platforms" value={linkedPlatforms} color="#6366f1" size="lg" />
                <Stat icon={Brain} label="Deep Work (Min)" value={focusData?.stats?.totalFocusedMinutes || 0} color="#9c27b0" size="lg" />
            </div>

            {/* Platform Cards */}
            <div className="platform-grid">
                {platformSummaries.map((p) => (
                    <a key={p.id} href={p.path} className={`platform-card glass-card ${p.linkedCount ? '' : 'dim'}`}>
                        <div className="platform-card-header">
                            <span className="platform-icon" style={{ background: p.color }}>{p.icon}</span>
                            <span className="platform-name">{p.name}</span>
                            {p.linkedCount > 0 && <ExternalLink size={14} className="muted" />}
                        </div>
                        {p.linkedCount > 0 ? (
                            <div className="platform-body">
                                <div className="platform-stats">
                                    <div className="platform-stat"><span className="ps-value">{p.totalSolved}</span><span className="ps-label">Solved</span></div>
                                    {p.bestRating > 0 && <div className="platform-stat"><span className="ps-value">{p.bestRating}</span><span className="ps-label">Rating</span></div>}
                                    {p.contests > 0 && <div className="platform-stat"><span className="ps-value">{p.contests}</span><span className="ps-label">Contests</span></div>}
                                </div>
                                <div className="platform-accounts">
                                    {p.accounts.filter((a) => a.data).map((a) => (
                                        <span key={a.id} className="account-badge">{a.handle}{a.isPrimary ? ' ★' : ''}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="platform-unlinked">Not linked yet</div>
                        )}
                    </a>
                ))}
            </div>

            <div className="charts-row">
                {/* Solved by Platform */}
                {solvedChart.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Problems Solved by Platform</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={solvedChart}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                                    {solvedChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Per-account breakdown */}
                {accountBreakdown.length > 1 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Solved by Account</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={accountBreakdown} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="solved" nameKey="name"
                                    label={({ name, percent }) => `${name.split(' (')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {accountBreakdown.map((e, i) => <Cell key={i} fill={e.color} opacity={0.7 + (i * 0.1)} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <style>{masterStyles}</style>
        </div>
    );
}

function Stat({ icon: Icon, label, value, color, size }) {
    return (
        <div className={`stat-card glass-card ${size === 'lg' ? 'stat-lg' : ''}`}>
            <div style={{ color }}><Icon size={size === 'lg' ? 24 : 20} /></div>
            <div className="stat-v" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="stat-l">{label}</div>
        </div>
    );
}

const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };
const statusCSS = `.dash-status{display:flex;flex-direction:column;align-items:center;justify-content:center;height:50vh;gap:12px;color:var(--text-secondary)}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`;

const masterStyles = `
    .master-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:10px; font-size:1.5rem; font-weight:800; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    .stats-grid.grand { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px; }
    @media (max-width: 768px) { .stats-grid.grand { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { padding:20px; text-align:center; border-radius:var(--radius-lg); }
    .stat-lg .stat-v { font-size:2rem; }
    .stat-v { font-size:1.4rem; font-weight:800; margin:6px 0 2px; }
    .stat-l { font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }

    .platform-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-bottom:24px; }
    .platform-card { display:block; padding:20px; border-radius:var(--radius-lg); text-decoration:none; color:inherit; transition:all var(--transition-fast); cursor:pointer; }
    .platform-card:hover { transform:translateY(-2px); border-color:var(--accent); }
    .platform-card.dim { opacity:0.5; }
    .platform-card-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .platform-icon { width:32px; height:32px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.6rem; color:#fff; flex-shrink:0; }
    .platform-name { font-weight:700; font-size:0.9375rem; flex:1; }
    .muted { color:var(--text-muted); }
    .platform-body { }
    .platform-stats { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:8px; }
    .platform-stat { display:flex; flex-direction:column; }
    .ps-value { font-size:1.2rem; font-weight:800; }
    .ps-label { font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; }
    .platform-accounts { display:flex; flex-wrap:wrap; gap:6px; }
    .account-badge { font-size:0.7rem; padding:2px 8px; border-radius:var(--radius-sm); background:var(--bg-tertiary); color:var(--text-secondary); font-weight:600; }
    .platform-unlinked { font-size:0.8125rem; color:var(--text-muted); }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9rem; font-weight:700; margin-bottom:14px; }
`;
