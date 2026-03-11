import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
    PenSquare, Search, Filter, ChevronUp, Bookmark, MessageCircle,
    Clock, TrendingUp, ChevronDown, FileText, Loader2, User, Edit3, Trash2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const POST_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'article', label: 'Article' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'interview', label: 'Interview Exp.' },
];

const TYPE_COLORS = {
    article: 'var(--accent)',
    editorial: 'var(--leetcode)',
    discussion: 'var(--codeforces)',
    interview: 'var(--codechef)',
};

export default function Blog() {
    const { accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('latest');
    const [tab, setTab] = useState('feed'); // 'feed' or 'drafts'
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort, page, limit: 20 });
            if (typeFilter) params.set('type', typeFilter);

            const headers = {};
            if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

            const res = await fetch(`${API}/posts?${params}`, { headers, credentials: 'include' });
            const data = await res.json();
            setPosts(data.posts || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Failed to fetch posts:', err);
        }
        setLoading(false);
    }, [sort, typeFilter, page, accessToken]);

    const fetchDrafts = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/posts/drafts`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            const data = await res.json();
            setDrafts(data.posts || []);
        } catch (err) {
            console.error('Failed to fetch drafts:', err);
        }
        setLoading(false);
    }, [accessToken]);

    useEffect(() => {
        if (tab === 'feed') fetchPosts();
        else fetchDrafts();
    }, [tab, fetchPosts, fetchDrafts]);

    const deleteDraft = async (id) => {
        try {
            const res = await fetch(`${API}/posts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            if (res.ok) setDrafts(prev => prev.filter(d => d.id !== id));
        } catch (err) { console.error(err); }
    };

    const toggleVote = async (postId) => {
        if (!accessToken) return;
        try {
            const res = await fetch(`${API}/posts/${postId}/vote`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            const data = await res.json();
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, hasVoted: data.hasVoted, _count: { ...p._count, votes: data.voteCount } }
                    : p
            ));
        } catch (err) { console.error(err); }
    };

    const toggleBookmark = async (postId) => {
        if (!accessToken) return;
        try {
            const res = await fetch(`${API}/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                credentials: 'include',
            });
            const data = await res.json();
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, hasBookmarked: data.hasBookmarked } : p
            ));
        } catch (err) { console.error(err); }
    };

    const filteredPosts = search
        ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
        : posts;

    return (
        <div className="blog-page">
            {/* Header */}
            <div className="blog-header">
                <div className="blog-header-left">
                    <h2 className="blog-title">Community Blog</h2>
                    <p className="blog-subtitle">Share insights, editorials, and experiences</p>
                </div>
                <button className="blog-write-btn" onClick={() => navigate('/blog/new')}>
                    <PenSquare size={16} /> Write Post
                </button>
            </div>

            {/* Controls */}
            <div className="blog-controls">
                <div className="blog-sort-tabs">
                    <button
                        className={`blog-sort-tab ${tab === 'feed' && sort === 'latest' ? 'active' : ''}`}
                        onClick={() => { setTab('feed'); setSort('latest'); setPage(1); }}
                    >
                        <Clock size={14} /> Latest
                    </button>
                    <button
                        className={`blog-sort-tab ${tab === 'feed' && sort === 'top' ? 'active' : ''}`}
                        onClick={() => { setTab('feed'); setSort('top'); setPage(1); }}
                    >
                        <TrendingUp size={14} /> Top
                    </button>
                    {accessToken && (
                        <button
                            className={`blog-sort-tab ${tab === 'drafts' ? 'active' : ''}`}
                            onClick={() => { setTab('drafts'); }}
                        >
                            <FileText size={14} /> My Drafts
                        </button>
                    )}
                </div>

                <div className="blog-controls-right">
                    <div className="blog-search-wrap">
                        <Search size={14} />
                        <input
                            className="blog-search"
                            placeholder="Search posts..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        className={`blog-filter-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={14} /> Filters <ChevronDown size={12} />
                    </button>
                </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="blog-filter-panel animate-fade-in">
                    <div className="blog-filter-group">
                        <label className="blog-filter-label">Type</label>
                        <div className="blog-filter-options">
                            {POST_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    className={`blog-filter-chip ${typeFilter === t.value ? 'active' : ''}`}
                                    onClick={() => { setTypeFilter(t.value); setPage(1); }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Posts list */}
            {loading ? (
                <div className="blog-loading">
                    <Loader2 size={24} className="spin" /> Loading...
                </div>
            ) : tab === 'drafts' ? (
                /* Drafts view */
                drafts.length === 0 ? (
                    <div className="blog-empty">
                        <FileText size={48} />
                        <h3>No drafts</h3>
                        <p>Your saved drafts will appear here</p>
                    </div>
                ) : (
                    <div className="blog-feed">
                        {drafts.map(draft => (
                            <article key={draft.id} className="post-card draft-card">
                                <div className="post-card-body" onClick={() => navigate(`/blog/edit/${draft.slug}`)}>
                                    <div className="post-card-meta-top">
                                        <span className="post-type-badge draft-badge">Draft</span>
                                        <span
                                            className="post-type-badge"
                                            style={{ '--badge-color': TYPE_COLORS[draft.type] || 'var(--accent)' }}
                                        >
                                            {draft.type}
                                        </span>
                                        <span className="post-card-date">
                                            Last edited {new Date(draft.updatedAt).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="post-card-title">{draft.title}</h3>
                                    {draft.excerpt && <p className="post-card-excerpt">{draft.excerpt}</p>}
                                    {draft.tags?.length > 0 && (
                                        <div className="post-card-tags">
                                            {draft.tags.map(tag => <span key={tag} className="post-tag">{tag}</span>)}
                                        </div>
                                    )}
                                </div>
                                <div className="draft-actions">
                                    <button className="draft-edit-btn" onClick={() => navigate(`/blog/edit/${draft.slug}`)}>
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button className="draft-delete-btn" onClick={() => deleteDraft(draft.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )
            ) : filteredPosts.length === 0 ? (
                <div className="blog-empty">
                    <FileText size={48} />
                    <h3>No posts yet</h3>
                    <p>Be the first to share something with the community!</p>
                    <button className="blog-write-btn" onClick={() => navigate('/blog/new')}>
                        <PenSquare size={16} /> Write Post
                    </button>
                </div>
            ) : (
                <div className="blog-feed">
                    {filteredPosts.map(post => (
                        <article key={post.id} className="post-card">
                            <div className="post-card-vote">
                                <button
                                    className={`post-vote-btn ${post.hasVoted ? 'voted' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleVote(post.id); }}
                                    title="Upvote"
                                >
                                    <ChevronUp size={18} />
                                </button>
                                <span className="post-vote-count">{post._count?.votes || 0}</span>
                            </div>

                            <div className="post-card-body" onClick={() => navigate(`/blog/${post.slug}`)}>
                                <div className="post-card-meta-top">
                                    <span
                                        className="post-type-badge"
                                        style={{ '--badge-color': TYPE_COLORS[post.type] || 'var(--accent)' }}
                                    >
                                        {post.type}
                                    </span>
                                    <span className="post-card-author">
                                        {post.author?.avatarUrl ? (
                                            <img src={post.author.avatarUrl} alt="" className="post-author-avatar" />
                                        ) : (
                                            <User size={14} />
                                        )}
                                        {post.author?.displayName || post.author?.username}
                                    </span>
                                    <span className="post-card-date">
                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <h3 className="post-card-title">{post.title}</h3>
                                {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}

                                {post.tags?.length > 0 && (
                                    <div className="post-card-tags">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="post-tag">{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="post-card-footer">
                                    <span className="post-card-stat">
                                        <MessageCircle size={14} /> {post._count?.comments || 0} comments
                                    </span>
                                    <button
                                        className={`post-bookmark-btn ${post.hasBookmarked ? 'bookmarked' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
                                        title="Bookmark"
                                    >
                                        <Bookmark size={14} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Pagination — only for feed tab */}
            {tab === 'feed' && total > 20 && (
                <div className="blog-pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span>Page {page} of {Math.ceil(total / 20)}</span>
                    <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            )}

            <style>{blogStyles}</style>
        </div>
    );
}

const blogStyles = `
.blog-page { max-width: 900px; margin: 0 auto; padding: 24px; }
.blog-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.blog-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
.blog-subtitle { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }
.blog-write-btn {
    display: flex; align-items: center; gap: 8px; padding: 10px 20px;
    background: var(--accent); color: #fff; border: none; border-radius: 10px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.blog-write-btn:hover { opacity: 0.9; transform: translateY(-1px); }

.blog-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.blog-sort-tabs { display: flex; gap: 4px; background: var(--bg-tertiary); padding: 4px; border-radius: 10px; }
.blog-sort-tab {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    border: none; background: transparent; color: var(--text-secondary);
    border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s;
}
.blog-sort-tab.active { background: var(--bg-secondary); color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.blog-controls-right { display: flex; gap: 8px; align-items: center; }
.blog-search-wrap {
    display: flex; align-items: center; gap: 8px; padding: 8px 14px;
    background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 10px; color: var(--text-secondary);
}
.blog-search {
    border: none; background: transparent; color: var(--text-primary);
    outline: none; font-size: 0.85rem; width: 180px;
}
.blog-filter-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px;
    background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.blog-filter-btn.active { border-color: var(--accent); color: var(--accent); }

.blog-filter-panel {
    padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: 12px; margin-bottom: 16px;
}
.blog-filter-label { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px; display: block; font-weight: 600; }
.blog-filter-options { display: flex; gap: 6px; flex-wrap: wrap; }
.blog-filter-chip {
    padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px;
    background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
}
.blog-filter-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.blog-loading, .blog-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 20px; color: var(--text-secondary); gap: 12px;
}
.blog-empty h3 { margin: 0; color: var(--text-primary); }
.blog-empty p { margin: 0; }

.blog-feed { display: flex; flex-direction: column; gap: 12px; }

.post-card {
    display: flex; gap: 16px; padding: 20px;
    background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: 14px; transition: all 0.2s;
}
.post-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.post-card-vote { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 40px; }
.post-vote-btn {
    width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 8px;
    background: transparent; color: var(--text-secondary); cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.post-vote-btn:hover { border-color: var(--accent); color: var(--accent); }
.post-vote-btn.voted { background: var(--accent); color: #fff; border-color: var(--accent); }
.post-vote-count { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }

.post-card-body { flex: 1; cursor: pointer; min-width: 0; }
.post-card-meta-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.post-type-badge {
    padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    background: color-mix(in srgb, var(--badge-color) 15%, transparent);
    color: var(--badge-color);
}
.post-card-author {
    display: flex; align-items: center; gap: 6px; font-size: 0.8rem;
    color: var(--text-secondary); font-weight: 500;
}
.post-author-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
.post-card-date { font-size: 0.75rem; color: var(--text-muted); }

.post-card-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 6px; color: var(--text-primary); line-height: 1.4; }
.post-card-excerpt { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.post-card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.post-tag { padding: 3px 10px; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.75rem; color: var(--text-secondary); }

.post-card-footer { display: flex; align-items: center; justify-content: space-between; }
.post-card-stat { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); }
.post-bookmark-btn {
    border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
    padding: 4px; border-radius: 6px; transition: all 0.2s;
}
.post-bookmark-btn:hover { color: var(--accent); }
.post-bookmark-btn.bookmarked { color: var(--accent); }

.blog-pagination {
    display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px;
}
.blog-pagination button {
    padding: 8px 16px; background: var(--bg-tertiary); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-primary); cursor: pointer; font-size: 0.85rem;
}
.blog-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.blog-pagination span { font-size: 0.85rem; color: var(--text-secondary); }

/* Draft-specific styles */
.draft-card { flex-direction: row; align-items: center; border-left: 3px solid #ffc107; }
.draft-badge { background: rgba(255,193,7,0.15) !important; color: #ffc107 !important; }
.draft-actions { display: flex; flex-direction: column; gap: 6px; margin-left: 12px; }
.draft-edit-btn, .draft-delete-btn {
    display: flex; align-items: center; gap: 4px; padding: 6px 12px;
    border: 1px solid var(--border); border-radius: 6px; background: transparent;
    color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: all 0.2s; white-space: nowrap;
}
.draft-edit-btn:hover { border-color: var(--accent); color: var(--accent); }
.draft-delete-btn:hover { border-color: #e53935; color: #e53935; }
`;
