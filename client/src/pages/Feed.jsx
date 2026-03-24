import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Rss, Target, Trophy, Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const FeedEvent = ({ event }) => {
    const { user, type, metadata, createdAt } = event;
    const timeAgo = new Date(createdAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });

    let icon = <Rss size={20} />;
    let color = 'var(--text-muted)';
    let content = null;

    if (type === 'NEW_LINK_ACCOUNT') {
        icon = <LinkIcon size={20} />;
        color = 'var(--accent)';
        content = (
            <p className="feed-text">
                Linked their <strong>{metadata.platform}</strong> account (<code>{metadata.handle}</code>)
            </p>
        );
    } else if (type === 'NEW_FOLLOW') {
        icon = <Target size={20} />;
        color = 'var(--success)';
        content = (
            <p className="feed-text">
                Started following <Link to={`/u/${metadata.targetUsername}`} className="feed-link">@{metadata.targetUsername}</Link>
            </p>
        );
    } else if (type === 'RATING_UP') {
        icon = <Trophy size={20} />;
        color = '#ffa116';
        content = (
            <p className="feed-text">
                Rating increased to <strong>{metadata.newRating}</strong> on {metadata.platform}!
            </p>
        );
    } else {
        content = <p className="feed-text">Activity recorded.</p>
    }

    return (
        <div className="feed-card glass-card">
            <div className="feed-icon-col" style={{ color }}>{icon}</div>
            <div className="feed-content-col">
                <div className="feed-header">
                    <Link to={`/u/${user.username || ''}`} className="feed-user-link">
                        <img 
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                            alt={user.username} 
                            className="feed-avatar"
                        />
                        <span className="feed-display-name">{user.displayName || user.username}</span>
                        <span className="feed-username">@{user.username}</span>
                    </Link>
                    <span className="feed-time">{timeAgo}</span>
                </div>
                <div className="feed-body">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default function Feed() {
    const { accessToken } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchFeed = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/feed?page=${pageNum}&limit=20`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Failed to load feed');
            const data = await res.json();
            
            if (pageNum === 1) {
                setEvents(data.events);
            } else {
                setEvents(prev => [...prev, ...data.events]);
            }
            setHasMore(data.pagination.hasMore);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) fetchFeed(1);
    }, [accessToken, fetchFeed]);

    const loadMore = () => {
        setPage(p => p + 1);
        fetchFeed(page + 1);
    };

    return (
        <div className="feed-page">
            <div className="feed-header-section">
                <h1 className="feed-title">Community Feed</h1>
                <p className="feed-subtitle">Recent activity from developers you follow.</p>
            </div>

            {error && <div className="feed-error">{error}</div>}

            <div className="feed-list">
                {events.length === 0 && !loading && !error && (
                    <div className="feed-empty glass-card">
                        <Rss size={32} />
                        <h3>It's quiet here...</h3>
                        <p>Follow other developers to see their coding activity and milestones in your feed.</p>
                        <Link to="/profile" className="feed-btn">Find people via Profiles</Link>
                    </div>
                )}

                {events
                    .filter(ev => ['NEW_LINK_ACCOUNT', 'NEW_FOLLOW', 'RATING_UP'].includes(ev.type))
                    .map((ev) => (
                    <FeedEvent key={ev.id} event={ev} />
                ))}

                {loading && <div className="feed-loading"><Loader2 size={24} className="spin" /> Loading more...</div>}

                {hasMore && !loading && (
                    <button className="feed-load-more" onClick={loadMore}>Load Older Activity</button>
                )}
            </div>

            <style>{`
                .feed-page { max-width:800px; margin:0 auto; padding-bottom:40px; }
                .feed-header-section { margin-bottom:32px; }
                .feed-title { font-size:1.8rem; font-weight:800; letter-spacing:-0.03em; margin-bottom:8px; }
                .feed-subtitle { color:var(--text-secondary); font-size:0.95rem; }
                
                .feed-list { display:flex; flex-direction:column; gap:16px; }
                .feed-card { display:flex; gap:16px; padding:20px; border-radius:var(--radius-lg); transition:transform var(--transition-fast); }
                .feed-card:hover { transform:translateY(-2px); }
                
                .feed-icon-col { padding-top:4px; }
                
                .feed-content-col { flex:1; }
                .feed-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
                .feed-user-link { display:flex; align-items:center; gap:8px; text-decoration:none; color:inherit; }
                .feed-user-link:hover .feed-display-name { text-decoration:underline; }
                
                .feed-avatar { width:24px; height:24px; border-radius:50%; background:var(--bg-tertiary); }
                .feed-display-name { font-weight:700; font-size:0.95rem; }
                .feed-username { color:var(--text-muted); font-size:0.85rem; }
                
                .feed-time { font-size:0.8rem; color:var(--text-muted); }
                
                .feed-text { font-size:0.95rem; color:var(--text-secondary); line-height:1.5; }
                .feed-text strong { color:var(--text-primary); }
                .feed-text code { font-family:var(--font-mono); font-size:0.85em; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; }
                .feed-link { color:var(--accent); text-decoration:none; font-weight:500; }
                .feed-link:hover { text-decoration:underline; }
                
                .feed-empty { padding:48px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; color:var(--text-muted); }
                .feed-empty h3 { color:var(--text-primary); font-size:1.2rem; }
                .feed-btn { display:inline-block; margin-top:12px; padding:10px 24px; background:var(--bg-tertiary); color:var(--text-primary); text-decoration:none; border-radius:var(--radius-md); font-weight:600; font-size:0.85rem; border:1px solid var(--border); transition:border-color var(--transition-fast); }
                .feed-btn:hover { border-color:var(--border-strong); }
                
                .feed-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:24px; color:var(--text-muted); font-size:0.9rem; }
                .feed-load-more { width:100%; padding:14px; background:transparent; border:1px dashed var(--border-strong); color:var(--text-secondary); border-radius:var(--radius-md); font-weight:600; cursor:pointer; transition:all var(--transition-fast); }
                .feed-load-more:hover { border-color:var(--text-primary); color:var(--text-primary); }
                .feed-error { padding:16px; background:rgba(239,68,68,0.1); color:var(--error); border-radius:var(--radius-md); margin-bottom:24px; font-weight:500; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
