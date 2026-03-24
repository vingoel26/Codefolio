import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Target, Brain, ArrowLeft, MessageSquare, Info } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { aggregateToMacroCategories } from '../utils/tagMapper';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function AICoach() {
    const user = useAuthStore(s => s.user);
    const [loading, setLoading] = useState(true);
    const [linkedCF, setLinkedCF] = useState(null);
    const [radarData, setRadarData] = useState([]);
    
    // AI Coach state
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const hasInitialized = useRef(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (hasInitialized.current) return;
            
            try {
                const res = await fetch(`${API_URL}/users/linked-accounts`, {
                    headers: { 'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const primaryCF = data.accounts.find(a => a.platform === 'codeforces' && a.isPrimary) || 
                                      data.accounts.find(a => a.platform === 'codeforces');
                    
                    if (primaryCF && !hasInitialized.current) {
                        hasInitialized.current = true;
                        setLinkedCF(primaryCF);
                        const tags = primaryCF.data?.tagDistribution || {};
                        const chartData = aggregateToMacroCategories(tags);
                        setRadarData(chartData);

                        // Initial Greeting
                        sendAiMessage("Hello Hellen! Analyze my current profile and give me a brief introduction on how you can help me improve today.", {
                            rating: primaryCF.data?.profile?.rating,
                            totalSolves: chartData.reduce((acc, c) => acc + c.rawSolves, 0),
                            weakestCategory: [...chartData].sort((a,b) => a.normalized - b.normalized)[0]?.fullSubject,
                            macroScores: tags
                        }, true);
                    }
                }
            } catch (err) {
                console.error("Failed to load coach data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [aiMessages]);

    const sendAiMessage = async (textOverride = null, stats = null, isGreeting = false) => {
        const text = textOverride || aiInput;
        if (!text.trim()) return;

        if (!isGreeting) {
            setAiMessages(prev => [...prev, { role: 'user', content: text }]);
            setAiInput('');
        }
        setIsAiLoading(true);

        try {
            const res = await fetch(`${API_URL}/ai/coach`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}`
                },
                body: JSON.stringify({
                    message: text,
                    history: isGreeting ? [] : aiMessages,
                    cfStats: stats || {
                        rating: linkedCF?.data?.profile?.rating,
                        totalSolves: radarData.reduce((acc, c) => acc + c.rawSolves, 0),
                        weakestCategory: [...radarData].sort((a,b) => a.normalized - b.normalized)[0]?.fullSubject,
                        macroScores: linkedCF?.data?.tagDistribution
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setAiMessages(prev => [...prev, { role: 'assistant', content: "Neural link disrupted. Attempting to re-establish..."}]);
            }
        } catch (e) {
            setAiMessages(prev => [...prev, { role: 'assistant', content: "Critical link failure. Please check your network."}]);
        } finally {
            setIsAiLoading(false);
        }
    };

    if (loading) return <div className="flex-center h-screen"><Loader2 size={40} className="spin text-accent" /></div>;

    const totalSolves = radarData.reduce((acc, c) => acc + c.rawSolves, 0);
    const weakest = [...radarData].sort((a,b) => a.normalized - b.normalized)[0];

    return (
        <div className="coach-page min-h-screen flex flex-col">
            <div className="neural-bg-glow" />
            
            <header className="coach-hero-header glass-header animate-fade-in">
                <div className="flex items-center justify-between px-10 py-6">
                    <div className="flex items-center gap-6">
                        <div className="coach-logo-orb pulse-glow">
                            <Brain size={28} className="text-white" />
                        </div>
                        <div className="hero-text-stack">
                            <h1 className="hero-main-title text-2xl font-900 tracking-tight">
                                NEURAL LOGIC MENTOR
                            </h1>
                            <div className="status-badge flex items-center gap-2">
                                <span className="status-dot-blink" />
                                <span className="text-[10px] font-900 text-muted uppercase tracking-widest">SYSTEM ONLINE // HELLEN V2.0</span>
                            </div>
                        </div>
                    </div>
                    <Link to="/analytics" className="neural-back-link group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Matrix</span>
                    </Link>
                </div>
            </header>

            <main className="coach-main-container flex-1 flex overflow-hidden">
                {/* Stats Sidebar */}
                <aside className="premium-glass-panel coach-sidebar-v2">
                    <div className="sidebar-inner p-10 flex flex-col h-full gap-10">
                        <section className="profile-sync">
                            <h4 className="panel-label-v2 mb-6">Neural Identity</h4>
                            <div className="space-y-4">
                                <div className="stat-card-v2 group">
                                    <div className="group-hover:text-accent transition-colors">
                                        <span className="text-[10px] font-900 uppercase tracking-widest opacity-50 block mb-1">Current Rating</span>
                                        <span className="text-2xl font-900 tracking-tight">{linkedCF?.data?.profile?.rating || '???'}</span>
                                    </div>
                                    <Target size={20} className="opacity-20 group-hover:opacity-100 transition-all text-accent" />
                                </div>
                                <div className="stat-card-v2 group">
                                    <div>
                                        <span className="text-[10px] font-900 uppercase tracking-widest opacity-50 block mb-1">Neural Solves</span>
                                        <span className="text-2xl font-900 tracking-tight">{totalSolves}</span>
                                    </div>
                                    <Brain size={20} className="opacity-20 group-hover:opacity-100 transition-all text-info" />
                                </div>
                                <div className="stat-card-v2 group highlight-error">
                                    <div>
                                        <span className="text-[10px] font-900 uppercase tracking-widest opacity-50 block mb-1">Critical Deficit</span>
                                        <span className="text-sm font-900 uppercase tracking-tight text-error line-clamp-1">{weakest?.fullSubject || 'Scanning...'}</span>
                                    </div>
                                    <Info size={20} className="text-error opacity-40" />
                                </div>
                            </div>
                        </section>

                        <section className="capabilities mt-auto">
                            <h4 className="panel-label-v2 mb-6 text-accent">Synthesis Protocol</h4>
                            <ul className="space-y-4 text-xs font-700 tracking-wide text-muted">
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Logic Pattern Mapping</li>
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Algorithmic Correction</li>
                                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> Neural Load Optimization</li>
                            </ul>
                        </section>
                    </div>
                </aside>

                {/* Chat Area */}
                <div className="coach-chat-viewport-v2 flex-1 flex flex-col relative">
                    <div className="chat-content-scroller flex-1 overflow-y-auto px-12 py-12 space-y-10" ref={scrollRef}>
                        {aiMessages.map((msg, i) => (
                            <div key={i} className={`coach-msg-wrapper ${msg.role === 'user' ? 'msg-developer' : 'msg-hellen'}`}>
                                <div className="msg-box animate-fade-in-up">
                                    <div className="msg-header flex items-center gap-3 mb-2">
                                        <span className="msg-sender text-[10px] font-900 tracking-widest uppercase opacity-40">
                                            {msg.role === 'user' ? 'Developer' : 'Hellen Sync'}
                                        </span>
                                        <div className="msg-line flex-1 h-[1px] bg-border/20" />
                                    </div>
                                    <div className="msg-bubble-v3">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isAiLoading && (
                            <div className="coach-msg-wrapper msg-hellen">
                                <div className="msg-box animate-pulse">
                                    <div className="msg-header flex items-center gap-3 mb-2">
                                        <span className="msg-sender text-[10px] font-900 tracking-widest uppercase opacity-40">Hellen Sync</span>
                                        <div className="msg-line flex-1 h-[1px] bg-border/20" />
                                    </div>
                                    <div className="msg-bubble-v3 loading">
                                        <div className="typing-loader"><span></span><span></span><span></span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chat-input-bar-v2 px-12 pb-12 pt-4">
                        <div className="premium-input-shell glass-panel-v2">
                            <input 
                                type="text" 
                                value={aiInput}
                                onChange={e => setAiInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendAiMessage()}
                                placeholder="Sync message with logic mentor..."
                                className="premium-coach-input"
                            />
                            <button 
                                className="premium-send-btn pulse-accent"
                                onClick={() => sendAiMessage()}
                                disabled={isAiLoading || !aiInput.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-[9px] text-center mt-4 font-900 text-muted/30 uppercase tracking-[0.3em]">
                            End-To-End Neural Encryption Active
                        </p>
                    </div>
                </div>
            </main>

            <style>{`
                .coach-page { background: #020617; color: var(--text-primary); position: relative; overflow: hidden; }
                .neural-bg-glow { position: absolute; top: -10%; right: -10%; width: 60%; height: 60%; background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%); pointer-events: none; z-index: 0; }
                
                /* Hero Header */
                .coach-hero-header { background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid var(--border); position: relative; z-index: 10; backdrop-filter: blur(20px); }
                .coach-logo-orb { width: 56px; height: 56px; background: var(--accent); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
                .hero-main-title { background: linear-gradient(135deg, white 0%, var(--text-muted) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .status-dot-blink { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: blink 2s infinite; }
                @keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
                
                .neural-back-link { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; padding: 10px 20px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); transition: all 0.3s; }
                .neural-back-link:hover { color: var(--accent); border-color: var(--accent); background: rgba(99, 102, 241, 0.05); }

                /* Sidebar */
                .coach-sidebar-v2 { width: 450px; background: rgba(15, 23, 42, 0.4); border-right: 1px solid var(--border); position: relative; z-index: 5; }
                .stat-card-v2 { background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 24px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .stat-card-v2:hover { transform: translateY(-4px) scale(1.02); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
                .highlight-error:hover { border-color: var(--error); }

                /* Chat */
                .coach-chat-viewport-v2 { background: radial-gradient(circle at center, rgba(15, 23, 42, 0.3) 0%, transparent 100%); }
                .coach-msg-wrapper { display: flex; width: 100%; margin-bottom: 24px; }
                .msg-developer { justify-content: flex-end; }
                .msg-hellen { justify-content: flex-start; }
                .msg-box { max-width: 85%; min-width: 300px; }
                
                .msg-bubble-v3 { padding: 24px; border-radius: 24px; font-size: 0.9375rem; line-height: 1.7; position: relative; transition: all 0.3s; }
                .msg-hellen .msg-bubble-v3 { 
                    background: rgba(30, 41, 59, 0.7); 
                    border: 1px solid var(--border); 
                    border-bottom-left-radius: 4px;
                    color: #cbd5e1;
                    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
                }
                .msg-developer .msg-bubble-v3 { 
                    background: var(--accent); 
                    color: white; 
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.4);
                    font-weight: 500;
                }

                /* Input */
                .premium-input-shell { display: flex; align-items: center; gap: 16px; padding: 10px 10px 10px 32px; border-radius: 24px; background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border); box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5); }
                .premium-coach-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 1rem; padding: 16px 0; }
                .premium-send-btn { width: 56px; height: 56px; background: var(--accent); color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
                .premium-send-btn:hover:not(:disabled) { transform: scale(1.05) rotate(5deg); box-shadow: 0 0 30px var(--accent); }
                
                .typing-loader { display: flex; gap: 6px; }
                .typing-loader span { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: pulse-dot 1.5s infinite; }
                .typing-loader span:nth-child(2) { animation-delay: 0.2s; }
                .typing-loader span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

                /* Premium Glass Utilities */
                .panel-label-v2 { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; color: var(--text-muted); }
                .pulse-glow { animation: pulse-glow 4s infinite ease-in-out; }
                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); } 50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.6); } }

                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
                
                @media (max-width: 1200px) { .coach-sidebar-v2 { width: 350px; } }
            `}</style>
        </div>
    );
}
