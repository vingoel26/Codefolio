import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Bell, Loader2, ExternalLink, Clock, Trophy, Check, Brain } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Contests() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState({}); // Stores which contest IDs have active reminders
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Fetching Global Contest Schedules...",
        "Synchronizing Platform Timelines...",
        "Parsing Competitive Metadata...",
        "Neural Mapping of Match Schedules...",
        "Optimizing Reminder Protocols...",
        "Calibrating Neural Sync..."
    ];

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 1800);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const res = await fetch(`${API_URL}/contests`);
                if (res.ok) {
                    const data = await res.json();
                    setContests(data.contests || []);
                }
            } catch (err) {
                console.error("Failed to fetch contests", err);
            } finally {
                setLoading(false);
            }
        };

        fetchContests();
        
        // Request notification permission early
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleRemindMe = (contest) => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            return;
        }

        if (Notification.permission === 'granted') {
            setReminders(prev => ({ ...prev, [contest.id]: true }));
            
            // Calculate time until 15 minutes before start
            const startTimeMs = new Date(contest.startTime).getTime();
            const fifteenMinsBefore = startTimeMs - (15 * 60 * 1000);
            const timeUntilReminder = fifteenMinsBefore - Date.now();

            if (timeUntilReminder > 0) {
                // Schedule local timeout if the app stays open
                setTimeout(() => {
                    new Notification(`Upcoming Contest: ${contest.name}`, {
                        body: `Starts in 15 minutes on ${contest.platform}!`,
                        icon: '/vite.svg'
                    });
                }, timeUntilReminder);
                alert(`Reminder scheduled for 15 minutes before ${contest.name} begins! (Keep this tab open)`);
            } else if (startTimeMs > Date.now()) {
                // If it's already within 15 minutes
                new Notification(`Upcoming Contest: ${contest.name}`, {
                    body: `Starts very soon on ${contest.platform}!`
                });
            }
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    handleRemindMe(contest);
                }
            });
        } else {
            alert("Notification permissions are denied in your browser settings.");
        }
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getPlatformStyles = (platform) => {
        switch(platform) {
            case 'codeforces': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--codeforces)', border: 'var(--codeforces)' };
            case 'leetcode': return { bg: 'rgba(234, 180, 50, 0.1)', color: 'var(--leetcode)', border: 'var(--leetcode)' };
            default: return { bg: 'rgba(128, 128, 128, 0.1)', color: 'var(--text-primary)', border: 'var(--border)' };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in w-full">
                <div className="neural-loader-ring">
                    <div className="ring-inner pulse-accent" />
                    <Brain size={48} className="text-accent animate-pulse" />
                </div>
                <div className="mt-12 h-6 overflow-hidden flex justify-center w-full">
                    <p className="loading-message-text animate-slide-up whitespace-nowrap">
                        {loadingMessages[loadingMessageIndex]}
                    </p>
                </div>
                <div className="loading-bar-tracker mt-8">
                    <div className="inner-progress" style={{ width: `${(loadingMessageIndex + 1) * 16}%` }} />
                </div>
                <style>{`
                    .neural-loader-ring { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
                    .ring-inner { position: absolute; inset: 0; border: 3px solid var(--accent); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; animation: morph 4s linear infinite; opacity: 0.3; }
                    @keyframes morph {
                      0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); }
                      25% { border-radius: 58% 42% 75% 25% / 56% 44% 56% 44%; }
                      50% { border-radius: 50% 50% 33% 67% / 63% 37% 63% 37%; transform: rotate(180deg); }
                      75% { border-radius: 42% 58% 51% 49% / 51% 49% 51% 49%; }
                    }
                    .loading-message-text { color: var(--accent); font-size: 1rem; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; }
                    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
                    .loading-bar-tracker { width: 300px; height: 3px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
                    .inner-progress { height: 100%; background: var(--accent); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px var(--accent); }
                `}</style>
            </div>
        );
    }

    // Grouping
    const now = new Date();
    const twentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const grouped = {
        'Next 24 Hours': contests.filter(c => new Date(c.startTime) <= twentyFourHours),
        'This Week': contests.filter(c => new Date(c.startTime) > twentyFourHours && new Date(c.startTime) <= oneWeek),
        'Later': contests.filter(c => new Date(c.startTime) > oneWeek)
    };

    return (
        <div className="contests-page min-h-screen">
            <div className="neural-bg-glow" />
            
            <header className="analytics-hero-header glass-header animate-fade-in mb-12" style={{ paddingLeft: '80px' }}>
                <div className="hero-content-wrapper max-w-[1400px] pl-12 pr-8">
                    <div className="flex items-center gap-8 mb-4">
                        <div className="analytics-logo-orb-v2 pulse-glow-purple">
                            <CalendarIcon size={32} className="text-white" />
                        </div>
                        <div className="hero-text-stack">
                            <h1 className="hero-main-title">
                                Global Contest Sync
                            </h1>
                            <p className="hero-sub-title">
                                Neural synchronization with {contests.length} upcoming competitive events.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1440px] pl-32 pr-10 pt-24 pb-48">

            <div className="timeline-container">
                {Object.entries(grouped).map(([groupName, groupContests]) => {
                    if (groupContests.length === 0) return null;
                    return (
                        <div key={groupName} className="timeline-group animate-fade-in">
                            <div className="flex items-center gap-6 mb-32" style={{ paddingLeft: '40px' }}>
                                <h2 className="group-heading-v2">{groupName}</h2>
                                <div className="group-line-v2" />
                            </div>
                            <div className="contest-grid-v2" style={{ paddingLeft: '40px' }}>
                                {groupContests.map(c => {
                                    const { date, time } = formatDate(c.startTime);
                                    const style = getPlatformStyles(c.platform);
                                    
                                    return (
                                        <div key={c.id} className="premium-glass-panel contest-card-v2 group">
                                            <div className="card-accent-line" style={{ background: style.border }} />
                                            
                                            <div className="contest-card-inner">
                                                <div className="contest-date-sidebar">
                                                    <div className="c-date-v2">{date}</div>
                                                    <div className="c-time-v2">
                                                        <Clock size={14} className="text-accent" /> {time}
                                                    </div>
                                                </div>
                                                
                                                <div className="contest-main-content">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="platform-tag-v2" style={{ backgroundColor: style.bg, color: style.color }}>
                                                            {c.platform.toUpperCase()}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button 
                                                                className={`action-btn-v2 ${reminders[c.id] ? 'active-reminder' : ''}`}
                                                                onClick={() => handleRemindMe(c)}
                                                                title="Set Reminder"
                                                            >
                                                                {reminders[c.id] ? <Check size={18} /> : <Bell size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <h3 className="contest-title-v2 group-hover:text-accent transition-colors">
                                                        {c.name}
                                                    </h3>
                                                    
                                                    <div className="contest-footer-v2">
                                                        <div className="meta-item-v2">
                                                            <Trophy size={14} className="text-muted" />
                                                            <span>{Math.floor(c.durationSeconds / 60)} Minutes</span>
                                                        </div>
                                                        
                                                        <a href={c.url} target="_blank" rel="noreferrer" className="participate-link-v2">
                                                            <span>PARTICIPATE</span>
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

            <style>{`
                .contests-page { color: var(--text-primary); background: var(--bg-primary); position: relative; height: 100vh; overflow-y: auto; }
                .neural-bg-glow { position: fixed; top: 0; right: 0; width: 600px; height: 600px; background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%); z-index: 0; pointer-events: none; }
                
                :root:not(.dark) .neural-bg-glow { background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); }

                /* Hero Header */
                .analytics-hero-header { padding: 40px 0; border-bottom: 1px solid var(--border); background: var(--bg-secondary); }
                .hero-main-title { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.02em; background: linear-gradient(135deg, var(--accent) 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .hero-sub-title { color: var(--text-muted); font-size: 1.1rem; }
                .analytics-logo-orb-v2 { width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: var(--accent); box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
                .pulse-glow-purple { animation: purple-glow 3s infinite alternate; }
                @keyframes purple-glow { from { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); } to { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); } }

                /* Timeline Groups */
                .timeline-group { margin-bottom: 40px; }
                .timeline-group:first-child { margin-top: 40px; }
                .group-heading-v2 { font-size: 1.5rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.35em; color: var(--text-muted); opacity: 0.95; }
                .group-line-v2 { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); margin-left: 32px; opacity: 0.6; }

                /* Contest Cards */
                .contest-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 24px; }
                @media (max-width: 768px) { .contest-grid-v2 { grid-template-columns: 1fr; } }

                .premium-glass-panel { background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 24px; position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: var(--shadow-sm); }
                .contest-card-v2:hover { transform: translateY(-6px) scale(1.01); background: var(--bg-secondary); border-color: var(--accent); box-shadow: var(--shadow-lg); }
                
                .card-accent-line { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; opacity: 0.6; transition: width 0.3s; }
                .contest-card-v2:hover .card-accent-line { width: 6px; opacity: 1; }

                .contest-card-inner { display: flex; padding: 28px; gap: 24px; }
                .contest-date-sidebar { min-width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border); padding-right: 24px; }
                .c-date-v2 { font-size: 1.1rem; font-weight: 900; color: var(--text-primary); text-align: center; line-height: 1.2; }
                .c-time-v2 { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-top: 8px; display: flex; align-items: center; gap: 6px; }

                .contest-main-content { flex: 1; }
                .platform-tag-v2 { font-size: 0.7rem; font-weight: 900; padding: 4px 12px; border-radius: 8px; letter-spacing: 0.1em; display: inline-block; }
                .contest-title-v2 { font-size: 1.4rem; font-weight: 800; line-height: 1.3; margin: 12px 0 20px 0; color: var(--text-primary); }
                
                .contest-footer-v2 { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--border); }
                .meta-item-v2 { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
                
                .participate-link-v2 { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; color: var(--accent); letter-spacing: 0.1em; text-decoration: none; transition: all 0.2s; }
                .participate-link-v2:hover { color: var(--text-primary); transform: translateX(4px); }

                .action-btn-v2 { width: 40px; height: 40px; border-radius: 12px; background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.3s; cursor: pointer; }
                .action-btn-v2:hover { background: var(--accent); color: white; border-color: var(--accent); }
                .active-reminder { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }

                /* Anim */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
}
