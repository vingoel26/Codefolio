import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Plus, Search, Copy, Trash2, Edit3, Check, X, Code2, Filter, ChevronDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const LANGUAGES = ['cpp', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'c', 'csharp', 'kotlin'];
const CATEGORIES = ['Segment Tree', 'BIT / Fenwick', 'DSU / Union-Find', 'Dijkstra', 'BFS / DFS', 'Dynamic Programming', 'Binary Search', 'KMP / String', 'Trie', 'Graph', 'Tree', 'Math / Number Theory', 'Geometry', 'Greedy', 'Sorting', 'Stack / Queue', 'Hashing', 'Simulation', 'Other'];

export default function Snippets() {
    const { accessToken } = useAuthStore();
    const [snippets, setSnippets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLang, setFilterLang] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [editing, setEditing] = useState(null);     // snippet being edited/created
    const [copied, setCopied] = useState(null);        // id of copied snippet
    const [showFilters, setShowFilters] = useState(false);

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Fetch snippets
    const fetchSnippets = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterLang) params.set('language', filterLang);
        if (filterCat) params.set('category', filterCat);
        try {
            const res = await fetch(`${API}/snippets?${params}`, { headers, credentials: 'include' });
            const data = await res.json();
            setSnippets(data.snippets || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [accessToken, search, filterLang, filterCat]);

    useEffect(() => { fetchSnippets(); }, [fetchSnippets]);

    // Create / Update
    const handleSave = async () => {
        if (!editing) return;
        const isNew = !editing.id;
        const url = isNew ? `${API}/snippets` : `${API}/snippets/${editing.id}`;
        const method = isNew ? 'POST' : 'PUT';
        try {
            await fetch(url, { method, headers, credentials: 'include', body: JSON.stringify(editing) });
            setEditing(null);
            fetchSnippets();
        } catch { /* ignore */ }
    };

    // Delete
    const handleDelete = async (id) => {
        if (!confirm('Delete this snippet?')) return;
        try {
            await fetch(`${API}/snippets/${id}`, { method: 'DELETE', headers, credentials: 'include' });
            fetchSnippets();
        } catch { /* ignore */ }
    };

    // Copy to clipboard
    const handleCopy = (snippet) => {
        navigator.clipboard.writeText(snippet.code);
        setCopied(snippet.id);
        setTimeout(() => setCopied(null), 2000);
    };

    // New snippet template
    const startNew = () => setEditing({ title: '', code: '', language: 'cpp', category: '', tags: [] });

    return (
        <div className="snippets-page">
            {/* Header */}
            <div className="sn-header">
                <div>
                    <h1 className="sn-title"><Code2 size={24} /> Snippet Vault</h1>
                    <p className="sn-subtitle">{snippets.length} snippets saved</p>
                </div>
                <button className="sn-new-btn" onClick={startNew}><Plus size={16} /> New Snippet</button>
            </div>

            {/* Search & Filters */}
            <div className="sn-toolbar">
                <div className="sn-search">
                    <Search size={16} />
                    <input type="text" placeholder="Search snippets..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <button className="sn-filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={14} /> Filters <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
            </div>

            {showFilters && (
                <div className="sn-filters">
                    <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
                        <option value="">All Languages</option>
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                        <option value="">All Categories</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {(filterLang || filterCat) && (
                        <button className="sn-clear-btn" onClick={() => { setFilterLang(''); setFilterCat(''); }}>Clear</button>
                    )}
                </div>
            )}

            {/* Editor Modal */}
            {editing && (
                <div className="sn-modal-overlay" onClick={() => setEditing(null)}>
                    <div className="sn-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="sn-modal-header">
                            <h2>{editing.id ? 'Edit Snippet' : 'New Snippet'}</h2>
                            <button className="sn-close" onClick={() => setEditing(null)}><X size={18} /></button>
                        </div>
                        <div className="sn-form">
                            <input className="sn-input" placeholder="Title (e.g., Segment Tree with Lazy Propagation)" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                            <div className="sn-form-row">
                                <select className="sn-select" value={editing.language} onChange={(e) => setEditing({ ...editing, language: e.target.value })}>
                                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <select className="sn-select" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                                    <option value="">No Category</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <input className="sn-input" placeholder="Tags (comma-separated: competitive, template, easy)" value={(editing.tags || []).join(', ')}
                                onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
                            <textarea className="sn-code-editor" placeholder="Paste your code here..." value={editing.code}
                                onChange={(e) => setEditing({ ...editing, code: e.target.value })} spellCheck="false" />
                        </div>
                        <div className="sn-modal-footer">
                            <button className="sn-cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                            <button className="sn-save-btn" onClick={handleSave} disabled={!editing.title || !editing.code}>
                                {editing.id ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snippet List */}
            {loading ? (
                <div className="sn-empty">Loading...</div>
            ) : snippets.length === 0 ? (
                <div className="sn-empty">
                    <Code2 size={40} />
                    <p>No snippets yet</p>
                    <p className="sn-empty-sub">Click "New Snippet" to save your first algorithm template.</p>
                </div>
            ) : (
                <div className="sn-list">
                    {snippets.map((s) => (
                        <div key={s.id} className="sn-card glass-card">
                            <div className="sn-card-header">
                                <div className="sn-card-meta">
                                    <span className="sn-lang-badge" data-lang={s.language}>{s.language}</span>
                                    {s.category && <span className="sn-cat-badge">{s.category}</span>}
                                </div>
                                <div className="sn-card-actions">
                                    <button className="sn-action-btn" onClick={() => handleCopy(s)} title="Copy code">
                                        {copied === s.id ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                    <button className="sn-action-btn" onClick={() => setEditing(s)} title="Edit"><Edit3 size={14} /></button>
                                    <button className="sn-action-btn del" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="sn-card-title">{s.title}</h3>
                            <pre className="sn-code-preview"><code>{s.code.length > 500 ? s.code.slice(0, 500) + '\n...' : s.code}</code></pre>
                            {s.tags?.length > 0 && <div className="sn-tags">{s.tags.map((t) => <span key={t} className="sn-tag">#{t}</span>)}</div>}
                            <div className="sn-card-footer">{new Date(s.updatedAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}

            <style>{styles}</style>
        </div>
    );
}

const styles = `
    .snippets-page { max-width: 1100px; margin: 0 auto; }
    .sn-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
    .sn-title { display:flex; align-items:center; gap:10px; font-size:1.5rem; font-weight:800; }
    .sn-subtitle { color:var(--text-muted); font-size:0.8125rem; margin-top:4px; }
    .sn-new-btn { display:flex; align-items:center; gap:6px; padding:10px 20px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); font-weight:700; font-size:0.875rem; cursor:pointer; transition:all var(--transition-fast); font-family:var(--font-sans); }
    .sn-new-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }

    .sn-toolbar { display:flex; gap:10px; margin-bottom:12px; }
    .sn-search { display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); flex:1; }
    .sn-search input { border:none; background:none; outline:none; color:var(--text-primary); font-size:0.875rem; width:100%; font-family:var(--font-sans); }
    .sn-search input::placeholder { color:var(--text-muted); }
    .sn-search svg { color:var(--text-muted); flex-shrink:0; }
    .sn-filter-btn { display:flex; align-items:center; gap:6px; padding:10px 14px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:var(--font-sans); transition:all var(--transition-fast); }
    .sn-filter-btn:hover { border-color:var(--accent); }

    .sn-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
    .sn-filters select { padding:8px 12px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:0.8125rem; font-family:var(--font-sans); cursor:pointer; }
    .sn-clear-btn { padding:8px 12px; border:1px solid var(--border); border-radius:var(--radius-md); background:none; color:var(--error); font-size:0.8125rem; cursor:pointer; font-family:var(--font-sans); }

    /* Modal */
    .sn-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(4px); }
    .sn-modal { width:90%; max-width:700px; max-height:90vh; overflow-y:auto; padding:24px; border-radius:var(--radius-lg); }
    .sn-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .sn-modal-header h2 { font-size:1.125rem; font-weight:700; }
    .sn-close { background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; }
    .sn-close:hover { color:var(--text-primary); }
    .sn-form { display:flex; flex-direction:column; gap:12px; }
    .sn-form-row { display:flex; gap:10px; }
    .sn-input { padding:10px 14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.875rem; font-family:var(--font-sans); outline:none; }
    .sn-input:focus { border-color:var(--accent); }
    .sn-select { padding:10px 14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.875rem; font-family:var(--font-sans); cursor:pointer; flex:1; }
    .sn-code-editor { padding:14px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-primary); color:var(--text-primary); font-family:'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-size:0.8125rem; line-height:1.6; resize:vertical; min-height:250px; outline:none; tab-size:4; white-space:pre; overflow-x:auto; }
    .sn-code-editor:focus { border-color:var(--accent); }
    .sn-modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
    .sn-cancel-btn { padding:8px 20px; border:1px solid var(--border); border-radius:var(--radius-md); background:none; color:var(--text-secondary); font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:var(--font-sans); }
    .sn-save-btn { padding:8px 24px; border:none; border-radius:var(--radius-md); background:var(--accent); color:#fff; font-size:0.8125rem; font-weight:700; cursor:pointer; font-family:var(--font-sans); transition:all var(--transition-fast); }
    .sn-save-btn:hover { filter:brightness(1.15); }
    .sn-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

    /* Snippet Cards */
    .sn-list { display:flex; flex-direction:column; gap:14px; }
    .sn-card { padding:18px; border-radius:var(--radius-lg); transition:border-color var(--transition-fast); }
    .sn-card:hover { border-color:var(--accent); }
    .sn-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .sn-card-meta { display:flex; gap:8px; align-items:center; }
    .sn-lang-badge { padding:2px 10px; border-radius:var(--radius-sm); background:var(--accent); color:#fff; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; }
    .sn-lang-badge[data-lang="python"] { background:#3776ab; }
    .sn-lang-badge[data-lang="java"] { background:#ed8b00; }
    .sn-lang-badge[data-lang="javascript"] { background:#f7df1e; color:#000; }
    .sn-lang-badge[data-lang="go"] { background:#00add8; }
    .sn-lang-badge[data-lang="rust"] { background:#dea584; color:#000; }
    .sn-cat-badge { padding:2px 10px; border-radius:var(--radius-sm); background:var(--bg-tertiary); color:var(--text-secondary); font-size:0.65rem; font-weight:600; }
    .sn-card-actions { display:flex; gap:4px; }
    .sn-action-btn { padding:6px; border:none; background:none; color:var(--text-muted); cursor:pointer; border-radius:var(--radius-sm); transition:all var(--transition-fast); }
    .sn-action-btn:hover { color:var(--text-primary); background:var(--bg-tertiary); }
    .sn-action-btn.del:hover { color:var(--error); }
    .sn-card-title { font-size:0.9375rem; font-weight:700; margin-bottom:10px; }
    .sn-code-preview { padding:12px; background:var(--bg-primary); border-radius:var(--radius-md); border:1px solid var(--border); overflow-x:auto; margin-bottom:8px; }
    .sn-code-preview code { font-family:'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-size:0.75rem; line-height:1.5; color:var(--text-secondary); white-space:pre; }
    .sn-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
    .sn-tag { font-size:0.65rem; color:var(--accent); font-weight:600; }
    .sn-card-footer { font-size:0.65rem; color:var(--text-muted); }

    .sn-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:40vh; gap:8px; color:var(--text-muted); text-align:center; }
    .sn-empty-sub { font-size:0.8125rem; }
`;
