import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Trophy, TrendingUp, Target, Award, Users, Code, Calendar, Hash } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const CF_BLUE = '#1a8cff';

export default function Codeforces() {
    const { data, account, accounts, activeIdx, setActiveIdx, loading, error, sync, syncing } = usePlatformData('codeforces');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading Codeforces data...</Status>;
    if (error) return <Status>⚠️ {error}</Status>;
    if (!data) return <Status>No data yet. Sync your account first.</Status>;

    const { profile, stats, ratingHistory, tagDistribution, difficultyDistribution, verdictDistribution, languageDistribution, submissionHeatmap } = data;

    const tagData = Object.entries(tagDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag: tag.length > 13 ? tag.slice(0, 13) + '…' : tag, count }));
    const diffData = Object.entries(difficultyDistribution || {}).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([range, count]) => ({ range, count }));
    const verdictData = Object.entries(verdictDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const langData = Object.entries(languageDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const totalVerdicts = Object.values(verdictDistribution || {}).reduce((a, b) => a + b, 0);
    const heatmapDays = Object.keys(submissionHeatmap || {}).length;

    const getRankColor = (r) => r >= 3000 ? '#aa0000' : r >= 2400 ? '#ff0000' : r >= 2100 ? '#ff8c00' : r >= 1900 ? '#aa00aa' : r >= 1600 ? '#0000ff' : r >= 1400 ? '#03a89e' : r >= 1200 ? '#008000' : '#808080';

    return (
        <div className="platform-dash">
            <DashHeader title="Codeforces" icon="CF" color={CF_BLUE} account={account} accounts={accounts} activeIdx={activeIdx} setActiveIdx={setActiveIdx} sync={sync} syncing={syncing} />

            <div className="stats-grid">
                <Stat icon={TrendingUp} label="Rating" value={stats.currentRating} color={getRankColor(stats.currentRating)} sub={profile.rank} />
                <Stat icon={Award} label="Max Rating" value={stats.maxRating} color={getRankColor(stats.maxRating)} sub={profile.maxRank} />
                <Stat icon={Target} label="Solved" value={stats.problemsSolved} color={CF_BLUE} />
                <Stat icon={Trophy} label="Contests" value={stats.contestsParticipated} color="#ffa116" />
                <Stat icon={Hash} label="Submissions" value={stats.totalSubmissions} color="#6366f1" />
                <Stat icon={Users} label="Friend Of" value={profile.friendOfCount} color="#2f8d46" />
                <Stat icon={Calendar} label="Active Days" value={heatmapDays} color="#ec4899" />
                <Stat icon={Code} label="Contribution" value={profile.contribution} color="#f59e0b" />
            </div>

            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Rating History ({ratingHistory.length} contests)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={ratingHistory}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', year: '2-digit' })} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={['dataMin - 100', 'dataMax + 100']} />
                            <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                            <Line type="monotone" dataKey="newRating" stroke={CF_BLUE} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Tag Mastery (Top 8)</h3>
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

            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Difficulty Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={diffData}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" fill={CF_BLUE} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Languages Used</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={langData.map(([name, value]) => ({ name, value }))} innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {langData.map(([, ], i) => <Cell key={i} fill={LANG_COLORS[i]} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Verdict Distribution</h3>
                    <div className="bar-list">
                        {verdictData.map(([verdict, count]) => {
                            const pct = totalVerdicts ? ((count / totalVerdicts) * 100).toFixed(1) : 0;
                            const color = verdict === 'OK' ? 'var(--success)' : verdict === 'WRONG_ANSWER' ? 'var(--error)' : 'var(--text-muted)';
                            return (
                                <div key={verdict} className="bar-item">
                                    <span className="bar-label">{fmtVerdict(verdict)}</span>
                                    <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                                    <span className="bar-count">{count} ({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Profile Info</h3>
                    <div className="info-list">
                        <InfoRow label="Handle" value={profile.handle} />
                        <InfoRow label="Rank" value={profile.rank} />
                        <InfoRow label="Max Rank" value={profile.maxRank} />
                        {profile.registrationTime && <InfoRow label="Registered" value={new Date(profile.registrationTime).toLocaleDateString()} />}
                        <InfoRow label="Contribution" value={profile.contribution} />
                        <InfoRow label="Friend Of" value={`${profile.friendOfCount} users`} />
                    </div>
                </div>
            </div>

            {ratingHistory.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Recent Contests (Last 10)</h3>
                    <div className="table-wrap">
                        <div className="table-header"><span>Contest</span><span>Rank</span><span>Δ</span><span>New Rating</span></div>
                        {ratingHistory.slice(-10).reverse().map((c, i) => {
                            const delta = c.newRating - c.oldRating;
                            return (
                                <div key={i} className="table-row">
                                    <span className="table-name">{c.contestName?.length > 40 ? c.contestName.slice(0, 40) + '…' : c.contestName}</span>
                                    <span>#{c.rank}</span>
                                    <span className={delta >= 0 ? 'positive' : 'negative'}>{delta >= 0 ? '+' : ''}{delta}</span>
                                    <span className="bold" style={{ color: getRankColor(c.newRating) }}>{c.newRating}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{styles}</style>
        </div>
    );
}

// ── Shared Components (used across all dashboards) ──

function DashHeader({ title, icon, color, account, accounts, activeIdx, setActiveIdx, sync, syncing }) {
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

function InfoRow({ label, value }) {
    return <div className="info-row"><span className="info-label">{label}</span><span className="info-value">{String(value)}</span></div>;
}

function Status({ children }) {
    return <div className="dash-status">{children}<style>{`
        .dash-status { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:8px; color:var(--text-secondary); text-align:center; line-height:1.7; }
        .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
    `}</style></div>;
}

const fmtVerdict = (v) => ({ OK: 'Accepted', WRONG_ANSWER: 'Wrong Answer', TIME_LIMIT_EXCEEDED: 'TLE', RUNTIME_ERROR: 'Runtime Error', COMPILATION_ERROR: 'Compile Error', MEMORY_LIMIT_EXCEEDED: 'MLE' }[v] || v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()));
const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };
const LANG_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

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

    .bar-list { display:flex; flex-direction:column; gap:10px; }
    .bar-item { display:flex; align-items:center; gap:10px; }
    .bar-label { font-size:0.72rem; font-weight:600; min-width:85px; color:var(--text-secondary); }
    .bar-bg { flex:1; height:8px; background:var(--bg-tertiary); border-radius:4px; overflow:hidden; }
    .bar-fill { height:100%; border-radius:4px; transition:width 0.5s; }
    .bar-count { font-size:0.65rem; color:var(--text-muted); min-width:75px; text-align:right; }

    .info-list { display:flex; flex-direction:column; gap:6px; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:0.8rem; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-muted); font-weight:600; }
    .info-value { color:var(--text-primary); text-transform:capitalize; }

    .table-wrap { display:flex; flex-direction:column; gap:2px; }
    .table-header, .table-row { display:grid; grid-template-columns:2fr 0.7fr 0.7fr 0.7fr; padding:8px 12px; font-size:0.8rem; align-items:center; }
    .table-header { color:var(--text-muted); font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); padding-bottom:10px; }
    .table-row { border-radius:var(--radius-sm); transition:background var(--transition-fast); }
    .table-row:hover { background:var(--bg-hover); }
    .table-name { color:var(--text-primary); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .positive { color:var(--success); font-weight:600; }
    .negative { color:var(--error); font-weight:600; }
    .bold { font-weight:700; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
