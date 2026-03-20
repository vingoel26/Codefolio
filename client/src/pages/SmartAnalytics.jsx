import { useState, useEffect, useMemo } from 'react';
import { Target, Loader2, RefreshCw, AlertCircle, ExternalLink, PlayCircle, MessageSquare, Send } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { aggregateToMacroCategories } from '../utils/tagMapper';

// We pull cached Codeforces problem set if possible, or fetch via REST on-the-fly
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function SmartAnalytics() {
    const user = useAuthStore(s => s.user);
    const [loading, setLoading] = useState(true);
    const [linkedCF, setLinkedCF] = useState(null);
    const [radarData, setRadarData] = useState([]);
    
    // BootCamp state
    const [weakestCategories, setWeakestCategories] = useState([]);
    const [bootcampProblems, setBootcampProblems] = useState({}); // { category: [problems] }
    const [bootcampLoading, setBootcampLoading] = useState(false);

    // AI Coach state
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch linked accounts
                const res = await fetch(`${API_URL}/users/linked-accounts`, {
                    headers: { 'Authorization': `Bearer ${user?.token || useAuthStore.getState().accessToken}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const primaryCF = data.accounts.find(a => a.platform === 'codeforces' && a.isPrimary) || 
                                      data.accounts.find(a => a.platform === 'codeforces');
                    
                    if (primaryCF) {
                        setLinkedCF(primaryCF);
                        
                        // Parse tag distribution logic
                        const tags = primaryCF.data?.tagDistribution || {};
                        const chartData = aggregateToMacroCategories(tags);
                        setRadarData(chartData);

                        // Identify weakest domains (bottom 2 that have > 0 total activity overall)
                        if (chartData.length > 0) {
                            const sorted = [...chartData].sort((a, b) => a.normalized - b.normalized);
                            const bottom2 = sorted.slice(0, 2);
                            setWeakestCategories(bottom2);
                            generateBootcamp(bottom2, primaryCF.data?.profile?.rating || 1200);

                            // Send initial transparent payload to AI to get greeting
                            sendAiMessage("Hello! Please introduce yourself and give me a 2-sentence summary of my Codeforces skill distribution and what my biggest algorithmic weakness seems to be.", {
                                rating: primaryCF.data?.profile?.rating,
                                totalSolves: chartData.reduce((acc, c) => acc + c.rawSolves, 0),
                                weakestCategory: bottom2[0]?.fullSubject,
                                macroScores: primaryCF.data?.tagDistribution
                            }, true);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load analytics data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const generateBootcamp = async (categories, currentRating) => {
        setBootcampLoading(true);
        try {
            // In a real app we'd query our backend DB of problems or hit the CF API.
            // Rather than pulling 10,000 CF problems here on frontend, we ask the backend battle route
            // which already has CF problems cached! We can just call /api/battles creation logic, or since we don't have a direct query route, 
            // we'll fetch the CF problemset API directly.
            
            const res = await fetch('https://codeforces.com/api/problemset.problems');
            if (!res.ok) throw new Error("CF API failed");
            const data = await res.json();
            const allProbs = data.result.problems;

            const targetLow = Math.max(800, currentRating + 100);
            const targetHigh = currentRating + 300; // Pushing them out of comfort zone
            
            const newBootcamps = {};

            categories.forEach(cat => {
                // Heuristic tag matching back to raw CF tags
                const relatedTags = {
                    'Graph Theory & Trees': ['graphs', 'dfs and similar', 'trees', 'shortest paths', 'dsu'],
                    'Dynamic Programming': ['dp', 'bitmasks'],
                    'Math & Number Theory': ['math', 'number theory', 'combinatorics'],
                    'Data Structures': ['data structures', 'segment tree'],
                    'Greedy & Constructive': ['greedy', 'constructive algorithms', 'two pointers']
                }[cat.fullSubject] || [];

                // Find unsolved problems within rating range that have at least one related tag
                let validProbs = allProbs.filter(p => 
                    p.rating && 
                    p.rating >= targetLow && 
                    p.rating <= targetHigh &&
                    p.tags.some(t => relatedTags.includes(t))
                );

                // Pick 5 random ones
                const selected = [];
                // Simple random shill array
                const pool = [...validProbs].sort(() => 0.5 - Math.random());
                for (let i = 0; i < Math.min(5, pool.length); i++) {
                    selected.push(pool[i]);
                }
                newBootcamps[cat.fullSubject] = selected;
            });

            setBootcampProblems(newBootcamps);
        } catch (e) {
            console.error("Bootcamp generation failed", e);
        } finally {
            setBootcampLoading(false);
        }
    };

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
                        weakestCategory: weakestCategories[0]?.fullSubject,
                        macroScores: linkedCF?.data?.tagDistribution
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setAiMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I couldn't reach the backend server to process that."}]);
            }
        } catch (e) {
            setAiMessages(prev => [...prev, { role: 'assistant', content: "An error occurred connecting to the Gemini API."}]);
        } finally {
            setIsAiLoading(false);
        }
    };

    if (loading) {
        return <div className="flex-center h-screen"><Loader2 size={40} className="spin text-accent" /></div>;
    }

    if (!linkedCF || radarData.length === 0) {
        return (
            <div className="analytics-page text-center py-20 px-8">
                <Target size={64} className="text-muted mx-auto mb-6 opacity-30" />
                <h1 className="text-2xl font-bold mb-4">Not Enough Codeforces Data</h1>
                <p className="text-muted max-w-lg mx-auto">
                    Link your Codeforces account and solve a few problems across various tags so the 
                    Algorithmic Blind-Spot Detector can train your neural model!
                </p>
            </div>
        );
    }

    return (
        <div className="analytics-page p-8 max-w-[1400px] mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Target size={32} className="text-accent" /> Algorithmic Blind-Spot Detector
                </h1>
                <p className="text-muted mt-2 text-lg">
                    Analyzing pattern recognition across {radarData.reduce((acc, r) => acc + (r.rawSolves || 0), 0)} Codeforces algorithmic tags.
                </p>
            </header>

            <div className="analytics-grid">
                {/* Radar Chart Section */}
                <div className="panel chart-panel">
                    <h2 className="panel-title">Skill Projection Map</h2>
                    <div className="radar-container" style={{ height: 450 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
                                    formatter={(value, name, props) => [`${props.payload.rawSolves} Solved Problems`, 'Total Volume']}
                                />
                                <Radar 
                                    name="Skills" 
                                    dataKey="normalized" 
                                    stroke="var(--accent)" 
                                    fill="var(--accent)" 
                                    fillOpacity={0.4} 
                                    isAnimationActive={true}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bootcamp Section */}
                <div className="panel bootcamp-panel">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="panel-title mb-0">Personalized Bootcamp</h2>
                        <button 
                            className="btn-secondary btn-sm"
                            onClick={() => generateBootcamp(weakestCategories, linkedCF.data?.profile?.rating || 1200)}
                            disabled={bootcampLoading}
                        >
                            <RefreshCw size={14} className={`mr-2 ${bootcampLoading ? 'spin' : ''}`} /> Reroll
                        </button>
                    </div>
                    
                    {weakestCategories.length > 0 && (
                        <div className="weakness-banner mb-6">
                            <AlertCircle size={24} className="text-warning flex-shrink-0" />
                            <div>
                                <strong>Critical Blind Spots Detected:</strong> You are unusually weak in <span className="text-warning font-bold">{weakestCategories[0].fullSubject}</span> compared to your overall distribution.
                            </div>
                        </div>
                    )}

                    {bootcampLoading ? (
                        <div className="flex-center py-20"><Loader2 className="spin text-accent" /></div>
                    ) : (
                        <div className="bootcamp-lists">
                            {weakestCategories.map((cat, i) => (
                                <div key={i} className="bootcamp-category-block">
                                    <h3 className="category-header">
                                        Focus Area {i+1}: <span>{cat.fullSubject}</span>
                                    </h3>
                                    <div className="problem-list">
                                        {(bootcampProblems[cat.fullSubject] || []).map(prob => (
                                            <a 
                                                key={`${prob.contestId}-${prob.index}`} 
                                                href={`https://codeforces.com/contest/${prob.contestId}/problem/${prob.index}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bootcamp-problem-card"
                                            >
                                                <div className="prob-icon"><PlayCircle size={18} /></div>
                                                <div className="prob-details">
                                                    <h4>{prob.name}</h4>
                                                    <span className="prob-id">CF {prob.contestId}-{prob.index}</span>
                                                </div>
                                                <div className="prob-rating">★ {prob.rating}</div>
                                                <ExternalLink size={16} className="text-muted ml-3 opacity-50 group-hover:opacity-100 transition" />
                                            </a>
                                        ))}
                                        {!(bootcampProblems[cat.fullSubject] || []).length && (
                                            <div className="p-4 text-center text-muted italic">No problems found for this criteria.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Coach Section */}
                <div className="panel coach-panel lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare size={24} className="text-accent" />
                        <h2 className="panel-title mb-0">AI Coach</h2>
                    </div>
                    
                    <div className="ai-chat-container">
                        <div className="ai-messages">
                            {aiMessages.map((msg, i) => (
                                <div key={i} className={`ai-message ${msg.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
                                    <div className="msg-bubble">
                                        {msg.content.split('\n').map((line, j) => (
                                            <span key={j}>{line}<br/></span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isAiLoading && (
                                <div className="ai-message msg-bot">
                                    <div className="msg-bubble loading-bubble">
                                        <Loader2 size={16} className="spin" /> Analyzing your stats...
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="ai-input-area">
                            <input
                                type="text"
                                value={aiInput}
                                onChange={e => setAiInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendAiMessage()}
                                placeholder="Ask your AI coach how to improve or what to study next..."
                                className="ai-text-input"
                            />
                            <button className="btn-primary" onClick={() => sendAiMessage()} disabled={isAiLoading || !aiInput.trim()}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .analytics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.25fr;
                    gap: 32px;
                    align-items: start;
                }
                @media (max-width: 1024px) {
                    .analytics-grid { grid-template-columns: 1fr; }
                }
                .panel {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-2xl);
                    padding: 32px;
                }
                .panel-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin-bottom: 24px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .weakness-banner {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    padding: 16px 20px;
                    border-radius: var(--radius-lg);
                    color: var(--text-primary);
                }
                .bootcamp-category-block {
                    margin-bottom: 32px;
                }
                .bootcamp-category-block:last-child {
                    margin-bottom: 0;
                }
                .category-header {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-muted);
                    font-weight: 700;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .category-header span {
                    color: var(--warning);
                    font-size: 1rem;
                }
                .problem-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .bootcamp-problem-card {
                    display: flex;
                    align-items: center;
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    padding: 16px;
                    border-radius: var(--radius-lg);
                    transition: all 0.2s;
                    text-decoration: none;
                    color: inherit;
                    group: hover;
                }
                .bootcamp-problem-card:hover {
                    border-color: var(--accent);
                    background: var(--bg-tertiary);
                    transform: translateX(4px);
                }
                .prob-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }
                .prob-details {
                    flex: 1;
                }
                .prob-details h4 {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .prob-id {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    background: var(--bg-secondary);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .prob-rating {
                    font-weight: 800;
                    color: var(--warning);
                    background: rgba(245, 158, 11, 0.1);
                    padding: 4px 10px;
                    border-radius: var(--radius-full);
                    font-size: 0.875rem;
                }
                
                .coach-panel {
                    margin-top: 0;
                }
                .ai-chat-container {
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    height: 600px;
                    overflow: hidden;
                }
                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .ai-message {
                    display: flex;
                    width: 100%;
                }
                .msg-user {
                    justify-content: flex-end;
                }
                .msg-bot {
                    justify-content: flex-start;
                }
                .msg-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: var(--radius-lg);
                    font-size: 0.9375rem;
                    line-height: 1.5;
                }
                .msg-user .msg-bubble {
                    background: var(--accent);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .msg-bot .msg-bubble {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                    border-bottom-left-radius: 4px;
                }
                .loading-bubble {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted) !important;
                    font-style: italic;
                }
                .ai-input-area {
                    display: flex;
                    padding: 16px;
                    border-top: 1px solid var(--border);
                    background: var(--bg-secondary);
                    gap: 12px;
                }
                .ai-text-input {
                    flex: 1;
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 10px 16px;
                    color: var(--text-primary);
                    font-size: 0.9375rem;
                }
                .ai-text-input:focus {
                    outline: none;
                    border-color: var(--accent);
                }
            `}</style>
        </div>
    );
}
