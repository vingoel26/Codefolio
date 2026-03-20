import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Bell, Loader2, ExternalLink, Clock, Trophy, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Contests() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState({}); // Stores which contest IDs have active reminders

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
        return <div className="flex-center h-screen"><Loader2 size={40} className="spin text-accent" /></div>;
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
        <div className="contests-page p-8 max-w-[1000px] mx-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
                    <CalendarIcon size={36} className="text-accent" /> Upcoming Contests
                </h1>
                <p className="text-muted text-lg max-w-2xl mx-auto">
                    A unified chronological tracker for Codeforces and LeetCode matches. Never miss a rated round again.
                </p>
            </header>

            <div className="timeline-container">
                {Object.entries(grouped).map(([groupName, groupContests]) => {
                    if (groupContests.length === 0) return null;
                    return (
                        <div key={groupName} className="timeline-group mb-12">
                            <h2 className="group-heading">{groupName}</h2>
                            <div className="contest-list">
                                {groupContests.map(c => {
                                    const { date, time } = formatDate(c.startTime);
                                    const style = getPlatformStyles(c.platform);
                                    
                                    return (
                                        <div key={c.id} className="contest-card">
                                            <div className="contest-date-block">
                                                <div className="c-date">{date}</div>
                                                <div className="c-time"><Clock size={14} className="mr-1 inline -mt-0.5" /> {time}</div>
                                            </div>
                                            
                                            <div className="contest-body" style={{ borderLeftColor: style.border }}>
                                                <div className="contest-header flex justify-between items-start">
                                                    <div>
                                                        <span className="platform-badge" style={{ backgroundColor: style.bg, color: style.color }}>
                                                            {c.platform.toUpperCase()}
                                                        </span>
                                                        <h3 className="contest-title">{c.name}</h3>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className={`btn-notification ${reminders[c.id] ? 'btn-active' : ''}`}
                                                            onClick={() => handleRemindMe(c)}
                                                        >
                                                            {reminders[c.id] ? <Check size={16} /> : <Bell size={16} />}
                                                        </button>
                                                        <a href={c.url} target="_blank" rel="noreferrer" className="btn-go">
                                                            <ExternalLink size={16} /> Participate
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="contest-meta">
                                                    <span><Trophy size={14} className="mr-1 inline" /> Duration: {Math.floor(c.durationSeconds / 60)} mins</span>
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

            <style>{`
                .group-heading {
                    font-size: 1.125rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-muted);
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .group-heading::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: var(--border);
                }
                .contest-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .contest-card {
                    display: flex;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    transition: all 0.2s;
                }
                .contest-card:hover {
                    border-color: var(--border-strong);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .contest-date-block {
                    background: var(--bg-tertiary);
                    padding: 24px;
                    min-width: 140px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    border-right: 1px solid var(--border);
                }
                .c-date {
                    font-weight: 800;
                    font-size: 1.125rem;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .c-time {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    font-weight: 600;
                }
                .contest-body {
                    padding: 24px;
                    flex: 1;
                    border-left: 4px solid var(--border);
                }
                .platform-badge {
                    font-size: 0.75rem;
                    font-weight: 800;
                    padding: 4px 10px;
                    border-radius: var(--radius-full);
                    margin-bottom: 12px;
                    display: inline-block;
                    letter-spacing: 0.05em;
                }
                .contest-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                .contest-meta {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    display: flex;
                    gap: 16px;
                }
                .btn-go {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--accent);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .btn-go:hover {
                    opacity: 0.9;
                }
                .btn-notification {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--bg-primary);
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-notification:hover {
                    border-color: var(--text-primary);
                    color: var(--text-primary);
                }
                .btn-active {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success);
                    border-color: var(--success);
                }
                .btn-active:hover {
                    background: rgba(16, 185, 129, 0.2);
                    border-color: var(--success);
                    color: var(--success);
                }
            `}</style>
        </div>
    );
}
