import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
    ChevronUp, Bookmark, MessageCircle, ArrowLeft, Edit3, Trash2,
    Send, Reply, Clock, Loader2, User
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TYPE_COLORS = {
    article: 'var(--accent)',
    editorial: 'var(--leetcode)',
    discussion: 'var(--codeforces)',
    interview: 'var(--codechef)',
};

// Standalone component — each comment manages its own reply state
function CommentNode({ comment, depth = 0, currentUserId, accessToken, onReply, onDelete }) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const isOwn = currentUserId === comment.author?.id;

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);
        await onReply(comment.id, replyText.trim());
        setReplyText('');
        setShowReply(false);
        setSubmittingReply(false);
    };

    return (
        <div className="comment-node" style={{ marginLeft: depth > 0 ? 24 : 0 }}>
            <div className="comment-box">
                <div className="comment-header">
                    <div className="comment-author">
                        {comment.author?.avatarUrl ? (
                            <img src={comment.author.avatarUrl} alt="" className="comment-avatar" />
                        ) : (
                            <div className="comment-avatar-placeholder"><User size={12} /></div>
                        )}
                        <Link to={`/u/${comment.author?.username}`} className="comment-author-name">
                            {comment.author?.displayName || comment.author?.username}
                        </Link>
                        <span className="comment-time">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <div className="comment-actions">
                        {accessToken && (
                            <button className="comment-reply-btn" onClick={() => { setShowReply(!showReply); setReplyText(''); }}>
                                <Reply size={12} /> Reply
                            </button>
                        )}
                        {isOwn && (
                            <button className="comment-delete-btn" onClick={() => onDelete(comment.id)}>
                                <Trash2 size={12} /> Delete
                            </button>
                        )}
                    </div>
                </div>
                <p className="comment-content">{comment.content}</p>

                {showReply && (
                    <div className="comment-reply-form">
                        <textarea
                            className="comment-input"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            rows={2}
                        />
                        <div className="comment-reply-actions">
                            <button className="comment-submit-btn" onClick={handleReply} disabled={submittingReply || !replyText.trim()}>
                                <Send size={12} /> Reply
                            </button>
                            <button className="comment-cancel-reply" onClick={() => setShowReply(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {comment.replies?.length > 0 && (
                <div className="comment-replies">
                    {comment.replies.map(r => (
                        <CommentNode
                            key={r.id}
                            comment={r}
                            depth={depth + 1}
                            currentUserId={currentUserId}
                            accessToken={accessToken}
                            onReply={onReply}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostView() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { accessToken, user: currentUser } = useAuthStore();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };

    const fetchPost = useCallback(async () => {
        try {
            const h = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
            const res = await fetch(`${API}/posts/${slug}`, { headers: h, credentials: 'include' });
            if (!res.ok) { navigate('/blog'); return; }
            const data = await res.json();
            setPost(data.post);
        } catch { navigate('/blog'); }
    }, [slug, accessToken, navigate]);

    const fetchComments = useCallback(async () => {
        if (!post) return;
        try {
            const res = await fetch(`${API}/posts/${post.id}/comments`);
            const data = await res.json();
            setComments(data.comments || []);
        } catch (err) { console.error(err); }
    }, [post?.id]);

    useEffect(() => { fetchPost().then(() => setLoading(false)); }, [fetchPost]);
    useEffect(() => { if (post) fetchComments(); }, [post, fetchComments]);

    const toggleVote = async () => {
        if (!accessToken || !post) return;
        try {
            const res = await fetch(`${API}/posts/${post.id}/vote`, { method: 'POST', headers, credentials: 'include' });
            const data = await res.json();
            setPost(p => ({ ...p, hasVoted: data.hasVoted, _count: { ...p._count, votes: data.voteCount } }));
        } catch (err) { console.error(err); }
    };

    const toggleBookmark = async () => {
        if (!accessToken || !post) return;
        try {
            const res = await fetch(`${API}/posts/${post.id}/bookmark`, { method: 'POST', headers, credentials: 'include' });
            const data = await res.json();
            setPost(p => ({ ...p, hasBookmarked: data.hasBookmarked }));
        } catch (err) { console.error(err); }
    };

    const deletePost = async () => {
        if (!confirm('Delete this post?')) return;
        try {
            await fetch(`${API}/posts/${post.id}`, { method: 'DELETE', headers, credentials: 'include' });
            navigate('/blog');
        } catch (err) { console.error(err); }
    };

    const submitComment = async (parentId = null, text = null) => {
        const content = text || commentText;
        if (!content.trim() || !accessToken) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/posts/${post.id}/comments`, {
                method: 'POST', headers, credentials: 'include',
                body: JSON.stringify({ content: content.trim(), parentId }),
            });
            if (res.ok) {
                if (!parentId) setCommentText('');
                fetchComments();
            }
        } catch (err) { console.error(err); }
        setSubmitting(false);
    };

    const deleteComment = async (commentId) => {
        try {
            const res = await fetch(`${API}/posts/comments/${commentId}`, { method: 'DELETE', headers, credentials: 'include' });
            if (res.ok) fetchComments();
        } catch (err) { console.error(err); }
    };

    // Render TipTap JSON content
    const renderContent = (node) => {
        if (!node) return null;
        if (typeof node === 'string') return node;

        if (node.type === 'doc') {
            return <>{(node.content || []).map((c, i) => <div key={i}>{renderContent(c)}</div>)}</>;
        }
        if (node.type === 'paragraph') {
            return <p>{(node.content || []).map((c, i) => renderInline(c, i))}</p>;
        }
        if (node.type === 'heading') {
            const Tag = `h${node.attrs?.level || 1}`;
            return <Tag>{(node.content || []).map((c, i) => renderInline(c, i))}</Tag>;
        }
        if (node.type === 'bulletList') {
            return <ul>{(node.content || []).map((c, i) => <li key={i}>{(c.content || []).map((cc, j) => <div key={j}>{renderContent(cc)}</div>)}</li>)}</ul>;
        }
        if (node.type === 'orderedList') {
            return <ol>{(node.content || []).map((c, i) => <li key={i}>{(c.content || []).map((cc, j) => <div key={j}>{renderContent(cc)}</div>)}</li>)}</ol>;
        }
        if (node.type === 'blockquote') {
            return <blockquote>{(node.content || []).map((c, i) => <div key={i}>{renderContent(c)}</div>)}</blockquote>;
        }
        if (node.type === 'codeBlock') {
            const code = (node.content || []).map(c => c.text || '').join('');
            return <pre><code className={node.attrs?.language ? `language-${node.attrs.language}` : ''}>{code}</code></pre>;
        }
        if (node.type === 'horizontalRule') return <hr />;
        if (node.type === 'image') return <img src={node.attrs?.src} alt={node.attrs?.alt || ''} />;
        if (node.type === 'hardBreak') return <br />;

        return null;
    };

    const renderInline = (node, key) => {
        if (node.type === 'text') {
            let el = node.text;
            if (node.marks) {
                for (const mark of node.marks) {
                    if (mark.type === 'bold') el = <strong key={key}>{el}</strong>;
                    if (mark.type === 'italic') el = <em key={key}>{el}</em>;
                    if (mark.type === 'strike') el = <s key={key}>{el}</s>;
                    if (mark.type === 'code') el = <code key={key}>{el}</code>;
                    if (mark.type === 'link') el = <a key={key} href={mark.attrs?.href} target="_blank" rel="noopener noreferrer">{el}</a>;
                }
            }
            return <span key={key}>{el}</span>;
        }
        if (node.type === 'hardBreak') return <br key={key} />;
        return null;
    };


    if (loading) {
        return (
            <div className="post-view-page"><div className="blog-loading"><Loader2 size={24} className="spin" /> Loading...</div><style>{viewStyles}</style></div>
        );
    }
    if (!post) return null;

    const isOwner = currentUser?.id === post.author?.id;

    return (
        <div className="post-view-page">
            <button className="pv-back" onClick={() => navigate('/blog')}>
                <ArrowLeft size={16} /> Back to Blog
            </button>

            <article className="pv-article">
                {/* Header */}
                <div className="pv-header">
                    <div className="pv-meta-top">
                        <span className="post-type-badge" style={{ '--badge-color': TYPE_COLORS[post.type] || 'var(--accent)' }}>
                            {post.type}
                        </span>
                        <span className="pv-date">
                            <Clock size={13} />
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                                month: 'long', day: 'numeric', year: 'numeric'
                            })}
                        </span>
                    </div>

                    <h1 className="pv-title">{post.title}</h1>

                    <div className="pv-author-row">
                        <Link to={`/u/${post.author?.username}`} className="pv-author">
                            {post.author?.avatarUrl ? (
                                <img src={post.author.avatarUrl} alt="" className="pv-author-avatar" />
                            ) : (
                                <div className="pv-author-avatar-placeholder"><User size={16} /></div>
                            )}
                            <span>{post.author?.displayName || post.author?.username}</span>
                        </Link>

                        {isOwner && (
                            <div className="pv-owner-actions">
                                <button className="pv-edit-btn" onClick={() => navigate(`/blog/edit/${post.slug}`)}>
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button className="pv-delete-btn" onClick={deletePost}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {post.tags?.length > 0 && (
                        <div className="pv-tags">{post.tags.map(t => <span key={t} className="post-tag">{t}</span>)}</div>
                    )}
                </div>

                {/* Content */}
                <div className="pv-content">
                    {renderContent(post.content)}
                </div>

                {/* Interaction bar */}
                <div className="pv-interaction-bar">
                    <button className={`pv-vote-btn ${post.hasVoted ? 'voted' : ''}`} onClick={toggleVote}>
                        <ChevronUp size={18} />
                        <span>{post._count?.votes || 0}</span>
                    </button>
                    <button className={`pv-bookmark-btn ${post.hasBookmarked ? 'bookmarked' : ''}`} onClick={toggleBookmark}>
                        <Bookmark size={16} />
                    </button>
                    <span className="pv-comment-count">
                        <MessageCircle size={16} /> {post._count?.comments || 0} comments
                    </span>
                </div>
            </article>

            {/* Comments section */}
            <section className="pv-comments">
                <h3 className="pv-comments-title">Comments</h3>

                {accessToken && (
                    <div className="comment-form">
                        <textarea
                            className="comment-input"
                            placeholder="Share your thoughts..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            rows={3}
                        />
                        <button
                            className="comment-submit-btn"
                            onClick={() => submitComment()}
                            disabled={submitting || !commentText.trim()}
                        >
                            <Send size={14} /> {submitting ? 'Posting...' : 'Comment'}
                        </button>
                    </div>
                )}

                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p className="comments-empty">No comments yet. Be the first!</p>
                    ) : (
                        comments.map(c => (
                            <CommentNode
                                key={c.id}
                                comment={c}
                                depth={0}
                                currentUserId={currentUser?.id}
                                accessToken={accessToken}
                                onReply={(parentId, text) => {
                                    submitComment(parentId, text);
                                }}
                                onDelete={deleteComment}
                            />
                        ))
                    )}
                </div>
            </section>

            <style>{viewStyles}</style>
        </div>
    );
}

const viewStyles = `
.post-view-page { max-width: 800px; margin: 0 auto; padding: 24px; }
.pv-back {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
    background: transparent; border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; margin-bottom: 24px; transition: all 0.2s;
}
.pv-back:hover { border-color: var(--text-primary); color: var(--text-primary); }

.pv-article { margin-bottom: 32px; }
.pv-header { margin-bottom: 32px; }
.pv-meta-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.pv-date { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); }

.pv-title { font-size: 2.2rem; font-weight: 800; line-height: 1.2; margin: 0 0 16px; letter-spacing: -0.02em; }

.pv-author-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.pv-author {
    display: flex; align-items: center; gap: 10px; text-decoration: none;
    color: var(--text-primary); font-weight: 600; font-size: 0.9rem;
}
.pv-author:hover { color: var(--accent); }
.pv-author-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.pv-author-avatar-placeholder {
    width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary);
    display: flex; align-items: center; justify-content: center; color: var(--text-secondary);
}
.pv-owner-actions { display: flex; gap: 6px; }
.pv-edit-btn, .pv-delete-btn {
    display: flex; align-items: center; gap: 4px; padding: 6px 12px;
    border: 1px solid var(--border); border-radius: 6px; background: transparent;
    color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: all 0.2s;
}
.pv-edit-btn:hover { border-color: var(--accent); color: var(--accent); }
.pv-delete-btn:hover { border-color: #e53935; color: #e53935; }

.pv-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.post-type-badge {
    padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    background: color-mix(in srgb, var(--badge-color) 15%, transparent);
    color: var(--badge-color);
}
.post-tag { padding: 3px 10px; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.75rem; color: var(--text-secondary); }

.pv-content { line-height: 1.8; font-size: 1rem; color: var(--text-primary); }
.pv-content h1 { font-size: 1.8rem; font-weight: 800; margin: 1.5em 0 0.5em; }
.pv-content h2 { font-size: 1.4rem; font-weight: 700; margin: 1.3em 0 0.4em; }
.pv-content h3 { font-size: 1.15rem; font-weight: 600; margin: 1.2em 0 0.3em; }
.pv-content p { margin: 0.8em 0; }
.pv-content ul, .pv-content ol { padding-left: 1.5em; }
.pv-content blockquote {
    border-left: 3px solid var(--accent); padding-left: 16px; margin: 1em 0;
    color: var(--text-secondary); font-style: italic;
}
.pv-content code {
    padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.85em; color: var(--accent);
}
.pv-content pre {
    background: var(--bg-tertiary); border-radius: 10px; padding: 16px 20px;
    overflow-x: auto; margin: 1em 0;
}
.pv-content pre code { background: transparent; padding: 0; color: var(--text-primary); font-size: 0.85rem; }
.pv-content img { max-width: 100%; border-radius: 10px; margin: 1em 0; }
.pv-content hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.pv-content a { color: var(--accent); text-decoration: underline; }

.pv-interaction-bar {
    display: flex; align-items: center; gap: 16px; padding: 16px 0;
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 24px 0;
}
.pv-vote-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    border: 1px solid var(--border); border-radius: 10px; background: transparent;
    color: var(--text-secondary); cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;
}
.pv-vote-btn:hover { border-color: var(--accent); color: var(--accent); }
.pv-vote-btn.voted { background: var(--accent); color: #fff; border-color: var(--accent); }
.pv-bookmark-btn {
    padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px;
    background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center;
}
.pv-bookmark-btn:hover { color: var(--accent); border-color: var(--accent); }
.pv-bookmark-btn.bookmarked { color: var(--accent); border-color: var(--accent); }
.pv-comment-count { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-secondary); margin-left: auto; }

/* Comments */
.pv-comments { margin-bottom: 40px; }
.pv-comments-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }

.comment-form { margin-bottom: 24px; }
.comment-input {
    width: 100%; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text-primary); font-size: 0.9rem; font-family: inherit;
    resize: vertical; outline: none; line-height: 1.5; box-sizing: border-box;
}
.comment-input:focus { border-color: var(--accent); }
.comment-submit-btn {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 8px 18px;
    background: var(--accent); color: #fff; border: none; border-radius: 8px;
    font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.comment-submit-btn:hover { opacity: 0.9; }
.comment-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.comments-empty { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px; }

.comment-node { margin-bottom: 12px; }
.comment-box {
    padding: 14px 18px; background: var(--bg-secondary); border: 1px solid var(--border);
    border-radius: 12px; transition: border-color 0.2s;
}
.comment-box:hover { border-color: color-mix(in srgb, var(--border) 80%, var(--accent)); }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.comment-author { display: flex; align-items: center; gap: 8px; }
.comment-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
.comment-avatar-placeholder {
    width: 22px; height: 22px; border-radius: 50%; background: var(--bg-tertiary);
    display: flex; align-items: center; justify-content: center; color: var(--text-muted);
}
.comment-author-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); text-decoration: none; }
.comment-author-name:hover { color: var(--accent); }
.comment-time { font-size: 0.7rem; color: var(--text-muted); }
.comment-actions { display: flex; gap: 6px; }
.comment-reply-btn, .comment-delete-btn {
    display: flex; align-items: center; gap: 4px; padding: 4px 8px;
    border: none; background: transparent; color: var(--text-muted);
    cursor: pointer; font-size: 0.75rem; border-radius: 4px; transition: all 0.2s;
}
.comment-reply-btn:hover { color: var(--accent); background: var(--bg-tertiary); }
.comment-delete-btn:hover { color: #e53935; background: var(--bg-tertiary); }
.comment-content { font-size: 0.9rem; color: var(--text-primary); line-height: 1.6; margin: 0; white-space: pre-wrap; }

.comment-reply-form { margin-top: 10px; }
.comment-reply-actions { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
.comment-cancel-reply {
    border: none; background: transparent; color: var(--text-muted);
    cursor: pointer; font-size: 0.8rem; text-decoration: underline;
}
.comment-replies { margin-top: 8px; border-left: 2px solid var(--border); padding-left: 0; }
`;
