// client/src/pages/PortfolioEngine.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Github, ExternalLink, ArrowRight, Activity, Award, CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PLATFORM_META = {
    codeforces: { name: 'Codeforces', color: '#1a8cff', url: 'https://codeforces.com/profile/' },
    leetcode: { name: 'LeetCode', color: '#ffa116', url: 'https://leetcode.com/u/' },
    codechef: { name: 'CodeChef', color: '#5b4638', url: 'https://codechef.com/users/' },
    gfg: { name: 'GeeksforGeeks', color: '#2f8d46', url: 'https://auth.geeksforgeeks.org/user/' }
};

export default function PortfolioEngine() {
    const { username } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const mainRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/users/u/${username}`);
                if (!res.ok) throw new Error('Portfolio not found');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [username]);

    useEffect(() => {
        if (!loading && data && mainRef.current) {
            // Setup GSAP animations
            const ctx = gsap.context(() => {
                // Hero inner animation
                gsap.from('.port-hero-elem', {
                    y: 40,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.15,
                    ease: 'power3.out'
                });

                // Panel wipes animation
                const panels = gsap.utils.toArray('.port-panel');
                
                // Set z-indexes so panels stack on top of each other
                gsap.set(panels, { zIndex: (i) => i });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: mainRef.current,
                        start: 'top top',
                        end: () => `+=${panels.length * 100}%`,
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1
                    }
                });

                panels.forEach((panel, i) => {
                    if (i === 0) return; // Hero is initially visible

                    let fromVars = {};
                    if (panel.classList.contains('port-left')) {
                        fromVars = { xPercent: -100 };
                    } else if (panel.classList.contains('port-right')) {
                        fromVars = { xPercent: 100 };
                    } else if (panel.classList.contains('port-top')) {
                        fromVars = { yPercent: -100 };
                    }

                    // Set initial state
                    gsap.set(panel, fromVars);

                    // Animate to 0 (slide in)
                    tl.to(panel, {
                        xPercent: 0,
                        yPercent: 0,
                        ease: 'none'
                    });
                });

            }, mainRef);

            return () => ctx.revert(); // Cleanup GSAP
        }
    }, [loading, data]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#fff' }}>Loading Portfolio...</div>;
    if (error) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#f87171' }}>{error}</div>;

    const { profile, platforms, recentPosts } = data;
    
    // Provide defaults if missing
    const theme = profile.portfolioTheme || 'dark';
    const tagline = profile.portfolioTagline || 'Software Engineer & Competitive Programmer';
    const sections = profile.portfolioSections || ['hero', 'stats', 'platforms', 'blogs', 'contact'];

    // Theme Variables
    const tConfig = {
        dark: { bg: '#020617', text: '#f8fafc', card: '#0f172a', border: '#1e293b', accent: '#3b82f6', accentSubtle: 'rgba(59, 130, 246, 0.1)' },
        light: { bg: '#f8fafc', text: '#0f172a', card: '#ffffff', border: '#e2e8f0', accent: '#2563eb', accentSubtle: 'rgba(37, 99, 235, 0.1)' },
        neon: { bg: '#09090b', text: '#fafafa', card: '#18181b', border: '#27272a', accent: '#10b981', accentSubtle: 'rgba(16, 185, 129, 0.1)' }
    }[theme];

    // Inline CSS for the generated page
    const styles = {
        wrapper: { backgroundColor: tConfig.bg, color: tConfig.text, height: '100vh', width: '100vw', fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative' },
        panel: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: tConfig.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5%', boxSizing: 'border-box', overflowY: 'auto' },
        panelInner: { width: '100%', maxWidth: '1000px', margin: '0 auto' },
        nav: { position: 'absolute', top: 0, left: 0, width: '100%', padding: '24px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxSizing: 'border-box' },
        logo: { fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.05em', color: tConfig.text, textDecoration: 'none' },
        
        // Hero
        avatar: { width: '96px', height: '96px', borderRadius: '50%', marginBottom: '24px', objectFit: 'cover', border: `2px solid ${tConfig.border}` },
        fallbackAvatar: { width: '96px', height: '96px', borderRadius: '50%', marginBottom: '24px', background: tConfig.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700 },
        title: { fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 16px 0', color: tConfig.text },
        tagline: { fontSize: '1.5rem', fontWeight: 500, color: tConfig.accent, margin: '0 0 24px 0' },
        bio: { fontSize: '1.125rem', color: tConfig.text, opacity: 0.8, maxWidth: '600px', margin: '0 0 32px 0', lineHeight: 1.6 },
        
        // Sections
        secTitle: { fontSize: '2.5rem', fontWeight: 700, marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' },
        
        // Stats
        statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' },
        statBox: { padding: '32px', background: tConfig.card, borderRadius: '24px', border: `1px solid ${tConfig.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
        statVal: { fontSize: '3rem', fontWeight: 800, marginBottom: '8px', color: tConfig.accent },
        statLabel: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 },
        
        // Platforms
        platGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
        platCard: { padding: '24px', background: tConfig.card, borderRadius: '20px', border: `1px solid ${tConfig.border}`, display: 'flex', flexDirection: 'column', textDecoration: 'none', color: tConfig.text, transition: 'transform 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', ':hover': { transform: 'translateY(-4px)' } },
        platHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        platName: { fontSize: '1.25rem', fontWeight: 700 },
        platInner: { display: 'flex', gap: '32px' },
        
        // Blogs
        blogArr: { display: 'flex', flexDirection: 'column', gap: '16px' },
        blogCard: { padding: '24px', background: tConfig.card, borderRadius: '20px', border: `1px solid ${tConfig.border}`, textDecoration: 'none', color: tConfig.text, display: 'block', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' },
        blogTitle: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' },
        
        // Contact
        btn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: tConfig.text, color: tConfig.bg, borderRadius: '999px', textDecoration: 'none', fontWeight: 600, fontSize: '1.125rem' },
        btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: tConfig.accentSubtle, color: tConfig.text, borderRadius: '999px', textDecoration: 'none', fontWeight: 600, fontSize: '1.125rem' }
    };

    return (
        <div ref={mainRef} style={styles.wrapper}>
            <nav style={styles.nav}>
                <Link to="/" style={styles.logo}>{profile.displayName || profile.username}.</Link>
                <Link to={`/u/${profile.username}`} style={{ color: tConfig.text, textDecoration: 'none', opacity: 0.7, fontSize: '0.875rem' }}>View on Codefolio →</Link>
            </nav>

            {/* Hero Section */}
            {sections.includes('hero') && (
                <section className="port-panel" style={styles.panel}>
                    <div style={styles.panelInner}>
                        <div className="port-hero-elem">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} style={styles.avatar} />
                            ) : (
                                <div style={styles.fallbackAvatar}>{(profile.displayName || profile.username)[0].toUpperCase()}</div>
                            )}
                        </div>
                        <h1 className="port-hero-elem" style={styles.title}>{profile.displayName || profile.username}</h1>
                        <h2 className="port-hero-elem" style={styles.tagline}>{tagline}</h2>
                        {profile.bio && <p className="port-hero-elem" style={styles.bio}>{profile.bio}</p>}
                        
                        <div className="port-hero-elem" style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                            {sections.includes('contact') && (
                                <a href={`mailto:hello@example.com`} style={styles.btn}>Get in Touch <ArrowRight size={20} /></a>
                            )}
                            <a href={`https://github.com/${profile.username}`} target="_blank" rel="noreferrer" style={styles.btnSecondary}><Github size={20} /> GitHub</a>
                        </div>
                    </div>
                </section>
            )}

            {/* Grand Stats */}
            {sections.includes('stats') && (
                <section className="port-panel port-left" style={{...styles.panel, boxShadow: '10px 0 30px rgba(0,0,0,0.5)'}}>
                    <div style={styles.panelInner}>
                        <h3 style={styles.secTitle}><Activity size={32} color={tConfig.accent} /> Impact & Stats</h3>
                        <div style={styles.statsGrid}>
                            <div style={styles.statBox}>
                                <div style={styles.statVal}>{profile.grandTotalSolved.toLocaleString()}</div>
                                <div style={styles.statLabel}>Total Problems Solved</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statVal}>{profile.bestRating.toLocaleString()}</div>
                                <div style={styles.statLabel}>Peak Rating</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statVal}>{profile.totalContests.toLocaleString()}</div>
                                <div style={styles.statLabel}>Contests Participated</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Connected Platforms */}
            {sections.includes('platforms') && platforms.length > 0 && (
                <section className="port-panel port-right" style={{...styles.panel, boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'}}>
                    <div style={styles.panelInner}>
                        <h3 style={styles.secTitle}><Award size={32} color={tConfig.accent} /> Platform Presence</h3>
                        <div style={styles.platGrid}>
                            {platforms.map(p => {
                                const meta = PLATFORM_META[p.platform] || { name: p.platform, color: tConfig.accent, url: '#' };
                                return (
                                    <a key={p.platform} href={`${meta.url}${p.handle}`} target="_blank" rel="noreferrer" style={styles.platCard}>
                                        <div style={styles.platHead}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: meta.color }}></div>
                                                <span style={styles.platName}>{meta.name}</span>
                                            </div>
                                            <ExternalLink size={20} opacity={0.5} />
                                        </div>
                                        <div style={styles.platInner}>
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{p.solved}</div>
                                                <div style={{ fontSize: '0.875rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solved</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', color: meta.color }}>{p.rating}</div>
                                                <div style={{ fontSize: '0.875rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</div>
                                            </div>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Writing */}
            {sections.includes('blogs') && recentPosts.length > 0 && (
                <section className="port-panel port-left" style={{...styles.panel, boxShadow: '10px 0 30px rgba(0,0,0,0.5)'}}>
                    <div style={styles.panelInner}>
                        <h3 style={styles.secTitle}><CheckCircle size={32} color={tConfig.accent} /> Recent Writing</h3>
                        <div style={styles.blogArr}>
                            {recentPosts.map(post => (
                                <Link key={post.id} to={`/blog/${post.slug}`} style={styles.blogCard}>
                                    <div style={{ fontSize: '1rem', opacity: 0.6, marginBottom: '12px' }}>
                                        {new Date(post.publishedAt).toLocaleDateString()} • {post.tags.join(', ')}
                                    </div>
                                    <h4 style={styles.blogTitle}>{post.title}</h4>
                                    {post.excerpt && <p style={{ fontSize: '1.125rem', opacity: 0.8, margin: 0 }}>{post.excerpt}</p>}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer / Contact */}
            {sections.includes('contact') && (
                <section className="port-panel port-top" style={{ ...styles.panel, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={styles.panelInner}>
                        <h3 style={{ fontSize: '4rem', fontWeight: 800, margin: '0 0 24px 0', letterSpacing: '-0.02em' }}>Let's build together.</h3>
                        <p style={{ fontSize: '1.5rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.</p>
                        <a href={`mailto:contact@${profile.username}.com`} style={styles.btn}><Mail size={20} /> Contact Me</a>
                    </div>
                </section>
            )}
        </div>
    );
}
