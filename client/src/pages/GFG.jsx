import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Target, Award, Code, Flame, BookOpen } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const GFG = '#2f8d46';
const DIFF_COLORS = { School: '#9ca3af', Basic: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f87171' };
const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };

export default function GFGPage() {
    const { data, account, accounts, activeIdx, setActiveIdx, loading, error, sync, syncing } = usePlatformData('gfg');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading GFG data...</Status>;
    if (error) return <Status>⚠️ {error}</Status>;
    if (!data) return <Status>No GFG data yet. Sync your account.</Status>;

    const { profile, stats, difficultyDistribution } = data;
    const diffData = Object.entries(difficultyDistribution || {}).filter(([, v]) => v > 0).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count, color: DIFF_COLORS[name.charAt(0).toUpperCase() + name.slice(1)] || GFG }));
    const totalSolved = diffData.reduce((sum, d) => sum + d.count, 0) || stats.totalProblemsSolved;

    return (
        <div className="platform-dash">
            <Header title="GeeksforGeeks" icon="GFG" color={GFG} account={account} accounts={accounts} activeIdx={activeIdx} setActiveIdx={setActiveIdx} sync={sync} syncing={syncing} />

            <div className="stats-grid">
                <Stat icon={Award} label="Coding Score" value={stats.codingScore} color={GFG} />
                <Stat icon={Target} label="Total Solved" value={stats.totalProblemsSolved || totalSolved} color="#6366f1" />
                <Stat icon={Flame} label="Streak" value={profile.streak} color="#f59e0b" sub={`Max: ${profile.maxStreak}`} />
                <Stat icon={Code} label="Monthly Score" value={stats.monthlyCodingScore} color="#ec4899" />
            </div>

            <div className="charts-row">
                {/* Difficulty Breakdown */}
                {diffData.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Difficulty Breakdown</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={diffData}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {diffData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Profile Info */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Profile</h3>
                    <div className="info-list">
                        <InfoRow l="Handle" v={profile.handle} />
                        {profile.name && profile.name !== profile.handle && <InfoRow l="Name" v={profile.name} />}
                        {profile.institute && <InfoRow l="Institute" v={profile.institute} />}
                        {profile.rank && <InfoRow l="Institute Rank" v={profile.rank} />}
                        <InfoRow l="Coding Score" v={stats.codingScore} />
                        <InfoRow l="Problems Solved" v={stats.totalProblemsSolved || totalSolved} />
                        <InfoRow l="Current Streak" v={`${profile.streak} days`} />
                        <InfoRow l="Max Streak" v={`${profile.maxStreak} days`} />
                        <InfoRow l="Monthly Score" v={stats.monthlyCodingScore} />
                    </div>
                </div>
            </div>

            {/* Difficulty Details */}
            {diffData.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Problems by Difficulty</h3>
                    <div className="diff-cards">
                        {diffData.map((d) => (
                            <div key={d.name} className="diff-card" style={{ borderLeft: `3px solid ${d.color}` }}>
                                <span className="diff-count" style={{ color: d.color }}>{d.count}</span>
                                <span className="diff-name">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{styles}</style>
        </div>
    );
}

function Header({ title, icon, color, account, accounts, activeIdx, setActiveIdx, sync, syncing }) {
    return (
        <div className="dash-header">
            <div>
                <h1 className="dash-title"><span className="dash-icon" style={{ background: color }}>{icon}</span>{title}</h1>
                <p className="dash-subtitle">{account?.handle} · Last synced {account?.lastSync ? new Date(account.lastSync).toLocaleString() : 'never'}</p>
            </div>
            <div className="dash-actions">
                {accounts.length > 1 && (
                    <select className="account-select" value={activeIdx} onChange={(e) => setActiveIdx(parseInt(e.target.value))}>
                        {accounts.map((a, i) => <option key={a.id} value={i}>{a.handle}{a.label ? ` (${a.label})` : ''}{a.isPrimary ? ' ★' : ''}</option>)}
                    </select>
                )}
                <button className="dash-sync-btn" onClick={sync} disabled={syncing}>
                    {syncing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={16} />} Sync
                </button>
            </div>
        </div>
    );
}

function Stat({ icon: I, label, value, color, sub }) {
    return (
        <div className="stat-card glass-card">
            <div style={{ color }}><I size={18} /></div>
            <div className="stat-v" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="stat-l">{label}</div>
            {sub && <div className="stat-s">{sub}</div>}
        </div>
    );
}
function InfoRow({ l, v }) { return <div className="info-row"><span className="info-label">{l}</span><span className="info-value">{String(v)}</span></div>; }
function Status({ children }) { return <div className="dash-status">{children}<style>{`.dash-status{display:flex;flex-direction:column;align-items:center;justify-content:center;height:50vh;gap:8px;color:var(--text-secondary);text-align:center;line-height:1.7}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>; }

const styles = `
    .platform-dash { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .dash-title { display:flex; align-items:center; gap:12px; font-size:1.5rem; font-weight:800; }
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.6rem; color:#fff; flex-shrink:0; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-actions { display:flex; gap:8px; align-items:center; }
    .account-select { padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }
    .dash-sync-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:20px; }
    .stat-card { padding:16px; text-align:center; border-radius:var(--radius-lg); }
    .stat-v { font-size:1.35rem; font-weight:800; margin:4px 0 2px; }
    .stat-l { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
    .stat-s { font-size:0.65rem; color:var(--text-secondary); margin-top:2px; }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9rem; font-weight:700; margin-bottom:14px; }

    .info-list { display:flex; flex-direction:column; gap:6px; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:0.8rem; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-muted); font-weight:600; }
    .info-value { color:var(--text-primary); }

    .diff-cards { display:flex; flex-wrap:wrap; gap:12px; }
    .diff-card { padding:12px 18px; background:var(--bg-tertiary); border-radius:var(--radius-md); display:flex; flex-direction:column; align-items:center; gap:4px; min-width:80px; }
    .diff-count { font-size:1.5rem; font-weight:800; }
    .diff-name { font-size:0.72rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; }
`;
