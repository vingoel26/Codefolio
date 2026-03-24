import { useState, useEffect, useMemo } from 'react';
import { Target, Loader2, RefreshCw, AlertCircle, ExternalLink, PlayCircle, MessageSquare, Send, Brain } from 'lucide-react';
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
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Initializing Neural Link...",
        "Scanning Codeforces Identifiers...",
        "Identifying Algorithmic Blindspots...",
        "Quantizing Pattern Density...",
        "Generating Personalized Missions...",
        "Syncing with Hellen Logic Mentor...",
        "Optimizing Training Load..."
    ];

    useEffect(() => {
        let interval;
        if (bootcampLoading) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 1800);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [bootcampLoading]);

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
                        
                        const tags = primaryCF.data?.tagDistribution || {};
                        const chartData = aggregateToMacroCategories(tags);
                        setRadarData(chartData);


                        if (chartData.length > 0) {
                            const sorted = [...chartData].sort((a, b) => a.normalized - b.normalized);
                            const bottom2 = sorted.slice(0, 2);
                            setWeakestCategories(bottom2);
                            generateBootcamp(bottom2, primaryCF.data?.profile?.rating || 1200);
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
        <div className="analytics-page min-h-screen">
            <header className="analytics-hero-header glass-header animate-fade-in">
                <div className="hero-content-wrapper">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="analytics-logo-orb-v2">
                            <Target size={32} className="text-white" />
                        </div>
                        <div className="hero-text-stack">
                            <h1 className="hero-main-title">
                                Neural Skill Matrix
                            </h1>
                            <p className="hero-sub-title">
                                Pattern recognition mapping {radarData.reduce((acc, r) => acc + (r.rawSolves || 0), 0)} algorithmic identifiers.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="analytics-matrix-grid">
                {/* Secondary Column: Insights & AI */}
                <div className="analytics-col-sidebar space-y-6">
                    <section className="premium-glass-panel map-panel">
                        <div className="panel-header-v2">
                            <h2 className="panel-label-v2">Skill Projection</h2>
                            <p className="panel-sublabel-v2">Active Density Map</p>
                        </div>
                        
                        <div className="radar-glow-container" style={{ height: 380 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }} 
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar 
                                        name="Skills" 
                                        dataKey="normalized" 
                                        stroke="var(--accent)" 
                                        fill="var(--accent)" 
                                        fillOpacity={0.3} 
                                        isAnimationActive={true}
                                        animationDuration={1500}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="distribution-legend-v2">
                            {radarData.map((d, i) => (
                                <div key={i} className="legend-item-v2">
                                    <span className="legend-dot-v2" style={{ background: `hsl(${220 + i * 20}, 70%, 50%)` }} />
                                    <span className="legend-name-v2">{d.subject}</span>
                                    <span className="legend-value-v2">{d.rawSolves}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Primary Column: Training & Actions */}
                <div className="analytics-col-primary space-y-6">
                    <section className="premium-glass-panel training-ops-v2">
                        <div className="panel-header-v2 mb-6 flex justify-between items-center">
                            <div>
                                <h1 className="primary-title">Training Ops: Level Up</h1>
                                <p className="panel-sublabel-v2">Personalized Algorithmic Mission Training</p>
                            </div>
                            <button 
                                className="reroll-mission-btn"
                                onClick={() => generateBootcamp(weakestCategories, linkedCF.data?.profile?.rating || 1200)}
                                disabled={bootcampLoading}
                            >
                                <RefreshCw size={18} className={bootcampLoading ? 'spin' : ''} />
                                <span>Re-Sync Missions</span>
                            </button>
                        </div>

                        {weakestCategories.length > 0 && (
                            <div className="blindspot-banner-v2">
                                <div className="banner-accent" />
                                <div className="flex items-center gap-4">
                                    <div className="alert-icon-shell pulse-red">
                                        <AlertCircle size={22} />
                                    </div>
                                    <div className="banner-content">
                                        <h4 className="banner-label">CRITICAL BLINDSPOT DETECTED</h4>
                                        <h3 className="banner-title">{weakestCategories[0].fullSubject}</h3>
                                        <p className="banner-text">Performance density is {Math.round(100 - weakestCategories[0].normalized)}% below neural baseline. Corrective exercises prioritized.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {bootcampLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 animate-fade-in w-full">
                                <div className="neural-loader-ring">
                                    <div className="ring-inner pulse-accent" />
                                    <Brain size={40} className="text-accent animate-pulse" />
                                </div>
                                <div className="mt-10 h-6 overflow-hidden flex justify-center w-full">
                                    <p className="loading-message-text animate-slide-up whitespace-nowrap">
                                        {loadingMessages[loadingMessageIndex]}
                                    </p>
                                </div>
                                <div className="loading-bar-tracker mt-6">
                                    <div className="inner-progress" style={{ width: `${(loadingMessageIndex + 1) * 14}%` }} />
                                </div>
                            </div>
                        ) : (
                            <div className="mission-grid-v2">
                                {weakestCategories.map((cat, i) => (
                                    <div key={i} className="mission-cluster">
                                        <div className="cluster-header">
                                            <div className="cluster-id-pill">0{i+1}</div>
                                            <h3 className="cluster-title">{cat.fullSubject}</h3>
                                            <div className="cluster-line" />
                                        </div>
                                        <div className="mission-cards-stack">
                                            {(bootcampProblems[cat.fullSubject] || []).map(prob => (
                                                <a 
                                                    key={`${prob.contestId}-${prob.index}`} 
                                                    href={`https://codeforces.com/contest/${prob.contestId}/problem/${prob.index}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="neural-mission-card group"
                                                >
                                                    <div className="mission-card-content">
                                                        <div className="mission-status-indicator" />
                                                        <div className="mission-info-block">
                                                            <div className="mission-top-line">
                                                                <span className="mission-id">{prob.contestId}{prob.index}</span>
                                                                <span className="mission-name">{prob.name}</span>
                                                            </div>
                                                            <div className="mission-meta-pills">
                                                                <span className="rating-glow-pill" style={{ color: getRatingColor(prob.rating) }}>
                                                                    ◈ {prob.rating}
                                                                </span>
                                                                <span className="difficulty-pill">LEVEL 0{Math.floor(prob.rating / 400)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mission-launch">
                                                        <span className="launch-text">INITIATE</span>
                                                        <PlayCircle size={18} className="launch-icon" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <style>{`
                .analytics-page { color: var(--text-primary); background: var(--bg-primary); }
                
                /* Responsive Asymmetric Grid */
                .analytics-matrix-grid {
                    display: grid;
                    grid-template-columns: 450px 1fr;
                    min-height: calc(100vh - 80px); /* header offset */
                }
                @media (max-width: 1440px) { .analytics-matrix-grid { grid-template-columns: 400px 1fr; } }
                @media (max-width: 1200px) { .analytics-matrix-grid { grid-template-columns: 1fr; } }

                /* Full-Bleed Hero Header */
                .analytics-hero-header {
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border);
                    padding: 32px 40px;
                }
                .hero-main-title { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.02em; background: linear-gradient(135deg, var(--accent) 0%, var(--info) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
                .hero-sub-title { color: var(--text-muted); font-size: 1.125rem; font-weight: 500; }
                .analytics-logo-orb-v2 { width: 56px; height: 56px; background: var(--accent); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }

                /* Premium Glass Panels */
                .premium-glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    padding: 32px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: var(--shadow-sm);
                }
                .analytics-col-sidebar .premium-glass-panel { border-bottom: 1px solid var(--border); }
                .analytics-col-primary .premium-glass-panel { border-left: 1px solid var(--border); min-height: 100%; }

                .panel-header-v2 { margin-bottom: 24px; }
                .panel-label-v2 { font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 4px; }
                .panel-sublabel-v2 { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; opacity: 0.7; }
                .primary-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }

                /* Radar & Legend */
                .radar-glow-container { background: radial-gradient(circle at center, var(--accent-subtle) 0%, transparent 70%); }
                .distribution-legend-v2 { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
                .legend-item-v2 { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-tertiary); padding: 4px 12px; border-radius: 8px; border: 1px solid var(--border); }
                .legend-dot-v2 { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

                /* Blindspot Banner */
                .blindspot-banner-v2 { background: var(--error-bg); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; margin-bottom: 40px; border: 1px solid var(--error); border-opacity: 0.2; }
                .banner-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--error); box-shadow: 0 0 15px var(--error); }
                .alert-icon-shell { width: 48px; height: 48px; min-width: 48px; background: var(--error-bg); color: var(--error); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .pulse-red { animation: pulse-red-glow 2s infinite; }
                @keyframes pulse-red-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 20px 0 rgba(239,68,68,0.2); } }
                .banner-label { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.2em; color: var(--error); margin-bottom: 4px; }
                .banner-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
                .banner-text { font-size: 0.875rem; color: var(--text-muted); }

                /* Mission Cards */
                .mission-cluster { margin-bottom: 48px; }
                .cluster-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
                .cluster-id-pill { background: var(--accent); color: white; font-size: 0.7rem; font-weight: 900; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
                .cluster-title { font-size: 1.125rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
                .cluster-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

                .mission-cards-stack { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
                .neural-mission-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; justify-content: space-between; text-decoration: none; position: relative; box-shadow: var(--shadow-sm); }
                .neural-mission-card:hover { transform: translateY(-4px) scale(1.02); background: var(--bg-hover); border-color: var(--accent); box-shadow: var(--shadow-md); }
                
                .mission-status-indicator { width: 4px; height: 24px; background: var(--border); border-radius: 2px; margin-right: 16px; transition: all 0.3s; }
                .neural-mission-card:hover .mission-status-indicator { background: var(--accent); box-shadow: 0 0 10px var(--accent); height: 40px; }

                .mission-card-content { display: flex; align-items: center; }
                .mission-id { font-family: monospace; font-weight: 800; color: var(--accent); font-size: 0.9rem; margin-right: 12px; opacity: 0.8; }
                .mission-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
                .mission-meta-pills { display: flex; gap: 8px; margin-top: 6px; }
                .rating-glow-pill { font-size: 0.75rem; font-weight: 900; background: var(--bg-tertiary); padding: 2px 10px; border-radius: 6px; }
                .difficulty-pill { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; background: var(--bg-tertiary); padding: 2px 10px; border-radius: 6px; }

                .mission-launch { display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateX(10px); transition: all 0.3s; }
                .neural-mission-card:hover .mission-launch { opacity: 1; transform: translateX(0); }
                .launch-text { font-size: 0.7rem; font-weight: 900; color: var(--accent); letter-spacing: 0.1em; }
                .launch-icon { color: var(--accent); }

                .reroll-mission-btn { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1px solid var(--border); padding: 8px 16px; border-radius: 12px; color: var(--text-primary); font-size: 0.8125rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
                .reroll-mission-btn:hover:not(:disabled) { background: var(--accent); color: white; border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }

                /* Rating Helpers */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }

                /* Neural Loader */
                .neural-loader-ring { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
                .ring-inner { position: absolute; inset: 0; border: 2px solid var(--accent); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; animation: morph 4s linear infinite; opacity: 0.3; }
                @keyframes morph {
                  0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); }
                  25% { border-radius: 58% 42% 75% 25% / 56% 44% 56% 44%; }
                  50% { border-radius: 50% 50% 33% 67% / 63% 37% 63% 37%; transform: rotate(180deg); }
                  75% { border-radius: 42% 58% 51% 49% / 51% 49% 51% 49%; }
                }
                .loading-message-text { color: var(--accent); font-size: 0.875rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                .loading-bar-tracker { width: 240px; height: 2px; background: var(--border); border-radius: 4px; overflow: hidden; }
                .inner-progress { height: 100%; background: var(--accent); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px var(--accent); }
            `}</style>
        </div>
    );
}


const getRatingColor = (r) => {
    if (r < 1200) return '#808080'; // Newbie
    if (r < 1400) return '#00ff00'; // Pupil
    if (r < 1600) return '#03a89e'; // Specialist
    if (r < 1900) return '#0000ff'; // Expert
    if (r < 2100) return '#aa00aa'; // CM
    if (r < 2300) return '#ff8c00'; // Master
    return '#ff0000'; // GM+
};
