import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
    User, Edit3, Save, X, Target, TrendingUp, Trophy, Code, Calendar,
    ExternalLink, Loader2, Copy, Check, Share2, UserPlus, UserMinus, Users
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import ContributionCity from '../components/profile/ContributionCity';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLATFORM_META = {
    codeforces: { name: 'Codeforces', color: 'var(--codeforces)', icon: 'CF', urlPrefix: 'https://codeforces.com/profile/' },
    leetcode:   { name: 'LeetCode',   color: 'var(--leetcode)',   icon: 'LC', urlPrefix: 'https://leetcode.com/u/' },
    codechef:   { name: 'CodeChef',   color: 'var(--codechef)',   icon: 'CC', urlPrefix: 'https://www.codechef.com/users/' },
    gfg:        { name: 'GeeksforGeeks', color: 'var(--gfg)',     icon: 'GFG', urlPrefix: 'https://www.geeksforgeeks.org/user/' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Use YYYY-MM-DD string keys to avoid timezone issues with getTime()
function dateToKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function generateDates() {
    const dates = [];
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - 364);
    while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
    const end = new Date(); end.setHours(0,0,0,0);
    while (d <= end) { dates.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return dates;
}

function buildHeatmapData(heatmaps) {
    const map = new Map();
    for (const hm of heatmaps) {
        if (!hm) continue;
        for (const [key, count] of Object.entries(hm)) {
            let dateStr;
            if (key.includes('-')) {
                // ISO date string like "2025-03-10"
                dateStr = key.slice(0, 10);
            } else {
                // Unix timestamp (seconds or milliseconds)
                const ts = key.length > 10 ? Math.floor(parseInt(key) / 1000) : parseInt(key);
                const d = new Date(ts * 1000);
                dateStr = dateToKey(d);
            }
            const val = typeof count === 'number' ? count : 1;
            map.set(dateStr, (map.get(dateStr) || 0) + val);
        }
    }
    return map;
}

function getLevel(c) { return c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 10 ? 3 : 4; }

// ═══════════════════════════════════════════
// Profile Page (works BOTH inside Layout @ /profile AND standalone @ /u/:username)
// ═══════════════════════════════════════════

export default function Profile({ standalone = false }) {
    const { username: paramUsername } = useParams();
    const { user: currentUser, accessToken, updateProfile } = useAuthStore();

    // If inside the main app (/profile), it's always the owner
    const isOwner = !standalone || (currentUser?.username && currentUser.username === paramUsername);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editing state
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Heatmap tooltip state
    const [hoverCell, setHoverCell] = useState(null);
    const [usernameError, setUsernameError] = useState('');

    // Social state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!standalone && accessToken) {
                // ── Inside the Layout: use authenticated endpoints (like Dashboard) ──
                const PLATS = [
                    { id: 'codeforces', name: 'Codeforces' },
                    { id: 'leetcode', name: 'LeetCode' },
                    { id: 'codechef', name: 'CodeChef' },
                    { id: 'gfg', name: 'GeeksforGeeks' },
                ];
                const results = {};
                await Promise.all(
                    PLATS.map(async (p) => {
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

                // Extract stats using SAME logic as Dashboard.jsx
                let grandTotalSolved = 0, bestRating = 0, totalContests = 0;
                const platforms = [];

                for (const p of PLATS) {
                    const accounts = results[p.id] || [];
                    const linked = accounts.filter(a => a.data);
                    if (linked.length === 0) continue;

                    let platSolved = 0, platRating = 0, platContests = 0;
                    let heatmap = null;

                    for (const a of linked) {
                        const s = a.data?.stats;
                        const c = a.data?.contest;
                        // Same generic fallback as Dashboard
                        platSolved += s?.problemsSolved || s?.totalSolved || s?.totalProblemsSolved || 0;
                        const r = s?.currentRating || c?.rating || a.data?.profile?.rating || s?.codingScore || 0;
                        if (r > platRating) platRating = r;
                        platContests += s?.contestsParticipated || c?.contestsAttended || 0;
                        // Grab heatmap from primary or first available
                        if (!heatmap && a.data?.submissionHeatmap) heatmap = a.data.submissionHeatmap;
                    }

                    grandTotalSolved += platSolved;
                    totalContests += platContests;
                    if (platRating > bestRating) bestRating = platRating;

                    const primary = accounts.find(a => a.isPrimary) || accounts[0];
                    platforms.push({
                        platform: p.id,
                        handle: primary?.handle || '—',
                        solved: platSolved,
                        rating: platRating,
                        contests: platContests,
                        heatmap,
                    });
                }

                // Fetch the social counts via the public endpoint
                let socialData = { followersCount: 0, followingCount: 0 };
                try {
                    const username = currentUser?.username || currentUser?.email?.split('@')[0];
                    const socialRes = await fetch(`${API_URL}/users/u/${username}`);
                    if (socialRes.ok) {
                        const sJson = await socialRes.json();
                        socialData.followersCount = sJson.profile.followersCount || 0;
                        socialData.followingCount = sJson.profile.followingCount || 0;
                    }
                } catch (e) {
                    console.error("Failed to fetch social stats for dashboard profile", e);
                }

                setData({
                    profile: {
                        username: currentUser?.username || currentUser?.email?.split('@')[0],
                        displayName: currentUser?.displayName,
                        avatarUrl: currentUser?.avatarUrl,
                        bio: currentUser?.bio,
                        joinedAt: currentUser?.createdAt,
                        grandTotalSolved,
                        bestRating,
                        totalContests,
                        platformsLinked: platforms.length,
                        followersCount: socialData.followersCount,
                        followingCount: socialData.followingCount,
                    },
                    platforms,
                });
                
                setFollowersCount(socialData.followersCount);
                setFollowingCount(socialData.followingCount);
            } else if (standalone && paramUsername) {
                // ── Standalone public page: use public endpoint ──
                const headers = {};
                if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

                const res = await fetch(`${API_URL}/users/u/${paramUsername}`, {
                    headers,
                    credentials: 'include' // needed to detect if logged-in user follows them
                });
                if (!res.ok) throw new Error(res.status === 404 ? 'not_found' : 'server_error');
                const json = await res.json();
                setData(json);
                setIsFollowing(json.profile.isFollowing || false);
                setFollowersCount(json.profile.followersCount || 0);
                setFollowingCount(json.profile.followingCount || 0);
            } else {
                throw new Error('not_found');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [standalone, accessToken, paramUsername, currentUser]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Start editing
    const startEdit = () => {
        setEditName(data?.profile?.displayName || '');
        setEditBio(data?.profile?.bio || '');
        setEditUsername(currentUser?.username || '');
        setUsernameError('');
        setEditing(true);
    };

    // Save profile changes
    const saveEdit = async () => {
        if (editUsername && !/^[a-zA-Z0-9_]{3,30}$/.test(editUsername)) {
            setUsernameError('3-30 chars, letters/numbers/underscores only');
            return;
        }
        setSaving(true);
        setUsernameError('');
        const updates = { displayName: editName, bio: editBio };
        if (editUsername) updates.username = editUsername.toLowerCase();
        const success = await updateProfile(updates);
        if (success) {
            setData(prev => ({
                ...prev,
                profile: { ...prev.profile, displayName: editName, bio: editBio, username: editUsername.toLowerCase() || prev.profile.username },
            }));
            setEditing(false);
        } else {
            setUsernameError('Username may already be taken');
        }
        setSaving(false);
    };

    // Copy profile URL — only works when a real username is set
    const hasRealUsername = !!(currentUser?.username || data?.profile?.username);
    const shareUsername = currentUser?.username || data?.profile?.username;
    const copyUrl = () => {
        if (!hasRealUsername) return;
        const url = `${window.location.origin}/u/${shareUsername}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Toggle Follow
    const toggleFollow = async () => {
        if (!currentUser) return; // Must be logged in
        
        const previousState = isFollowing;
        setIsFollowing(!previousState);
        setFollowersCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            const method = previousState ? 'DELETE' : 'POST';
            const res = await fetch(`${API_URL}/users/u/${data.profile.username}/follow`, {
                method,
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to toggle follow');
        } catch (err) {
            // Revert on error
            setIsFollowing(previousState);
            setFollowersCount(prev => previousState ? prev + 1 : prev - 1);
            console.error(err);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="profile-dash">
                <div className="profile-loading"><Loader2 size={28} className="spin" /> Loading profile...</div>
                <style>{styles}</style>
            </div>
        );
    }

    // ── Error / 404 ──
    if (error || !data) {
        const inner = (
            <div className="profile-dash">
                <div className="profile-loading">
                    <h2 style={{ opacity: 0.2, fontSize: '3rem', fontWeight: 800 }}>404</h2>
                    <p>User not found.</p>
                    <Link to="/" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>← Go to Dashboard</Link>
                </div>
                <style>{styles}</style>
            </div>
        );
        if (standalone) return <div className="profile-standalone"><StandaloneHeader /><main className="profile-standalone-main">{inner}</main></div>;
        return inner;
    }

    const { profile, platforms } = data;

    // Heatmap — build a proper 7-row grid
    const allHeatmaps = platforms.map(p => p.heatmap).filter(Boolean);
    const dates = generateDates();
    const heatmapMap = buildHeatmapData(allHeatmaps);

    // Build weeks with EXACTLY 7 cells each (null = empty spacer)
    const weeks = [];
    let currentWeek = new Array(7).fill(null);
    for (const date of dates) {
        const dow = date.getDay(); // 0=Sun .. 6=Sat
        currentWeek[dow] = date;
        if (dow === 6) { // Saturday => week complete
            weeks.push(currentWeek);
            currentWeek = new Array(7).fill(null);
        }
    }
    // Push the last partial week
    if (currentWeek.some(d => d !== null)) weeks.push(currentWeek);

    // Month labels
    const monthLabels = [];
    let curMonth = -1;
    weeks.forEach((week, idx) => {
        const date = week.find(d => d !== null);
        if (date) {
            const m = date.getMonth();
            if (m !== curMonth && idx > 0) { monthLabels.push({ label: MONTHS[m], index: idx }); curMonth = m; }
            else if (curMonth === -1) curMonth = m;
        }
    });

    // Streaks — use string keys to match heatmapMap
    let totalActive = 0, maxStreak = 0, currentStreak = 0;
    const todayStr = dateToKey(new Date());

    // Max streak: forward pass through all dates
    let streak = 0;
    for (const d of dates) {
        const k = dateToKey(d);
        if ((heatmapMap.get(k) || 0) > 0) {
            totalActive++;
            streak++;
            if (streak > maxStreak) maxStreak = streak;
        } else {
            streak = 0;
        }
    }

    // Current streak: walk backward from today
    for (let i = dates.length - 1; i >= 0; i--) {
        const k = dateToKey(dates[i]);
        if (k === todayStr && !(heatmapMap.get(k) || 0)) continue; // today with no activity: skip
        if ((heatmapMap.get(k) || 0) > 0) currentStreak++;
        else break; // gap found, stop
    }

    // ── Page content (shared between standalone and in-Layout) ──
    const content = (
        <div className="profile-dash">
            {/* Header */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-title"><User size={24} /> Profile</h1>
                    <p className="dash-subtitle">
                        {isOwner ? 'Your public profile' : `@${profile.username}'s profile`}
                    </p>
                </div>
                <div className="dash-actions">
                    {isOwner && !editing && (
                        <button className="dash-sync-btn" onClick={startEdit}><Edit3 size={16} /> Edit</button>
                    )}
                    {hasRealUsername ? (
                        <button className="dash-sync-btn" onClick={copyUrl}>
                            {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share</>}
                        </button>
                    ) : isOwner && !editing ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set a username to share your profile</span>
                    ) : null}
                </div>
            </div>

            {/* Custom Tooltip */}
            {hoverCell && (
                <div
                    className="heatmap-tooltip"
                    style={{
                        position: 'fixed',
                        left: hoverCell.x,
                        top: hoverCell.y,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 100,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <strong style={{ color: 'var(--accent)' }}>{hoverCell.count}</strong> submissions on <span style={{ color: 'var(--text-muted)' }}>{hoverCell.date}</span>
                </div>
            )}

            {/* Profile Card */}
            <div className="profile-card glass-card">
                <div className="profile-card-row">
                    <div className="profile-card-avatar-wrap">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.username} className="profile-card-avatar" />
                        ) : (
                            <div className="profile-card-avatar profile-card-avatar-fallback">
                                {(profile.displayName || profile.username || 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-card-info">
                        {editing ? (
                            <div className="profile-edit-form">
                                <div className="profile-edit-field">
                                    <label className="profile-edit-label">Username</label>
                                    <input
                                        className="profile-edit-input"
                                        value={editUsername}
                                        onChange={(e) => { setEditUsername(e.target.value); setUsernameError(''); }}
                                        placeholder="your_username"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    />
                                    {usernameError && <span style={{ fontSize:'0.75rem', color:'var(--error)', marginTop:2 }}>{usernameError}</span>}
                                    <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>This sets your public profile URL: /u/username</span>
                                </div>
                                <div className="profile-edit-field">
                                    <label className="profile-edit-label">Display Name</label>
                                    <input
                                        className="profile-edit-input"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="profile-edit-field">
                                    <label className="profile-edit-label">Bio</label>
                                    <textarea
                                        className="profile-edit-input profile-edit-textarea"
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Tell people about yourself..."
                                        rows={3}
                                    />
                                </div>
                                <div className="profile-edit-actions">
                                    <button className="profile-save-btn" onClick={saveEdit} disabled={saving}>
                                        <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="profile-cancel-btn" onClick={() => setEditing(false)}>
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="profile-card-name">{profile.displayName || profile.username}</h2>
                                <p className="profile-card-handle">@{profile.username}</p>
                                {profile.bio && <p className="profile-card-bio">{profile.bio}</p>}
                                <div className="profile-card-meta">
                                    <span className="profile-card-meta-item">
                                        <Users size={14} />
                                        <strong>{followersCount}</strong> followers
                                    </span>
                                    <span className="profile-card-meta-item">
                                        <strong>{followingCount}</strong> following
                                    </span>
                                    <span className="profile-card-meta-item">
                                        <Calendar size={14} />
                                        Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="profile-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    {isOwner ? (
                                        <button className="profile-edit-btn" onClick={startEdit}>
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    ) : currentUser ? (
                                        <button 
                                            className={`profile-action-btn ${isFollowing ? 'unfollow' : 'follow'}`} 
                                            onClick={toggleFollow}
                                        >
                                            {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                                        </button>
                                    ) : null}

                                    <button className="profile-share-btn" onClick={copyUrl} disabled={!hasRealUsername} title={hasRealUsername ? "Copy profile link" : "Set a username first to share"}>
                                        {copied ? <Check size={14} /> : <Share2 size={14} />} 
                                        {copied ? 'Copied' : 'Share'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Grand Stats */}
            <div className="stats-grid grand">
                <Stat icon={Target} label="Total Solved" value={profile.grandTotalSolved} color="var(--accent)" size="lg" />
                <Stat icon={TrendingUp} label="Best Rating" value={profile.bestRating} color="var(--info, #0098b8)" size="lg" />
                <Stat icon={Trophy} label="Contests" value={profile.totalContests} color="#ffa116" size="lg" />
                <Stat icon={Code} label="Platforms" value={profile.platformsLinked} color="#2f8d46" size="lg" />
            </div>

            {/* Activity Heatmap */}
            <div className="chart-card glass-card">
                <h3 className="chart-title">Activity</h3>
                <div className="heatmap-stats-row">
                    <span><strong>{totalActive}</strong> days active</span>
                    <span><strong>{currentStreak}</strong> current streak</span>
                    <span><strong>{maxStreak}</strong> max streak</span>
                </div>
                <div style={{ marginTop: '16px' }}>
                    <ContributionCity platforms={platforms} />
                </div>
            </div>

            {/* Platform Cards */}
            <div className="platform-grid">
                {platforms.length > 0 ? platforms.map((p) => {
                    const meta = PLATFORM_META[p.platform] || { name: p.platform, color: 'var(--accent)', icon: '?', urlPrefix: '#' };
                    return (
                        <a key={p.platform + '-' + p.handle} href={`${meta.urlPrefix}${p.handle}`} target="_blank" rel="noreferrer" className="platform-card glass-card">
                            <div className="platform-card-header">
                                <span className="platform-icon" style={{ background: meta.color }}>{meta.icon}</span>
                                <span className="platform-name">{meta.name}</span>
                                <ExternalLink size={14} className="muted" />
                            </div>
                            <div className="platform-body">
                                <div className="platform-stats">
                                    <div className="platform-stat"><span className="ps-value">{p.solved.toLocaleString()}</span><span className="ps-label">Solved</span></div>
                                    <div className="platform-stat"><span className="ps-value">{p.rating.toLocaleString()}</span><span className="ps-label">{p.platform === 'gfg' ? 'Score' : 'Rating'}</span></div>
                                    {p.contests > 0 && <div className="platform-stat"><span className="ps-value">{p.contests}</span><span className="ps-label">Contests</span></div>}
                                </div>
                                <div className="platform-accounts">
                                    <span className="account-badge">@{p.handle}</span>
                                </div>
                            </div>
                        </a>
                    );
                }) : (
                    <div className="profile-empty-platforms glass-card">
                        {isOwner
                            ? <><p>No platforms linked yet.</p><Link to="/accounts" className="profile-link-accounts">Link Accounts →</Link></>
                            : <p>No platforms linked yet.</p>
                        }
                    </div>
                )}
            </div>

            <style>{styles}</style>
        </div>
    );

    // If standalone (/u/:username), wrap with its own header
    if (standalone) {
        return (
            <div className="profile-standalone">
                <StandaloneHeader />
                <main className="profile-standalone-main">{content}</main>
                <style>{standaloneStyles}</style>
            </div>
        );
    }

    // Otherwise it renders inside the Layout (sidebar + navbar already present)
    return content;
}

// ── Standalone header for /u/:username (no sidebar) ──
function StandaloneHeader() {
    const { user: currentUser } = useAuthStore();
    return (
        <header className="standalone-header">
            <Link to="/" className="standalone-logo">
                <span className="standalone-logo-icon">CF</span>
                <span className="standalone-logo-text">Codefolio</span>
            </Link>
            <div className="standalone-header-right">
                <ThemeToggle />
                {currentUser ? (
                    <Link to="/" className="standalone-nav-link">Dashboard</Link>
                ) : (
                    <Link to="/login" className="standalone-login-btn">Log in</Link>
                )}
            </div>
        </header>
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

// ═══════════════════════════════════════════
// Styles — mirrors Dashboard.jsx exactly
// ═══════════════════════════════════════════

const styles = `
    .profile-dash { max-width: 1100px; margin: 0 auto; }
    .profile-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:50vh; gap:12px; color:var(--text-secondary); text-align:center; }

    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .dash-title { display:flex; align-items:center; gap:10px; font-size:1.5rem; font-weight:800; }
    .dash-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .dash-actions { display:flex; gap:8px; align-items:center; }
    .dash-sync-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .dash-sync-btn:hover { color:var(--text-primary); border-color:var(--accent); }

    /* Profile Card */
    .profile-card { padding:24px; border-radius:var(--radius-lg); margin-bottom:24px; }
    .profile-card-row { display:flex; gap:24px; align-items:flex-start; }
    .profile-card-avatar-wrap { flex-shrink:0; }
    .profile-card-avatar { width:90px; height:90px; border-radius:var(--radius-xl); object-fit:cover; border:3px solid var(--border); }
    .profile-card-avatar-fallback { display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, var(--accent), var(--info, #0098b8)); font-size:2rem; font-weight:800; color:#fff; }
    .profile-card-info { flex:1; min-width:0; }
    .profile-card-name { font-size:1.5rem; font-weight:800; margin:0; line-height:1.3; }
    .profile-card-handle { font-size:0.875rem; color:var(--text-muted); margin:2px 0 0; }
    .profile-card-bio { font-size:0.9rem; color:var(--text-secondary); margin:10px 0 0; line-height:1.6; white-space:pre-wrap; }
    .profile-card-meta { display:flex; gap:16px; margin-top:10px; flex-wrap:wrap; }
    .profile-card-meta-item { display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; color:var(--text-muted); }

    /* Edit form */
    .profile-edit-form { display:flex; flex-direction:column; gap:16px; max-width:420px; }
    .profile-edit-field { display:flex; flex-direction:column; gap:4px; }
    .profile-edit-label { font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; }
    .profile-edit-input { padding:10px 14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.9rem; font-family:var(--font-sans); outline:none; transition:border-color var(--transition-fast); }
    .profile-edit-input:focus { border-color:var(--accent); }
    .profile-edit-textarea { resize:vertical; min-height:70px; }
    .profile-edit-actions { display:flex; gap:8px; }
    .profile-save-btn { display:flex; align-items:center; gap:6px; padding:8px 20px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); font-weight:600; font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; transition:opacity var(--transition-fast); }
    .profile-save-btn:hover:not(:disabled) { opacity:0.9; }
    .profile-save-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .profile-cancel-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); color:var(--text-secondary); border:1px solid var(--border); border-radius:var(--radius-md); font-weight:600; font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; transition:all var(--transition-fast); }
    .profile-cancel-btn:hover { color:var(--text-primary); border-color:var(--border-strong); }
    .profile-edit-btn, .profile-share-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .profile-edit-btn:hover, .profile-share-btn:hover:not(:disabled) { color:var(--text-primary); border-color:var(--accent); }
    .profile-share-btn:disabled { opacity:0.5; cursor:not-allowed; }
    
    .profile-action-btn.follow { display:flex; align-items:center; gap:6px; padding:8px 16px; background:var(--text-primary); color:var(--bg-primary); border:none; border-radius:var(--radius-md); font-weight:600; font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; transition:opacity var(--transition-fast); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .profile-action-btn.follow:hover { opacity:0.9; transform: translateY(-1px); }
    .profile-action-btn.unfollow { display:flex; align-items:center; gap:6px; padding:8px 16px; background:transparent; color:var(--text-secondary); border:1px solid var(--border); border-radius:var(--radius-md); font-weight:600; font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; transition:all var(--transition-fast); }
    .profile-action-btn.unfollow:hover { border-color:var(--error); color:var(--error); background:rgba(255, 60, 60, 0.05); }

    /* Stats (same as Dashboard) */
    .stats-grid.grand { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px; }
    @media (max-width: 768px) { .stats-grid.grand { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { padding:20px; text-align:center; border-radius:var(--radius-lg); }
    .stat-lg .stat-v { font-size:2rem; }
    .stat-v { font-size:1.4rem; font-weight:800; margin:6px 0 2px; }
    .stat-l { font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }

    /* Charts / Heatmap (same as Dashboard) */
    .chart-card { padding:20px; border-radius:var(--radius-lg); margin-bottom:24px; }
    .chart-title { font-size:0.9rem; font-weight:700; margin-bottom:14px; }

    .heatmap-stats-row { display:flex; gap:24px; margin-bottom:12px; font-size:0.8rem; color:var(--text-secondary); }
    .heatmap-stats-row strong { color:var(--text-primary); font-weight:700; margin-right:4px; }
    .heatmap-container { display:flex; position:relative; }
    .heatmap-y-axis { display:grid; grid-template-rows:repeat(7, 12px); gap:2px; align-items:center; font-size:0.6rem; color:var(--text-muted); padding-top:20px; padding-right:6px; }
    .heatmap-scroll { flex:1; overflow-x:auto; padding-bottom:12px; }
    .heatmap-scroll::-webkit-scrollbar { height:4px; }
    .heatmap-scroll::-webkit-scrollbar-thumb { background:var(--text-muted); border-radius:4px; }
    .heatmap-months { position:relative; height:16px; margin-bottom:4px; }
    .heatmap-month { position:absolute; font-size:0.6rem; color:var(--text-muted); }
    .heatmap-grid { display:flex; gap:2px; }
    .heatmap-col { display:flex; flex-direction:column; gap:2px; }
    .heatmap-cell { width:12px; height:12px; border-radius:2px; }
    .heatmap-level-0 { background:var(--bg-tertiary); }
    .heatmap-cell-empty { visibility:hidden; }
    .heatmap-level-1 { background:rgba(0, 184, 118, 0.35); }
    .heatmap-level-2 { background:rgba(0, 184, 118, 0.55); }
    .heatmap-level-3 { background:rgba(0, 184, 118, 0.75); }
    .heatmap-level-4 { background:var(--success); }
    .heatmap-legend { display:flex; align-items:center; justify-content:flex-end; gap:3px; margin-top:8px; font-size:0.6rem; color:var(--text-muted); }
    .heatmap-legend .heatmap-cell { width:11px; height:11px; }

    /* Platform cards (same as Dashboard) */
    .platform-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-bottom:24px; }
    .platform-card { display:block; padding:20px; border-radius:var(--radius-lg); text-decoration:none; color:inherit; transition:all var(--transition-fast); cursor:pointer; }
    .platform-card:hover { transform:translateY(-2px); border-color:var(--accent); color:inherit; }
    .platform-card-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .platform-icon { width:32px; height:32px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.6rem; color:#fff; flex-shrink:0; }
    .platform-name { font-weight:700; font-size:0.9375rem; flex:1; }
    .muted { color:var(--text-muted); }
    .platform-body {}
    .platform-stats { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:8px; }
    .platform-stat { display:flex; flex-direction:column; }
    .ps-value { font-size:1.2rem; font-weight:800; }
    .ps-label { font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; }
    .platform-accounts { display:flex; flex-wrap:wrap; gap:6px; }
    .account-badge { font-size:0.7rem; padding:2px 8px; border-radius:var(--radius-sm); background:var(--bg-tertiary); color:var(--text-secondary); font-weight:600; }

    /* Empty state */
    .profile-empty-platforms { grid-column:1/-1; padding:40px 24px; text-align:center; color:var(--text-muted); font-size:0.9rem; border-radius:var(--radius-lg); }
    .profile-link-accounts { display:inline-block; margin-top:10px; color:var(--accent); font-weight:600; font-size:0.8125rem; text-decoration:none; }
    .profile-link-accounts:hover { text-decoration:underline; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
        .profile-card-row { flex-direction:column; align-items:center; text-align:center; }
        .profile-card-avatar { width:72px; height:72px; }
        .profile-card-meta { justify-content:center; }
    }
`;

const standaloneStyles = `
    .profile-standalone { min-height:100vh; background:var(--bg-primary); color:var(--text-primary); font-family:var(--font-sans); }
    .standalone-header { display:flex; align-items:center; justify-content:space-between; padding:0 32px; height:64px; border-bottom:1px solid var(--border); background:var(--bg-secondary); position:sticky; top:0; z-index:50; backdrop-filter:blur(12px); }
    .standalone-logo { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--text-primary); }
    .standalone-logo-icon { width:34px; height:34px; border-radius:var(--radius-md); background:linear-gradient(135deg, var(--accent), var(--info, #0098b8)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem; color:#fff; }
    .standalone-logo-text { font-size:1.125rem; font-weight:700; }
    .standalone-header-right { display:flex; align-items:center; gap:12px; }
    .standalone-nav-link { font-size:0.875rem; font-weight:600; color:var(--text-secondary); text-decoration:none; }
    .standalone-nav-link:hover { color:var(--accent); }
    .standalone-login-btn { padding:8px 20px; border-radius:var(--radius-md); background:var(--accent); color:#fff; font-size:0.875rem; font-weight:600; text-decoration:none; }
    .standalone-login-btn:hover { opacity:0.9; color:#fff; }
    .profile-standalone-main { max-width:1100px; margin:0 auto; padding:32px 24px 80px; }
`;
