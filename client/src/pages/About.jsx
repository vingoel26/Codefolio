import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function About() {
    return (
        <div className="about-page">
            <div className="about-bg-blob blob-1" />
            <div className="about-bg-blob blob-2" />

            <nav className="about-nav">
                <Link to="/" className="about-logo">
                    <span className="logo-icon">CF</span>
                    <span className="logo-text">Codefolio</span>
                </Link>
                <div className="about-nav-links">
                    <Link to="/">Home</Link>
                    <ThemeToggle />
                </div>
            </nav>

            <main className="about-content animate-fade-in">
                <div className="about-header">
                    <div className="about-badge">About Us</div>
                    <h1 className="about-title">Built for the <span className="gradient-text">Algorithmic</span> Elite</h1>
                    <p className="about-subtitle">
                        Codefolio is an all-in-one ecosystem designed exclusively for competitive programmers. We aggregate your achievements from Codeforces, LeetCode, CodeChef, and GeeksforGeeks into a single gorgeous portfolio.
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card">
                        <div className="feature-icon">📊</div>
                        <h3>Unified Dashboards</h3>
                        <p>Track your submission heatmaps, rating trends, and difficulty progressions across multi-platforms natively.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">⚔️</div>
                        <h3>Battle Arena</h3>
                        <p>Challenge your friends to high-speed algorithmic duels using real Codeforces problems. Chat globally and compete locally.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">📝</div>
                        <h3>Editorials & Blogs</h3>
                        <p>Share your DP tutorials, editorial solutions, and algorithms with a native Rich Text Editor and community feed.</p>
                    </div>
                    <div className="feature-card glass-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Analytics Edge</h3>
                        <p>Our native AI model critiques your algorithms, suggests areas for study, and highlights weak spots in your rating curve.</p>
                    </div>
                </div>

                <div className="about-cta">
                    <h2>Ready to climb the leaderboards?</h2>
                    <Link to="/signup" className="btn-primary">Join Codefolio Now</Link>
                </div>
            </main>

            <style>{`
                .about-page {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    position: relative;
                    overflow: hidden;
                    font-family: var(--font-sans);
                }

                .about-bg-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(140px);
                    opacity: 0.15;
                    pointer-events: none;
                    z-index: 0;
                }

                .blob-1 {
                    width: 600px;
                    height: 600px;
                    background: var(--info);
                    top: -100px;
                    left: -200px;
                }

                .blob-2 {
                    width: 500px;
                    height: 500px;
                    background: var(--accent);
                    bottom: -150px;
                    right: -100px;
                }

                .about-nav {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 60px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .about-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: var(--text-primary);
                }

                .logo-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, var(--accent), var(--info));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: white;
                }

                .logo-text {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .about-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .about-nav-links a {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-weight: 600;
                    transition: color var(--transition-fast);
                }

                .about-nav-links a:hover {
                    color: var(--text-primary);
                }

                .about-content {
                    position: relative;
                    z-index: 10;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 60px 40px 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .about-badge {
                    padding: 6px 16px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--info);
                    margin-bottom: 24px;
                    display: inline-block;
                }

                .about-title {
                    font-size: 4rem;
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                    margin-bottom: 24px;
                }

                .about-subtitle {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 60px;
                    max-width: 800px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                    margin-bottom: 80px;
                    width: 100%;
                    text-align: left;
                }

                .feature-card {
                    padding: 32px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
                }

                .feature-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    border-color: var(--border-strong);
                }

                .feature-icon {
                    font-size: 2.5rem;
                    margin-bottom: 16px;
                }

                .feature-card h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: var(--text-primary);
                }

                .feature-card p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .about-cta {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                    padding: 40px;
                    background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(0, 206, 201, 0.1));
                    border-radius: 24px;
                    border: 1px solid var(--border);
                    width: 100%;
                }

                .about-cta h2 {
                    font-size: 2rem;
                    font-weight: 800;
                }

                .btn-primary {
                    background: var(--accent);
                    color: white;
                    padding: 14px 32px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all var(--transition-fast);
                    box-shadow: 0 8px 24px rgba(108, 92, 231, 0.25);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(108, 92, 231, 0.35);
                    background: var(--accent-hover);
                }

                @media (max-width: 768px) {
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    .about-title {
                        font-size: 3rem;
                    }
                    .about-nav {
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
}
