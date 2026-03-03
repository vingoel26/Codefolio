import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Star, TrendingUp, Target, Award } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const CC_BROWN = '#5b4638';

export default function CodeChef() {
    const { data, account, loading, error, sync } = usePlatformData('codechef');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading CodeChef data...</Status>;
    if (error) return <Status>⚠️ {error}<br /><small>Link a CodeChef account in Settings → Accounts</small></Status>;
    if (!data) return <Status>No CodeChef data yet. Sync your account first.</Status>;

    const { profile, stats, ratingHistory } = data;

    const ratingData = (ratingHistory || []).map((c) => ({
        ...c,
        name: c.name || c.code,
        date: c.date || '',
    }));

    return (
        <div className="cc-dashboard">
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">
                        <span className="dash-icon" style={{ background: CC_BROWN }}>CC</span>
                        CodeChef
                    </h1>
                    <p className="dash-subtitle">
                        {account?.handle} · Last synced {account?.lastSync ? new Date(account.lastSync).toLocaleString() : 'never'}
                    </p>
                </div>
                <button className="dash-sync-btn" onClick={sync}><RefreshCw size={16} /> Sync</button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <StatCard icon={TrendingUp} label="Rating" value={stats.currentRating} color={CC_BROWN} sub={`${profile.stars}★`} />
                <StatCard icon={Award} label="Highest Rating" value={stats.highestRating} color="#d97706" />
                <StatCard icon={Target} label="Problems Solved" value={stats.totalProblemsSolved} color="#059669" />
                <StatCard icon={Star} label="Contests" value={stats.contestsParticipated} color="#6366f1" />
            </div>

            {/* Rating Chart */}
            {ratingData.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Rating History</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={ratingData}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval="preserveStartEnd"
                                tickFormatter={(d) => { try { return new Date(d).toLocaleDateString('en', { month: 'short', year: '2-digit' }); } catch { return d; } }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                                labelFormatter={(d) => { try { return new Date(d).toLocaleDateString(); } catch { return d; } }}
                                formatter={(value, name) => [value, 'Rating']} />
                            <Line type="monotone" dataKey="rating" stroke={CC_BROWN} strokeWidth={2} dot={{ r: 3, fill: CC_BROWN }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Recent Contests */}
            {ratingData.length > 0 && (
                <div className="chart-card glass-card" style={{ marginTop: 16 }}>
                    <h3 className="chart-title">Recent Contests</h3>
                    <div className="contest-table">
                        <div className="contest-header">
                            <span>Contest</span><span>Rank</span><span>Rating</span>
                        </div>
                        {ratingData.slice(-10).reverse().map((c, i) => (
                            <div key={i} className="contest-row">
                                <span className="contest-name">{c.name?.length > 45 ? c.name.slice(0, 45) + '…' : c.name}</span>
                                <span className="contest-rank">#{c.rank}</span>
                                <span className="contest-rating">{c.rating}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{ccStyles}</style>
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

const ccStyles = `
    .cc-dashboard { max-width: 1100px; margin: 0 auto; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
    .dash-title { display:flex; align-items:center; gap:12px; font-size:1.5rem; font-weight:800; }
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.7rem; color:#fff; }
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

    .contest-table { display:flex; flex-direction:column; gap:2px; }
    .contest-header, .contest-row { display:grid; grid-template-columns:2fr 0.7fr 0.7fr; padding:8px 12px; font-size:0.8125rem; align-items:center; }
    .contest-header { color:var(--text-muted); font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); padding-bottom:10px; }
    .contest-row { border-radius:var(--radius-sm); transition:background var(--transition-fast); }
    .contest-row:hover { background:var(--bg-hover); }
    .contest-name { color:var(--text-primary); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .contest-rank { color:var(--text-secondary); }
    .contest-rating { font-weight:700; color:${CC_BROWN}; }
`;
