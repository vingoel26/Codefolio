import { usePlatformData } from '../hooks/usePlatformData';
import { RefreshCw, Loader2, Target, Award, TrendingUp, Zap, Code, Calendar, Flame, Star, Globe } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line,
} from 'recharts';

const LC = '#ffa116';
const COLORS = { Easy: '#00b8a3', Medium: '#ffc01e', Hard: '#ef4743' };
const tooltipStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };

export default function LeetCode() {
    const { data, account, accounts, activeIdx, setActiveIdx, loading, error, sync, syncing } = usePlatformData('leetcode');

    if (loading) return <Status><Loader2 size={28} className="spin" />Loading LeetCode data...</Status>;
    if (error) return <Status>⚠️ {error}</Status>;
    if (!data) return <Status>No LeetCode data yet. Sync your account.</Status>;

    const { profile, stats, contest, contestHistory, badges, activeBadge, difficultyDistribution, tagDistribution, languageDistribution, submissionHeatmap, recentSubmissions } = data;

    const donutData = Object.entries(difficultyDistribution || {}).map(([name, value]) => ({ name, value }));
    const tagData = Object.entries(tagDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag, count]) => ({ tag: tag.length > 14 ? tag.slice(0, 14) + '…' : tag, count }));
    const langData = Object.entries(languageDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([lang, count]) => ({ lang, count }));
    const contestData = (contestHistory || []).map((c) => ({ ...c, date: c.startTime ? new Date(c.startTime * 1000).toLocaleDateString() : '' }));
    const heatmapDays = Object.keys(submissionHeatmap || {}).length;

    return (
        <div className="platform-dash">
            <Header title="LeetCode" icon="LC" color={LC} account={account} accounts={accounts} activeIdx={activeIdx} setActiveIdx={setActiveIdx} sync={sync} syncing={syncing} />

            <div className="stats-grid">
                <Stat icon={Target} label="Total Solved" value={stats.totalSolved} color={LC} />
                <Stat icon={Zap} label="Easy" value={stats.easySolved} color={COLORS.Easy} />
                <Stat icon={Code} label="Medium" value={stats.mediumSolved} color={COLORS.Medium} />
                <Stat icon={Award} label="Hard" value={stats.hardSolved} color={COLORS.Hard} />
                {contest && <Stat icon={TrendingUp} label="Contest Rating" value={contest.rating} color={LC} sub={`Top ${contest.topPercentage}%`} />}
                {contest && <Stat icon={Calendar} label="Contests" value={contest.contestsAttended} color="#6366f1" />}
                <Stat icon={Flame} label="Streak" value={stats.streak || 0} color="#f59e0b" />
                <Stat icon={Globe} label="Active Days" value={stats.totalActiveDays || heatmapDays} color="#ec4899" />
            </div>

            <div className="charts-row">
                <div className="chart-card glass-card" style={{ position: 'relative' }}>
                    <h3 className="chart-title">Difficulty Breakdown</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={donutData} innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                {donutData.map((e) => <Cell key={e.name} fill={COLORS[e.name] || '#888'} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center"><span className="donut-total">{stats.totalSolved}</span><span className="donut-label">Solved</span></div>
                </div>
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Top Problem Tags</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={tagData} layout="vertical">
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis type="category" dataKey="tag" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" fill={LC} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="charts-row">
                {/* Languages */}
                {langData.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Languages Used</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={langData}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                <XAxis dataKey="lang" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Contest Rating History */}
                {contestData.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Contest Rating History</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={contestData}>
                                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="monotone" dataKey="rating" stroke={LC} strokeWidth={2} dot={{ r: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Badges */}
            {badges && badges.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Badges ({badges.length})</h3>
                    <div className="badge-grid">
                        {badges.map((b, i) => (
                            <div key={i} className={`badge-item ${activeBadge?.name === b.name ? 'badge-active' : ''}`}>
                                {b.icon && <img src={b.icon} alt="" className="badge-icon" />}
                                <span className="badge-name">{b.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Profile Info + Recent Submissions side by side */}
            <div className="charts-row">
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Profile</h3>
                    <div className="info-list">
                        {profile.realName && <InfoRow l="Name" v={profile.realName} />}
                        <InfoRow l="Ranking" v={`#${profile.ranking?.toLocaleString()}`} />
                        {profile.company && <InfoRow l="Company" v={profile.company} />}
                        {profile.school && <InfoRow l="School" v={profile.school} />}
                        {profile.countryName && <InfoRow l="Country" v={profile.countryName} />}
                        {profile.skillTags?.length > 0 && <InfoRow l="Skills" v={profile.skillTags.join(', ')} />}
                    </div>
                </div>
                {recentSubmissions?.length > 0 && (
                    <div className="chart-card glass-card">
                        <h3 className="chart-title">Recent Accepted</h3>
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
            </div>

            {/* Contest History Table */}
            {contestData.length > 0 && (
                <div className="chart-card glass-card">
                    <h3 className="chart-title">Contest History (Last 10)</h3>
                    <div className="table-wrap">
                        <div className="table-header"><span>Contest</span><span>Rank</span><span>Solved</span><span>Rating</span></div>
                        {contestData.slice(-10).reverse().map((c, i) => (
                            <div key={i} className="table-row">
                                <span className="table-name">{c.title?.length > 35 ? c.title.slice(0, 35) + '…' : c.title}</span>
                                <span>#{c.ranking}</span>
                                <span>{c.solved}/{c.totalProblems}</span>
                                <span className="bold" style={{ color: LC }}>{c.rating}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{lcStyles}</style>
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
function InfoRow({ l, v }) { return <div className="info-row"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>; }
function Status({ children }) { return <div className="dash-status">{children}<style>{`.dash-status{display:flex;flex-direction:column;align-items:center;justify-content:center;height:50vh;gap:8px;color:var(--text-secondary);text-align:center;line-height:1.7}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>; }

const lcStyles = `
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
    .stat-s { font-size:0.65rem; color:var(--text-secondary); margin-top:2px; }

    .charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { padding:20px; border-radius:var(--radius-lg); }
    .chart-title { font-size:0.9rem; font-weight:700; margin-bottom:14px; }

    .donut-center { position:absolute; top:calc(50% + 16px); left:50%; transform:translate(-50%, -50%); text-align:center; pointer-events:none; }
    .donut-total { font-size:1.5rem; font-weight:900; display:block; color:var(--text-primary); line-height:1; }
    .donut-label { font-size:0.55rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em; font-weight:700; }

    .badge-grid { display:flex; flex-wrap:wrap; gap:10px; }
    .badge-item { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:var(--radius-md); background:var(--bg-tertiary); border:1px solid var(--border); font-size:0.75rem; font-weight:600; color:var(--text-secondary); }
    .badge-active { border-color:${LC}; color:${LC}; }
    .badge-icon { width:20px; height:20px; }
    .badge-name { white-space:nowrap; }

    .info-list { display:flex; flex-direction:column; gap:6px; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:0.8rem; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-muted); font-weight:600; }
    .info-value { color:var(--text-primary); }

    .sub-list { display:flex; flex-direction:column; gap:2px; }
    .sub-item { display:flex; justify-content:space-between; padding:6px 10px; border-radius:var(--radius-sm); text-decoration:none; color:inherit; transition:background var(--transition-fast); }
    .sub-item:hover { background:var(--bg-hover); }
    .sub-title { color:var(--text-primary); font-weight:500; font-size:0.8rem; }
    .sub-time { color:var(--text-muted); font-size:0.72rem; }

    .table-wrap { display:flex; flex-direction:column; gap:2px; }
    .table-header, .table-row { display:grid; grid-template-columns:2fr 0.7fr 0.7fr 0.7fr; padding:8px 12px; font-size:0.8rem; align-items:center; }
    .table-header { color:var(--text-muted); font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); padding-bottom:10px; }
    .table-row { border-radius:var(--radius-sm); transition:background var(--transition-fast); }
    .table-row:hover { background:var(--bg-hover); }
    .table-name { color:var(--text-primary); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bold { font-weight:700; }
`;
