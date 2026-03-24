import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Star, TrendingUp, Target, Award, Globe, Flag } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const CC = '#5b4638';
const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };

export default function CodeChef() {
    const { data, account, accounts, activeIdx, setActiveIdx, loading, error, sync, syncing } = usePlatformData('codechef');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading CodeChef data...</Status>;
    if (error) return <Status>⚠️ {error}</Status>;
    if (!data) return <Status>No CodeChef data yet. Sync your account.</Status>;

    const { profile, stats, ratingHistory } = data;
    const ratingData = (ratingHistory || []).map((c) => ({ ...c, name: c.name || c.code }));

    return (
        <div className="platform-dash">
            <Header title="CodeChef" icon="CC" color={CC} account={account} accounts={accounts} activeIdx={activeIdx} setActiveIdx={setActiveIdx} sync={sync} syncing={syncing} />

            <div className="stats-grid">
                <Stat icon={TrendingUp} label="Rating" value={stats.currentRating} color={CC} sub={`${profile.stars || 0}★`} />
                <Stat icon={Award} label="Highest Rating" value={stats.highestRating} color="#d97706" />
                <Stat icon={Target} label="Problems Solved" value={stats.totalProblemsSolved} color="#059669" />
                <Stat icon={Star} label="Contests" value={stats.contestsParticipated} color="#6366f1" />
                {profile.globalRank > 0 && <Stat icon={Globe} label="Global Rank" value={`#${profile.globalRank}`} color="#3b82f6" />}
                {profile.countryRank > 0 && <Stat icon={Flag} label="Country Rank" value={`#${profile.countryRank}`} color="#ec4899" />}
            </div>

            {/* Profile Info */}
            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Profile</h3>
                    <div className="info-list">
                        <InfoRow l="Handle" v={profile.handle} />
                        <InfoRow l="Name" v={profile.name} />
                        <InfoRow l="Stars" v={'★'.repeat(profile.stars || 0) || 'Unrated'} />
                        <InfoRow l="Rating" v={stats.currentRating} />
                        <InfoRow l="Highest" v={stats.highestRating} />
                        {profile.globalRank > 0 && <InfoRow l="Global Rank" v={`#${profile.globalRank}`} />}
                        {profile.countryRank > 0 && <InfoRow l="Country Rank" v={`#${profile.countryRank}`} />}
                    </div>
                </div>

                {/* Rating Chart */}
                {ratingData.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Rating History ({ratingData.length} contests)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={ratingData}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd"
                                    tickFormatter={(d) => { try { return new Date(d).toLocaleDateString('en', { month: 'short', year: '2-digit' }); } catch { return d; } }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Rating']} />
                                <Line type="monotone" dataKey="rating" stroke={CC} strokeWidth={2} dot={{ r: 3, fill: CC }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Recent Contests Table */}
            {ratingData.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Contest History (Last 10)</h3>
                    <div className="table-wrap">
                        <div className="table-header"><span>Contest</span><span>Rank</span><span>Rating</span></div>
                        {ratingData.slice(-10).reverse().map((c, i) => (
                            <div key={i} className="table-row">
                                <span className="table-name">{c.name?.length > 45 ? c.name.slice(0, 45) + '…' : c.name}</span>
                                <span>#{c.rank}</span>
                                <span className="bold" style={{ color: CC }}>{c.rating}</span>
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
    .dash-icon { width:36px; height:36px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.7rem; color:#fff; flex-shrink:0; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-actions { display:flex; gap:8px; align-items:center; }
    .account-select { padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }
    .dash-sync-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:20px; }
    .stat-card { padding:16px; text-align:center; border-radius:var(--radius-lg); }
    .stat-v { font-size:1.35rem; font-weight:800; margin:4px 0 2px; }
    .stat-l { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }
    .stat-s { font-size:0.65rem; color:var(--text-secondary); margin-top:2px; text-transform:capitalize; }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9rem; font-weight:700; margin-bottom:14px; }

    .info-list { display:flex; flex-direction:column; gap:6px; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:0.8rem; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-muted); font-weight:600; }
    .info-value { color:var(--text-primary); }

    .table-wrap { display:flex; flex-direction:column; gap:2px; }
    .table-header, .table-row { display:grid; grid-template-columns:2fr 0.7fr 0.7fr; padding:8px 12px; font-size:0.8rem; align-items:center; }
    .table-header { color:var(--text-muted); font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); padding-bottom:10px; }
    .table-row { border-radius:var(--radius-sm); transition:background var(--transition-fast); }
    .table-row:hover { background:var(--bg-hover); }
    .table-name { color:var(--text-primary); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bold { font-weight:700; }
`;
