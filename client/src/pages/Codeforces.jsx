import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Trophy, TrendingUp, Target, Award, Users } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, CartesianGrid,
} from 'recharts';

const CF_BLUE = '#1a8cff';

export default function Codeforces() {
    const { data, account, loading, error, sync } = usePlatformData('codeforces');

    if (loading) return <DashLoading platform="Codeforces" />;
    if (error) return <DashError platform="Codeforces" error={error} />;
    if (!data) return <DashEmpty platform="Codeforces" />;

    const { profile, stats, ratingHistory, tagDistribution, difficultyDistribution, verdictDistribution } = data;

    // Prepare tag radar data (top 8)
    const tagData = Object.entries(tagDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag: tag.length > 12 ? tag.slice(0, 12) + '…' : tag, count }));

    // Prepare difficulty bar data
    const diffData = Object.entries(difficultyDistribution || {})
        .sort((a, b) => {
            const aNum = parseInt(a[0]);
            const bNum = parseInt(b[0]);
            return aNum - bNum;
        })
        .map(([range, count]) => ({ range, count }));

    // Verdict pie data
    const verdictData = Object.entries(verdictDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    // Rating color
    const getRankColor = (rating) => {
        if (rating >= 3000) return '#aa0000';
        if (rating >= 2400) return '#ff0000';
        if (rating >= 2100) return '#ff8c00';
        if (rating >= 1900) return '#aa00aa';
        if (rating >= 1600) return '#0000ff';
        if (rating >= 1400) return '#03a89e';
        if (rating >= 1200) return '#008000';
        return '#808080';
    };

    return (
        <div className="cf-dashboard">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">
                        <span className="dash-icon" style={{ background: CF_BLUE }}>CF</span>
                        Codeforces
                    </h1>
                    <p className="dash-subtitle">
                        {account?.handle} · Last synced {account?.lastSync ? new Date(account.lastSync).toLocaleString() : 'never'}
                    </p>
                </div>
                <button className="dash-sync-btn" onClick={sync} title="Sync now">
                    <RefreshCw size={16} /> Sync
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <StatCard icon={TrendingUp} label="Rating" value={stats.currentRating} color={getRankColor(stats.currentRating)} sub={profile.rank} />
                <StatCard icon={Award} label="Max Rating" value={stats.maxRating} color={getRankColor(stats.maxRating)} sub={profile.maxRank} />
                <StatCard icon={Target} label="Problems Solved" value={stats.problemsSolved} color={CF_BLUE} />
                <StatCard icon={Trophy} label="Contests" value={stats.contestsParticipated} color="#ffa116" />
                <StatCard icon={Users} label="Friend Of" value={profile.friendOfCount} color="#2f8d46" />
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Rating Chart */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Rating History</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={ratingHistory}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', year: '2-digit' })} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={['dataMin - 100', 'dataMax + 100']} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                            <Line type="monotone" dataKey="newRating" stroke={CF_BLUE} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Tag Radar */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Tag Mastery</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={tagData}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey="tag" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                            <Radar dataKey="count" stroke={CF_BLUE} fill={CF_BLUE} fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Second Row */}
            <div className="charts-row">
                {/* Difficulty Distribution */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Difficulty Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={diffData}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" fill={CF_BLUE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Verdict Summary */}
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Verdict Distribution</h3>
                    <div className="verdict-list">
                        {verdictData.map(([verdict, count]) => {
                            const total = Object.values(verdictDistribution).reduce((a, b) => a + b, 0);
                            const pct = ((count / total) * 100).toFixed(1);
                            const color = verdict === 'OK' ? 'var(--success)' : verdict === 'WRONG_ANSWER' ? 'var(--error)' : 'var(--text-muted)';
                            return (
                                <div key={verdict} className="verdict-item">
                                    <span className="verdict-label">{formatVerdict(verdict)}</span>
                                    <div className="verdict-bar-bg">
                                        <div className="verdict-bar" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span className="verdict-count">{count} ({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Contests */}
            {ratingHistory.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Recent Contests</h3>
                    <div className="contest-table">
                        <div className="contest-header">
                            <span>Contest</span><span>Rank</span><span>Rating Δ</span><span>New Rating</span>
                        </div>
                        {ratingHistory.slice(-10).reverse().map((c, i) => {
                            const delta = c.newRating - c.oldRating;
                            return (
                                <div key={i} className="contest-row">
                                    <span className="contest-name">{c.contestName?.length > 40 ? c.contestName.slice(0, 40) + '…' : c.contestName}</span>
                                    <span className="contest-rank">#{c.rank}</span>
                                    <span className={`contest-delta ${delta >= 0 ? 'pos' : 'neg'}`}>
                                        {delta >= 0 ? '+' : ''}{delta}
                                    </span>
                                    <span className="contest-rating" style={{ color: getRankColor(c.newRating) }}>{c.newRating}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{dashStyles}</style>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="stat-card glass-card">
            <div className="stat-icon" style={{ color }}><Icon size={20} /></div>
            <div className="stat-value" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

function DashLoading({ platform }) {
    return <div className="dash-status"><Loader2 size={28} className="spin" /><p>Loading {platform} data...</p><style>{`
        .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:12px; color:var(--text-secondary); }
        .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
    `}</style></div>;
}
function DashError({ platform, error }) {
    return <div className="dash-status"><p>⚠️ {error}</p><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Link a {platform} account in Settings → Accounts to see data.</p><style>{`
        .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:8px; color:var(--text-secondary); }
    `}</style></div>;
}
function DashEmpty({ platform }) {
    return <div className="dash-status"><p>No {platform} data yet. Sync your account first.</p><style>{`
        .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:8px; color:var(--text-secondary); }
    `}</style></div>;
}

function formatVerdict(v) {
    const map = { OK: 'Accepted', WRONG_ANSWER: 'Wrong Answer', TIME_LIMIT_EXCEEDED: 'TLE', RUNTIME_ERROR: 'Runtime Error', COMPILATION_ERROR: 'Compile Error', MEMORY_LIMIT_EXCEEDED: 'MLE' };
    return map[v] || v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const dashStyles = `
    .cf-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:12px; font-size:1.5rem; font-weight:800; }
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.7rem; color:#fff; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:14px; margin-bottom:20px; }
    .stat-card { padding:18px; text-align:center; border-radius:var(--radius-lg); }
    .stat-icon { margin-bottom:8px; }
    .stat-value { font-size:1.5rem; font-weight:800; margin-bottom:2px; }
    .stat-label { font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
    .stat-sub { font-size:0.6875rem; color:var(--text-secondary); margin-top:2px; text-transform:capitalize; }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9375rem; font-weight:700; margin-bottom:16px; }

    .verdict-list { display:flex; flex-direction:column; gap:10px; }
    .verdict-item { display:flex; align-items:center; gap:10px; }
    .verdict-label { font-size:0.75rem; font-weight:600; min-width:90px; color:var(--text-secondary); }
    .verdict-bar-bg { flex:1; height:8px; background:var(--bg-tertiary); border-radius:4px; overflow:hidden; }
    .verdict-bar { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .verdict-count { font-size:0.6875rem; color:var(--text-muted); min-width:80px; text-align:right; }

    .contest-table { display:flex; flex-direction:column; gap:2px; }
    .contest-header, .contest-row { display:grid; grid-template-columns:2fr 0.7fr 0.7fr 0.7fr; padding:8px 12px; font-size:0.8125rem; align-items:center; }
    .contest-header { color:var(--text-muted); font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); padding-bottom:10px; }
    .contest-row { border-radius:var(--radius-sm); transition:background var(--transition-fast); }
    .contest-row:hover { background:var(--bg-hover); }
    .contest-name { color:var(--text-primary); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .contest-rank { color:var(--text-secondary); }
    .contest-delta.pos { color:var(--success); font-weight:600; }
    .contest-delta.neg { color:var(--error); font-weight:600; }
    .contest-rating { font-weight:700; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
