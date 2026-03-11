import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import TipTapEditor from '../components/editor/TipTapEditor';
import { Save, Send, ArrowLeft, X, Plus, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const POST_TYPES = [
    { value: 'article', label: 'Article', desc: 'Tutorial, guide, or general knowledge' },
    { value: 'editorial', label: 'Editorial', desc: 'Problem solution or contest editorial' },
    { value: 'discussion', label: 'Discussion', desc: 'Open discussion or question' },
    { value: 'interview', label: 'Interview Exp.', desc: 'Interview experience / story' },
];

export default function PostEditor() {
    const { id } = useParams(); // For editing existing posts
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState(null);
    const [excerpt, setExcerpt] = useState('');
    const [type, setType] = useState('article');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(!!id);
    const [existingId, setExistingId] = useState(id || null);

    // Load existing post for editing
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await fetch(`${API}/posts/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    const p = data.post;
                    setTitle(p.title);
                    setContent(p.content);
                    setExcerpt(p.excerpt || '');
                    setType(p.type);
                    setTags(p.tags || []);
                    setExistingId(p.id);
                }
            } catch (err) {
                console.error('Failed to load post:', err);
            }
            setLoading(false);
        })();
    }, [id, accessToken]);

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t) && tags.length < 5) {
            setTags([...tags, t]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

    const handleSave = async (status = 'draft') => {
        // Read the DOM directly to avoid React state race condition
        const titleEl = document.querySelector('.editor-title-input');
        const currentTitle = titleEl ? titleEl.value : title;
        if (!currentTitle.trim()) return alert('Title is required');
        if (!content) return alert('Write some content first');

        const isPublish = status === 'published';
        if (isPublish) setPublishing(true); else setSaving(true);

        try {
            const body = { title: currentTitle, content, excerpt: excerpt || null, type, tags, status };
            const url = existingId ? `${API}/posts/${existingId}` : `${API}/posts`;
            const method = existingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(body),
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                if (isPublish) {
                    navigate(`/blog/${data.post.slug}`);
                } else {
                    setExistingId(data.post.id);
                    setTitle(currentTitle); // sync state
                    setSaving(false);
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                    return; // Skip the cleanup below
                }
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        }
        setSaving(false);
        setPublishing(false);
    };

    if (loading) {
        return (
            <div className="post-editor-page">
                <div className="blog-loading"><Loader2 size={24} className="spin" /> Loading editor...</div>
                <style>{editorStyles}</style>
            </div>
        );
    }

    return (
        <div className="post-editor-page">
            <div className="editor-top-bar">
                <button className="editor-back-btn" onClick={() => navigate('/blog')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="editor-top-actions">
                    <button
                        className={`editor-save-draft-btn ${saved ? 'saved' : ''}`}
                        onClick={() => handleSave('draft')}
                        disabled={saving || publishing}
                    >
                        <Save size={14} /> {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Draft'}
                    </button>
                    <button
                        className="editor-publish-btn"
                        onClick={() => handleSave('published')}
                        disabled={saving || publishing}
                    >
                        <Send size={14} /> {publishing ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </div>

            {/* Title */}
            <input
                className="editor-title-input"
                placeholder="Post title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
            />

            {/* Metadata row */}
            <div className="editor-meta-row">
                <div className="editor-meta-field">
                    <label>Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="editor-select">
                        {POST_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                <div className="editor-meta-field editor-tags-field">
                    <label>Tags</label>
                    <div className="editor-tags-wrap">
                        {tags.map(tag => (
                            <span key={tag} className="editor-tag">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="editor-tag-remove"><X size={10} /></button>
                            </span>
                        ))}
                        {tags.length < 5 && (
                            <div className="editor-tag-input-wrap">
                                <input
                                    className="editor-tag-input"
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                />
                                <button className="editor-tag-add-btn" onClick={addTag}><Plus size={12} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Excerpt */}
            <div className="editor-excerpt-field">
                <label>Excerpt (optional)</label>
                <textarea
                    className="editor-excerpt"
                    placeholder="Brief summary shown in the feed..."
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    rows={2}
                />
            </div>

            {/* Editor */}
            <TipTapEditor content={content} onChange={setContent} placeholder="Write your post here..." />

            <style>{editorStyles}</style>
        </div>
    );
}

const editorStyles = `
.post-editor-page { max-width: 860px; margin: 0 auto; padding: 24px; }

.editor-top-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.editor-back-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px;
    background: transparent; border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.editor-back-btn:hover { border-color: var(--text-primary); color: var(--text-primary); }
.editor-top-actions { display: flex; gap: 8px; }
.editor-save-draft-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text-primary); cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s;
}
.editor-save-draft-btn.saved { border-color: #4caf50; color: #4caf50; }
.editor-publish-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 20px;
    background: var(--accent); border: none; border-radius: 8px;
    color: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
}
.editor-publish-btn:hover { opacity: 0.9; }

.editor-title-input {
    width: 100%; padding: 0; margin-bottom: 20px;
    background: transparent; border: none; outline: none;
    font-size: 2rem; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.02em; line-height: 1.2;
}
.editor-title-input::placeholder { color: var(--text-muted); }

.editor-meta-row {
    display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;
}
.editor-meta-field { display: flex; flex-direction: column; gap: 6px; }
.editor-meta-field label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.editor-select {
    padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-primary); font-size: 0.85rem; outline: none;
}
.editor-tags-field { flex: 1; }
.editor-tags-wrap {
    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
    padding: 6px 10px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; min-height: 38px;
}
.editor-tag {
    display: flex; align-items: center; gap: 4px; padding: 4px 10px;
    background: var(--accent); color: #fff; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
}
.editor-tag-remove { border: none; background: transparent; color: rgba(255,255,255,0.7); cursor: pointer; padding: 0; display: flex; }
.editor-tag-input-wrap { display: flex; align-items: center; gap: 4px; }
.editor-tag-input {
    border: none; background: transparent; color: var(--text-primary);
    font-size: 0.8rem; outline: none; width: 90px;
}
.editor-tag-add-btn {
    border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
    padding: 2px; display: flex; transition: color 0.2s;
}
.editor-tag-add-btn:hover { color: var(--accent); }

.editor-excerpt-field { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
.editor-excerpt-field label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.editor-excerpt {
    padding: 10px 14px; background: var(--bg-tertiary); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-primary); font-size: 0.85rem; resize: vertical;
    outline: none; font-family: inherit; line-height: 1.5;
}

/* TipTap editor styling */
.tiptap-editor {
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
    background: var(--bg-secondary);
}
.editor-toolbar {
    display: flex; align-items: center; gap: 2px; padding: 8px 12px;
    border-bottom: 1px solid var(--border); background: var(--bg-tertiary);
    flex-wrap: wrap;
}
.editor-toolbar-group { display: flex; gap: 2px; }
.editor-toolbar-divider { width: 1px; height: 24px; background: var(--border); margin: 0 6px; }
.editor-toolbar-spacer { flex: 1; }
.editor-toolbar-btn {
    width: 32px; height: 32px; border: none; background: transparent;
    border-radius: 6px; color: var(--text-secondary); cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.editor-toolbar-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
.editor-toolbar-btn.active { background: var(--accent); color: #fff; }

.editor-content { min-height: 400px; }
.editor-content .tiptap { padding: 20px 24px; outline: none; min-height: 400px; color: var(--text-primary); font-size: 0.95rem; line-height: 1.7; }
.editor-content .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder); float: left; color: var(--text-muted);
    pointer-events: none; height: 0;
}
.editor-content .tiptap h1 { font-size: 1.8rem; font-weight: 800; margin: 1.5em 0 0.5em; }
.editor-content .tiptap h2 { font-size: 1.4rem; font-weight: 700; margin: 1.3em 0 0.4em; }
.editor-content .tiptap h3 { font-size: 1.15rem; font-weight: 600; margin: 1.2em 0 0.3em; }
.editor-content .tiptap ul, .editor-content .tiptap ol { padding-left: 1.5em; }
.editor-content .tiptap blockquote {
    border-left: 3px solid var(--accent); padding-left: 16px; margin: 1em 0;
    color: var(--text-secondary); font-style: italic;
}
.editor-content .tiptap code {
    padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.85em; color: var(--accent);
}
.editor-content .tiptap pre {
    background: var(--bg-tertiary); border-radius: 10px; padding: 16px 20px;
    overflow-x: auto; margin: 1em 0;
}
.editor-content .tiptap pre code {
    background: transparent; padding: 0; color: var(--text-primary); font-size: 0.85rem;
}
.editor-content .tiptap img { max-width: 100%; border-radius: 10px; margin: 1em 0; }
.editor-content .tiptap hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.editor-content .tiptap a { color: var(--accent); text-decoration: underline; }
`;
