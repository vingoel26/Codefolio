import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

/**
 * A visual showcase of all design tokens for verification.
 * Displays color swatches, typography, cards, and platform colors
 * in both light and dark modes.
 */
export default function ThemeShowcase() {
  const { isDark, theme } = useTheme();

  const bgColors = [
    { name: 'bg-primary', var: '--bg-primary', tw: 'bg-bg-primary' },
    { name: 'bg-secondary', var: '--bg-secondary', tw: 'bg-bg-secondary' },
    { name: 'bg-tertiary', var: '--bg-tertiary', tw: 'bg-bg-tertiary' },
    { name: 'bg-hover', var: '--bg-hover', tw: 'bg-bg-hover' },
  ];

  const textColors = [
    { name: 'text-primary', var: '--text-primary' },
    { name: 'text-secondary', var: '--text-secondary' },
    { name: 'text-muted', var: '--text-muted' },
  ];

  const accentColors = [
    { name: 'accent', var: '--accent' },
    { name: 'accent-hover', var: '--accent-hover' },
    { name: 'success', var: '--success' },
    { name: 'warning', var: '--warning' },
    { name: 'error', var: '--error' },
    { name: 'info', var: '--info' },
  ];

  const platformColors = [
    { name: 'Codeforces', var: '--codeforces', icon: 'CF' },
    { name: 'LeetCode', var: '--leetcode', icon: 'LC' },
    { name: 'CodeChef', var: '--codechef', icon: 'CC' },
    { name: 'GeeksforGeeks', var: '--gfg', icon: 'GFG' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'all 250ms ease',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent), var(--info))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.875rem',
            color: '#ffffff',
          }}>
            CF
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Codefolio
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            Design System
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {isDark ? '🌙 Dark' : '☀️ Light'} Mode
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* ===== HERO ===== */}
        <section style={{ marginBottom: 60, textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}>
            <span className="gradient-text">Codefolio</span> Design System
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: 550,
            margin: '0 auto',
          }}>
            Visual verification of all design tokens, colors, typography, and components across light and dark modes.
          </p>
        </section>

        {/* ===== BACKGROUND COLORS ===== */}
        <Section title="Background Colors">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {bgColors.map(c => (
              <ColorSwatch key={c.name} name={c.name} cssVar={c.var} large />
            ))}
          </div>
        </Section>

        {/* ===== TEXT COLORS ===== */}
        <Section title="Text Colors">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {textColors.map(c => (
              <div key={c.name} className="card" style={{ padding: 20 }}>
                <p style={{ color: `var(${c.var})`, fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                  The quick brown fox jumps over the lazy dog
                </p>
                <code style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {c.name}: var({c.var})
                </code>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== ACCENT & SEMANTIC ===== */}
        <Section title="Accent & Semantic Colors">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {accentColors.map(c => (
              <ColorSwatch key={c.name} name={c.name} cssVar={c.var} />
            ))}
          </div>
        </Section>

        {/* ===== PLATFORM COLORS ===== */}
        <Section title="Platform Colors">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {platformColors.map(p => (
              <div key={p.name} className="card card-interactive" style={{
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                borderLeft: `4px solid var(${p.var})`,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: `var(${p.var})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#ffffff',
                }}>
                  {p.icon}
                </div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</p>
                <code style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  var({p.var})
                </code>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== TYPOGRAPHY ===== */}
        <Section title="Typography">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Heading 1 — Inter 800
              </h1>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>
                Heading 2 — Inter 700
              </h2>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>
                Heading 3 — Inter 600
              </h3>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 8 }}>
                Heading 4 — Inter 600
              </h4>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
                <strong>Body (primary):</strong> Codefolio aggregates your competitive programming stats from LeetCode, Codeforces, CodeChef, and GeeksforGeeks into a single, stunning dashboard.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                <strong>Body (secondary):</strong> Track your progress, compete with friends, and share your coding journey with the community.
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                <strong>Muted:</strong> Last synced 2 hours ago · 1,247 total problems solved
              </p>
            </div>
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: 16,
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: 1.8,
            }}>
              <span style={{ color: 'var(--accent)' }}>const</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>solve</span> ={' '}
              <span style={{ color: 'var(--warning)' }}>(problem)</span> =&gt; {'{'}
              <br />
              {'  '}
              <span style={{ color: 'var(--accent)' }}>return</span>{' '}
              <span style={{ color: 'var(--success)' }}>'Accepted'</span>;
              <br />
              {'}'};
              <br />
              <span style={{ color: 'var(--text-muted)' }}>// JetBrains Mono — Code font</span>
            </div>
          </div>
        </Section>

        {/* ===== CARD VARIANTS ===== */}
        <Section title="Card Variants">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {/* Standard Card */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Standard Card</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Default elevated card with subtle border and shadow.
              </p>
            </div>

            {/* Interactive Card */}
            <div className="card card-interactive" style={{ padding: 24, cursor: 'pointer' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Interactive Card</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Hover me! Lifts up with enhanced shadow.
              </p>
            </div>

            {/* Glass Card */}
            <div className="glass-card" style={{
              padding: 24,
              background: isDark
                ? 'linear-gradient(135deg, rgba(108,92,231,0.05) 0%, rgba(0,180,216,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(108,92,231,0.03) 0%, rgba(0,180,216,0.03) 100%)',
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Glass Card</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Glassmorphism with backdrop blur.
              </p>
            </div>
          </div>
        </Section>

        {/* ===== BUTTONS ===== */}
        <Section title="Buttons">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
          </div>
        </Section>

        {/* ===== CHIPS & BADGES ===== */}
        <Section title="Chips & Badges">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="accent-chip">Dynamic Programming</span>
            <span className="accent-chip">Graphs</span>
            <span className="accent-chip">Binary Search</span>
            <StatusBadge type="success" label="Accepted" />
            <StatusBadge type="error" label="Wrong Answer" />
            <StatusBadge type="warning" label="Time Limit" />
            <StatusBadge type="info" label="Pending" />
          </div>
        </Section>

        {/* ===== STAT CARD DEMO ===== */}
        <Section title="Stat Card Demo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard label="Total Solved" value="1,247" delta="+23 this week" color="var(--accent)" />
            <StatCard label="CF Rating" value="1,842" delta="Specialist" color="var(--codeforces)" />
            <StatCard label="LC Streak" value="42 days" delta="🔥 Active" color="var(--leetcode)" />
            <StatCard label="Current Rank" value="#3,891" delta="Top 5%" color="var(--success)" />
          </div>
        </Section>

        {/* ===== GLOW DEMO ===== */}
        <Section title="Accent Glow">
          <div className="card animate-pulse-glow" style={{
            padding: 32,
            textAlign: 'center',
            borderColor: 'var(--accent)',
          }}>
            <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>
              This card has the <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>animate-pulse-glow</code> effect
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
              Used for highlighting active states, achievements, and live events
            </p>
          </div>
        </Section>

      </main>
    </div>
  );
}

/* ===== Helper Components ===== */

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }} className="animate-fade-in">
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          width: 4,
          height: 20,
          borderRadius: 2,
          background: 'var(--accent)',
          display: 'inline-block',
        }} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({ name, cssVar, large }) {
  return (
    <div className="card" style={{ overflow: 'hidden', cursor: 'default' }}>
      <div style={{
        height: large ? 80 : 56,
        background: `var(${cssVar})`,
        borderBottom: '1px solid var(--border)',
      }} />
      <div style={{ padding: '10px 14px' }}>
        <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 2 }}>{name}</p>
        <code style={{
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          var({cssVar})
        </code>
      </div>
    </div>
  );
}

function Button({ variant = 'primary', children }) {
  const styles = {
    primary: {
      background: 'var(--accent)',
      color: '#ffffff',
      border: 'none',
      hoverBg: 'var(--accent-hover)',
    },
    secondary: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--error-bg)',
      color: 'var(--error)',
      border: '1px solid transparent',
    },
    success: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid transparent',
    },
  };

  const s = styles[variant] || styles.primary;

  return (
    <button style={{
      padding: '10px 20px',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600,
      fontSize: '0.875rem',
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      transition: 'all var(--transition-fast)',
      background: s.background,
      color: s.color,
      border: s.border,
    }}
      onMouseEnter={(e) => {
        e.target.style.opacity = '0.85';
        e.target.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ type, label }) {
  const colorMap = {
    success: { bg: 'var(--success-bg)', color: 'var(--success)' },
    error: { bg: 'var(--error-bg)', color: 'var(--error)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    info: { bg: 'var(--info-bg)', color: 'var(--info)' },
  };
  const c = colorMap[type] || colorMap.info;

  return (
    <span style={{
      background: c.bg,
      color: c.color,
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.8125rem',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: c.color,
      }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, delta, color }) {
  return (
    <div className="card card-interactive" style={{
      padding: 20,
      cursor: 'default',
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        marginBottom: 6,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: color,
      }}>
        {delta}
      </p>
    </div>
  );
}
