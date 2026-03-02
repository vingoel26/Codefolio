import { LayoutDashboard, ArrowRight } from 'lucide-react';

/**
 * Reusable placeholder for pages not yet implemented.
 * Shows icon, title, description, and a list of planned features.
 */
export default function PagePlaceholder({
    icon: Icon = LayoutDashboard,
    title = 'Coming Soon',
    description = 'This page is under construction.',
    features = [],
    accentColor = 'var(--accent)',
}) {
    return (
        <div className="placeholder-page">
            <div className="placeholder-card glass-card">
                <div className="placeholder-icon-wrap" style={{ background: accentColor + '15' }}>
                    <Icon size={36} color={accentColor} strokeWidth={1.5} />
                </div>
                <h2 className="placeholder-title">{title}</h2>
                <p className="placeholder-desc">{description}</p>

                {features.length > 0 && (
                    <div className="placeholder-features">
                        <p className="placeholder-features-title">Planned Features</p>
                        <ul className="placeholder-features-list">
                            {features.map((f, i) => (
                                <li key={i} className="placeholder-feature-item">
                                    <ArrowRight size={14} color={accentColor} />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="placeholder-phase-badge">
                    <span className="placeholder-phase-dot" style={{ background: accentColor }} />
                    Phase 1 — Foundation
                </div>
            </div>

            <style>{`
                .placeholder-page {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: calc(100vh - 140px);
                    padding: 24px;
                }

                .placeholder-card {
                    max-width: 520px;
                    width: 100%;
                    text-align: center;
                    padding: 48px 40px;
                    animation: fadeIn 0.6s ease-out;
                }

                .placeholder-icon-wrap {
                    width: 72px;
                    height: 72px;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }

                .placeholder-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                    letter-spacing: -0.01em;
                }

                .placeholder-desc {
                    color: var(--text-secondary);
                    font-size: 0.9375rem;
                    line-height: 1.6;
                    margin-bottom: 28px;
                }

                .placeholder-features {
                    text-align: left;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-md);
                    padding: 20px 24px;
                    margin-bottom: 24px;
                }

                .placeholder-features-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    margin-bottom: 12px;
                }

                .placeholder-features-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .placeholder-feature-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .placeholder-phase-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-muted);
                    background: var(--bg-tertiary);
                    padding: 6px 14px;
                    border-radius: var(--radius-full);
                }

                .placeholder-phase-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
