import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Target, Award, Code, Flame } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const GFG_GREEN = '#2f8d46';
const DIFF_COLORS = { school: '#9ca3af', basic: '#60a5fa', easy: '#34d399', medium: '#fbbf24', hard: '#f87171' };

export default function GFG() {
    const { data, account, loading, error, sync } = usePlatformData('gfg');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading GFG data...</Status>;
    if (error) return <Status>⚠️ {error}<br /><small>Link a GFG account in Settings → Accounts</small></Status>;
    if (!data) return <Status>No GFG data yet. Sync your account first.</Status>;

    const { profile, stats, difficultyDistribution } = data;

    const diffData = Object.entries(difficultyDistribution || {})
        .filter(([, v]) => v > 0)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count, color: DIFF_COLORS[name] || GFG_GREEN }));

    return (
        <div className="gfg-dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">
                        <span className="dash-icon" style={{ background: GFG_GREEN }}>GFG</span>
                        GeeksforGeeks
                    </h1>
                    <p className="dash-subtitle">
                        {account?.handle} · Last synced {account?.lastSync ? new Date(account.lastSync).toLocaleString() : 'never'}
                    </p>
                </div>
                <button className="dash-sync-btn" onClick={sync}><RefreshCw size={16} /> Sync</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <StatCard icon={Award} label="Coding Score" value={stats.codingScore} color={GFG_GREEN} />
                <StatCard icon={Target} label="Problems Solved" value={stats.totalProblemsSolved} color="#6366f1" />
                <StatCard icon={Flame} label="Current Streak" value={profile.streak} color="#f59e0b" sub={`Max: ${profile.maxStreak}`} />
                <StatCard icon={Code} label="Monthly Score" value={stats.monthlyCodingScore} color="#ec4899" />
            </div>

            {/* Difficulty Breakdown */}
            {diffData.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Difficulty Breakdown</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={diffData}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {diffData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Profile Info */}
            {(profile.institute || profile.rank) && (
                <div className="chart-card glass-card" style={{ marginTop: 16 }}>
                    <h3 className="chart-title">Profile</h3>
                    <div className="profile-info">
                        {profile.name && <InfoRow label="Name" value={profile.name} />}
                        {profile.institute && <InfoRow label="Institute" value={profile.institute} />}
                        {profile.rank && <InfoRow label="Institute Rank" value={profile.rank} />}
                    </div>
                </div>
            )}

            <style>{gfgStyles}</style>
        </div>
    );
}

function InfoRow({ label, value }) {
    return <div className="info-row"><span className="info-label">{label}</span><span className="info-value">{value}</span></div>;
}

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="stat-card glass-card">
            <div style={{ color }}><Icon size={20} /></div>
            <div className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

function Status({ children }) {
    return <div className="dash-status">{children}<style>{`
        .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:8px; color:var(--text-secondary); text-align:center; line-height:1.7; }
        .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
    `}</style></div>;
}

const gfgStyles = `
    .gfg-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:12px; font-size:1.5rem; font-weight:800; }
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.6rem; color:#fff; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:14px; margin-bottom:20px; }
    .stat-card { padding:18px; text-align:center; border-radius:var(--radius-lg); }
    .stat-value { font-size:1.4rem; font-weight:800; margin:4px 0 2px; }
    .stat-label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
    .stat-sub { font-size:0.6875rem; color:var(--text-secondary); margin-top:2px; }

    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9375rem; font-weight:700; margin-bottom:16px; }

    .profile-info { display:flex; flex-direction:column; gap:8px; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-muted); font-size:0.8125rem; font-weight:600; }
    .info-value { color:var(--text-primary); font-size:0.8125rem; }
`;
