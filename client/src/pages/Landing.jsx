import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ui/ThemeToggle';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

export default function Landing() {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    return (
        <div className="landing-page">
            {/* Background Effects */}
            <div className="landing-bg-blob blob-1" />
            <div className="landing-bg-blob blob-2" />
            <div className="landing-bg-blob blob-3" />

            <nav className="landing-nav">
                <div className="landing-logo">
                    <span className="logo-icon">CF</span>
                    <span className="logo-text">Codefolio</span>
                </div>
                <div className="landing-nav-links">
                    <Link to="/about">About</Link>
                    <ThemeToggle />
                </div>
            </nav>

            <main className="landing-hero">
                <div className="hero-content animate-fade-in">
                    <div className="hero-badge">🚀 The Ultimate Developer Hub</div>
                    <h1 className="hero-title">
                        Track, Compete, and <br />
                        <span className="gradient-text">Showcase Your Code.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Integrate LeetCode, Codeforces, and CodeChef into a single dashboard. Battle friends in the Arena, write algorithmic blogs, and build an automatic portfolio.
                    </p>
                    <div className="hero-cta">
                        <Link to="/signup" className="btn-primary">Get Started Free</Link>
                        <Link to="/login" className="btn-secondary">Sign In</Link>
                    </div>
                </div>

                <div className="hero-visual glass-card animate-slide-up">
                    <div className="visual-header">
                        <div className="dots">
                            <span className="dot red" />
                            <span className="dot yellow" />
                            <span className="dot green" />
                        </div>
                    </div>
                    <div className="visual-body">
                        <div className="mock-chart">
                            <div className="mock-bar" style={{ height: '40%' }} />
                            <div className="mock-bar" style={{ height: '65%' }} />
                            <div className="mock-bar" style={{ height: '50%' }} />
                            <div className="mock-bar" style={{ height: '90%' }} />
                            <div className="mock-bar" style={{ height: '75%' }} />
                        </div>
                        <div className="mock-stats">
                            <div className="stat-card">
                                <span>Codeforces</span>
                                <strong>1850</strong>
                            </div>
                            <div className="stat-card">
                                <span>LeetCode</span>
                                <strong>2100</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .landing-page {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    position: relative;
                    overflow: hidden;
                    font-family: var(--font-sans);
                }

                .landing-bg-blob {
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
                    background: var(--accent);
                    top: -200px;
                    right: -100px;
                }

                .blob-2 {
                    width: 500px;
                    height: 500px;
                    background: var(--info);
                    bottom: -150px;
                    left: -100px;
                }

                .blob-3 {
                    width: 400px;
                    height: 400px;
                    background: var(--success);
                    top: 40%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.1;
                }

                .landing-nav {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 60px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .landing-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
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
                    box-shadow: 0 4px 20px rgba(108, 92, 231, 0.3);
                }

                .logo-text {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .landing-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .landing-nav-links a {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    transition: color var(--transition-fast);
                }

                .landing-nav-links a:hover {
                    color: var(--text-primary);
                }

                .landing-hero {
                    position: relative;
                    z-index: 10;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 80px 40px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                    min-height: calc(100vh - 100px);
                }

                .hero-content {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .hero-badge {
                    padding: 6px 16px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--accent);
                    margin-bottom: 24px;
                    display: inline-block;
                }

                .hero-title {
                    font-size: 4rem;
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -0.03em;
                    margin-bottom: 24px;
                }

                .hero-subtitle {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 40px;
                    max-width: 90%;
                }

                .hero-cta {
                    display: flex;
                    gap: 16px;
                }

                .hero-cta a {
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all var(--transition-fast);
                }

                .btn-primary {
                    background: var(--accent);
                    color: white;
                    box-shadow: 0 8px 24px rgba(108, 92, 231, 0.25);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(108, 92, 231, 0.35);
                    background: var(--accent-hover);
                }

                .btn-secondary {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                }

                .btn-secondary:hover {
                    background: var(--bg-secondary);
                    border-color: var(--text-muted);
                }

                .hero-visual {
                    width: 100%;
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.1);
                    position: relative;
                }

                .hero-visual::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
                    pointer-events: none;
                }

                .visual-header {
                    padding: 16px 20px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border);
                }

                .dots {
                    display: flex;
                    gap: 8px;
                }

                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                .dot.red { background: #FF5F56; }
                .dot.yellow { background: #FFBD2E; }
                .dot.green { background: #27C93F; }

                .visual-body {
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .mock-chart {
                    height: 200px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 16px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border);
                }

                .mock-bar {
                    flex: 1;
                    background: linear-gradient(180deg, var(--accent), rgba(108, 92, 231, 0.2));
                    border-radius: 8px 8px 0 0;
                    transition: height 1s ease;
                }

                .mock-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .stat-card {
                    padding: 20px;
                    background: var(--bg-secondary);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    border: 1px solid var(--border);
                }

                .stat-card span {
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .stat-card strong {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .animate-slide-up {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 1024px) {
                    .landing-hero {
                        grid-template-columns: 1fr;
                        text-align: center;
                        padding: 40px 20px;
                        gap: 40px;
                    }
                    .hero-content {
                        align-items: center;
                    }
                    .hero-subtitle {
                        max-width: 100%;
                    }
                    .hero-title {
                        font-size: 3rem;
                    }
                }
            `}</style>
        </div>
    );
}
