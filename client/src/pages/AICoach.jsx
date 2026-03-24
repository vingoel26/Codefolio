import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Target, Brain, ArrowLeft, MessageSquare, Info, Activity, Wifi, Shield } from 'lucide-react';
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
                    history: isGreeting ? [] : aiMessages.map(m => ({ role: m.role, content: m.content.replace(/<[^>]*>?/gm, '') })),
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
                // Professional bolding & line-break formatter
                const formatted = data.reply.replace(/\n\n/g, '<br/><br/>')
                                          .replace(/\n/g, '<br/>')
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                setAiMessages(prev => [...prev, { role: 'assistant', content: formatted }]);
            } else {
                setAiMessages(prev => [...prev, { role: 'assistant', content: "Coach link disrupted. Attempting to re-establish..."}]);
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
            <div className="hud-grid-v4" />
            
            <header className="coach-hero-header-v2 animate-fade-in">
                <div className="flex items-center justify-between px-12 py-6 relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="coach-logo-pill pulse-glow">
                            <Brain size={24} className="text-white" />
                        </div>
                        <div className="hero-text-stack">
                            <h1 className="hero-main-title-v2 text-2xl font-1000 tracking-tight">
                                AI COACH
                            </h1>
                            <div className="status-badge flex items-center gap-3">
                                <span className="status-dot-blink-v2" />
                                <span className="text-[10px] font-950 text-muted uppercase tracking-[0.2em] opacity-40">
                                    HELLEN_SYNC // ACTIVE_LEARNING
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="coach-main-container-v2 flex-1 flex p-16 gap-12 overflow-hidden">
                {/* HUD Sidebar */}
                <aside className="coach-sidebar-v3 group">
                    <div className="sidebar-inner p-10 flex flex-col h-full gap-10">
                        <section className="profile-sync">
                            <div className="space-y-6">
                                <div className="stat-card-v3 group/card">
                                    <div className="stat-info">
                                        <span className="text-[9px] font-1000 uppercase tracking-[0.2em] opacity-30 block mb-2">RATING</span>
                                        <span className="text-3xl font-1000 tracking-tighter text-white/90">
                                            {linkedCF?.data?.profile?.rating || '---'}
                                        </span>
                                    </div>
                                    <Target size={22} className="opacity-10 group-hover/card:opacity-40 transition-all text-accent" />
                                </div>
                                
                                <div className="stat-card-v3 group/card">
                                    <div className="stat-info">
                                        <span className="text-[9px] font-1000 uppercase tracking-[0.2em] opacity-30 block mb-2">SOLVES</span>
                                        <span className="text-3xl font-1000 tracking-tighter text-white/90">{totalSolves}</span>
                                    </div>
                                    <Brain size={22} className="opacity-10 group-hover/card:opacity-40 transition-all text-info" />
                                </div>

                                <div className="stat-card-v3 group/card highlight-warning-v2">
                                    <div className="stat-info">
                                        <span className="text-[9px] font-1000 uppercase tracking-[0.2em] opacity-40 block mb-2 text-warning">DEFICIT</span>
                                        <span className="text-sm font-1000 uppercase tracking-tight text-warning leading-tight line-clamp-1">
                                            {weakest?.fullSubject || 'ANALYZING...'}
                                        </span>
                                    </div>
                                    <Info size={22} className="text-warning opacity-20" />
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>

                {/* Main Chat Viewport */}
                <div className="coach-chat-viewport-v3 flex-1 flex flex-col relative overflow-hidden rounded-3xl bg-white/[0.01] border border-white/5">
                    <div className="chat-content-scroller flex-1 overflow-y-auto px-12 py-12" ref={scrollRef}>
                        <div className="messages-max-width-v2 mx-auto space-y-12">
                            {aiMessages.map((msg, i) => (
                                <div key={i} className={`coach-msg-wrapper-v2 ${msg.role === 'user' ? 'msg-usr-v2' : 'msg-hln-v2'}`}>
                                <div className="msg-box-v2 animate-fade-in-up">
                                    <div 
                                        className="msg-bubble-v4"
                                        dangerouslySetInnerHTML={{ __html: msg.content }}
                                    />
                                </div>
                            </div>
                        ))}
                        {isAiLoading && (
                            <div className="coach-msg-wrapper-v2 msg-hln-v2">
                                <div className="msg-box-v2">
                                    <div className="msg-bubble-v4 loading">
                                        <div className="typing-dot-v4"><span></span><span></span><span></span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="chat-input-bar-v3 px-12 pb-12 pt-6 relative z-20">
                        <div className="messages-max-width-v2 mx-auto">
                            <div className="slimmer-input-hull glass-panel-v3">
                                <input 
                                    className="slimmer-coach-input"
                                    value={aiInput}
                                    onChange={e => setAiInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendAiMessage()}
                                    placeholder="Message your AI Coach..."
                                />
                                <button 
                                    className="slimmer-send-btn group"
                                    onClick={() => sendAiMessage()}
                                    disabled={isAiLoading || !aiInput.trim()}
                                >
                                    <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                            <div className="input-hud-info flex justify-between px-8 mt-4 text-[8px] font-1000 opacity-20 uppercase tracking-[0.3em]">
                                <span>Session Secured</span>
                                <span>Logic Engine v1.5.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .coach-page { background: #010409; color: var(--text-primary); font-family: 'Inter', sans-serif; position: relative; overflow: hidden; padding: 40px 0 0 120px; }
                .hud-grid-v4 { position: absolute; inset: 0; background-image: radial-gradient(rgba(108, 92, 231, 0.02) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; opacity: 0.8; z-index: 1; }
                
                /* Header */
                .coach-hero-header-v2 { background: rgba(3, 4, 9, 0.4); border-bottom: 1px solid rgba(255,255,255,0.03); backdrop-filter: blur(40px); }
                .coach-logo-pill { width: 48px; height: 48px; background: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px var(--accent-glow); border: 1px solid rgba(255,255,255,0.1); }
                .hero-main-title-v2 { color: white; letter-spacing: -0.02em; line-height: 1; }
                
                .status-dot-blink-v2 { width: 10px; height: 10px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 15px #00ff88; animation: blink-hud-v2 1.5s infinite; }
                @keyframes blink-hud-v2 { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }
                
                .coach-exit-link { display: flex; align-items: center; gap: 10px; font-size: 0.65rem; font-weight: 1000; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; padding: 12px 24px; border-radius: 12px; background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
                .coach-exit-link:hover { color: white; border-color: var(--accent); background: var(--accent-subtle); }

                /* Sidebar */
                .coach-sidebar-v3 { width: 380px; background: rgba(2, 6, 23, 0.4); border-radius: 24px; border: 1px solid rgba(255,255,255,0.03); backdrop-filter: blur(30px); }
                .stat-card-v3 { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); padding: 24px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; transition: all 0.4s; }
                .stat-card-v3:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); transform: translateY(-3px); }
                
                .protocol-item-v2 { display: flex; align-items: center; gap: 12px; font-size: 10px; font-weight: 900; color: var(--text-muted); letter-spacing: 0.1em; }
                .protocol-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); opacity: 0.6; }

                /* Chat */
                .coach-chat-viewport-v3 { background: linear-gradient(180deg, rgba(255,255,255,0.005) 0%, transparent 100%); }
                .messages-max-width-v2 { max-width: 880px; width: 100%; }
                .coach-msg-wrapper-v2 { display: flex; width: 100%; margin-bottom: 32px; }
                .msg-usr-v2 { justify-content: flex-end; }
                .msg-box-v2 { max-width: 85%; min-width: 280px; }

                .msg-bubble-v4 { padding: 24px 32px; border-radius: 20px; font-size: 0.925rem; line-height: 1.7; position: relative; color: #acc1da; background: rgba(18, 18, 26, 0.4); border: 1px solid rgba(255,255,255,0.03); box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
                .msg-bubble-v4 strong { color: white; font-weight: 1000; }
                .msg-hln-v2 .msg-bubble-v4 { border-left: 3px solid var(--accent); border-bottom-left-radius: 4px; }
                .msg-usr-v2 .msg-bubble-v4 { background: var(--accent); color: white; border-bottom-right-radius: 4px; box-shadow: 0 15px 30px -10px var(--accent-glow); font-weight: 500; border: none; }

                /* Input Slimmer */
                .slimmer-input-hull { display: flex; align-items: center; gap: 16px; padding: 6px 6px 6px 24px; border-radius: 100px; background: rgba(18, 18, 26, 0.8); border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 20px 60px rgba(0,0,0,0.6); transition: all 0.4s; }
                .slimmer-input-hull:focus-within { border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 30px 80px var(--accent-glow); }
                .slimmer-coach-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 0.95rem; font-weight: 500; padding: 14px 0; }
                .slimmer-send-btn { width: 48px; height: 48px; background: var(--accent); color: white; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; border: none; cursor: pointer; }
                .slimmer-send-btn:hover:not(:disabled) { background: var(--accent-hover); box-shadow: 0 0 20px var(--accent-glow); }

                .typing-dot-v4 { display: flex; gap: 8px; padding: 4px 0; }
                .typing-dot-v4 span { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; opacity: 0.4; animation: pulse-v4 1.2s infinite ease-in-out; }
                .typing-dot-v4 span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot-v4 span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes pulse-v4 { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }

                /* Hide global chat */
                .flex-center.fixed.bottom-6.right-6.z-50 { display: none !important; }
            `}</style>
        </div>
    );
}
