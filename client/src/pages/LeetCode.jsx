import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Target, Award, TrendingUp, Zap, Code, Calendar } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const LC_ORANGE = '#ffa116';
const COLORS = { Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ef4743' };

export default function LeetCode() {
    const { data, account, loading, error, sync } = usePlatformData('leetcode');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading LeetCode data...</Status>;
    if (error) return <Status>⚠️ {error}<br /><small>Link a LeetCode account in Settings → Accounts</small></Status>;
    if (!data) return <Status>No LeetCode data yet. Sync your account first.</Status>;

    const { profile, stats, contest, difficultyDistribution, tagDistribution, recentSubmissions } = data;

    const donutData = Object.entries(difficultyDistribution || {}).map(([name, value]) => ({ name, value }));
    const tagData = Object.entries(tagDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tag, count]) => ({ tag: tag.length > 14 ? tag.slice(0, 14) + '…' : tag, count }));

    return (
        <div className="lc-dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">
                        <span className="dash-icon" style={{ background: LC_ORANGE }}>LC</span>
                        LeetCode
                    </h1>
                    <p className="dash-subtitle">
                        {account?.handle} · Last synced {account?.lastSync ? new Date(account.lastSync).toLocaleString() : 'never'}
                    </p>
                </div>
                <button className="dash-sync-btn" onClick={sync}><RefreshCw size={16} /> Sync</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <StatCard icon={Target} label="Total Solved" value={stats.totalSolved} color={LC_ORANGE} />
                <StatCard icon={Zap} label="Easy" value={stats.easySolved} color={COLORS.Easy} />
                <StatCard icon={Code} label="Medium" value={stats.mediumSolved} color={COLORS.Medium} />
                <StatCard icon={Award} label="Hard" value={stats.hardSolved} color={COLORS.Hard} />
                {contest && <StatCard icon={TrendingUp} label="Contest Rating" value={contest.rating} color={LC_ORANGE} sub={`Top ${contest.topPercentage}%`} />}
                {contest && <StatCard icon={Calendar} label="Contests" value={contest.contestsAttended} color="#6366f1" />}
            </div>

            <div className="charts-row">
                {/* Difficulty Donut */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Difficulty Breakdown</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={donutData} innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`} labelLine={false} >
                                {donutData.map((entry) => (
                                    <Cell key={entry.name} fill={COLORS[entry.name] || '#888'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                        <span className="donut-total">{stats.totalSolved}</span>
                        <span className="donut-label">Solved</span>
                    </div>
                </div>

                {/* Topic Tags */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Top Problem Tags</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={tagData} layout="vertical">
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis type="category" dataKey="tag" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" fill={LC_ORANGE} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Submissions */}
            {recentSubmissions?.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Recent Accepted Submissions</h3>
                    <div className="sub-list">
                        {recentSubmissions.slice(0, 10).map((s, i) => (
                            <a key={i} className="sub-item" href={`https://leetcode.com/problems/${s.titleSlug}`} target="_blank" rel="noopener noreferrer">
                                <span className="sub-title">{s.title}</span>
                                <span className="sub-time">{new Date(s.timestamp * 1000).toLocaleDateString()}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <style>{lcStyles}</style>
        </div>
    );
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

const lcStyles = `
    .lc-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:12px; font-size:1.5rem; font-weight:800; }
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.7rem; color:#fff; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:14px; margin-bottom:20px; }
    .stat-card { padding:18px; text-align:center; border-radius:var(--radius-lg); }
    .stat-value { font-size:1.4rem; font-weight:800; margin:4px 0 2px; }
    .stat-label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
    .stat-sub { font-size:0.6875rem; color:var(--text-secondary); margin-top:2px; }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); position:relative; }
    .chart-title { font-size:0.9375rem; font-weight:700; margin-bottom:16px; }

    .donut-center { position:absolute; top:50%; left:50%; transform:translate(-130%, -30%); text-align:center; pointer-events:none; }
    .donut-total { font-size:1.5rem; font-weight:800; display:block; color:var(--text-primary); }
    .donut-label { font-size:0.6875rem; color:var(--text-muted); text-transform:uppercase; }

    .sub-list { display:flex; flex-direction:column; gap:2px; }
    .sub-item { display:flex; justify-content:space-between; padding:8px 12px; border-radius:var(--radius-sm); text-decoration:none; color:inherit; transition:background var(--transition-fast); }
    .sub-item:hover { background:var(--bg-hover); }
    .sub-title { color:var(--text-primary); font-weight:500; font-size:0.8125rem; }
    .sub-time { color:var(--text-muted); font-size:0.75rem; }
`;
