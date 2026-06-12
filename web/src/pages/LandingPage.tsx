import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useState, useEffect } from 'react'
import heroDashboard from '/hero_dashboard.png'

/* ─── Dark Mode Hook ─────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('deskline-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('deskline-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark] as const
}

/* ─── Data ───────────────────────────────────────────────── */
const FEATURES = [
  {
    num: '01',
    name: 'TACTICAL ROUTING',
    desc: 'Intelligent ticket distribution with priority-weighted queues. Critical escalations bypass standard channels, reaching supervisors in under 90 seconds.',
  },
  {
    num: '02',
    name: 'AI INTERCEPT LAYER',
    desc: 'Information-class requests are resolved automatically by the embedded LLM subsystem. Agents handle complex cases. The AI handles the volume.',
  },
  {
    num: '03',
    name: 'ROLE COMPARTMENTS',
    desc: 'Strict permission architecture across four clearance levels. Every operator sees exactly what they need — nothing more, nothing less.',
  },
  {
    num: '04',
    name: 'SLA ENFORCEMENT',
    desc: 'Automated timers with breach-prevention alerts. When a ticket runs hot, the system flags it before the clock expires. Always.',
  },
  {
    num: '05',
    name: 'LIVE INTEL DASHBOARD',
    desc: 'Real-time queue analytics, agent performance metrics, and SLA compliance tracking on a single operational command surface.',
  },
  {
    num: '06',
    name: 'API-FIRST CORE',
    desc: 'Every action is an API call. Integrate with your existing stack, trigger webhooks, or build custom workflows with full REST access.',
  },
]

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'TICKET INGESTED',
    desc: 'New request arrives via portal, email, or API. DeskLine classifies by type, urgency, and routing logic in under 200ms.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="square">
        <rect x="3" y="3" width="18" height="18" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'AI SCREENS',
    desc: 'The intercept layer attempts immediate resolution. FAQ-class queries close instantly. Unresolved tickets enter the agent queue with full context.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'AGENT DEPLOYS',
    desc: 'The assigned agent receives the ticket with history, suggested responses, and SLA countdown. One screen. Everything they need.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="square">
        <rect x="2" y="3" width="20" height="14" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    step: '04',
    title: 'MISSION CLOSED',
    desc: 'Resolution logged, CSAT captured, SLA recorded. Every closed ticket feeds the routing intelligence for future operations.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="square">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
]

const ROLES = [
  {
    tier: 'TIER 01 — BRAVO',
    name: 'EMPLOYEE',
    desc: 'Raise requests, track status, view resolution history. A clean portal with no noise.',
    perms: ['Submit tickets', 'View own tickets', 'Notification centre', 'Edit profile'],
    isAdmin: false,
  },
  {
    tier: 'TIER 02 — CHARLIE',
    name: 'AGENT',
    desc: 'Full queue management, ticket ownership, and AI-assist on every assigned case.',
    perms: ['Manage assigned tickets', 'Update ticket status', 'Escalate to supervisor', 'Internal notes'],
    isAdmin: false,
  },
  {
    tier: 'TIER 03 — DELTA',
    name: 'SUPERVISOR',
    desc: 'Team oversight, escalation authority, and SLA monitoring across all active queues.',
    perms: ['View all tickets', 'Reassign & escalate', 'Agent workload view', 'SLA monitoring'],
    isAdmin: false,
  },
  {
    tier: 'TIER 04 — ALPHA',
    name: 'ADMIN',
    desc: 'Full system control. Configure rules, manage all users, and access complete audit trails.',
    perms: ['User management', 'Activity logs', 'Notification logs', 'Ticket analytics'],
    isAdmin: true,
  },
]

const PILLARS = [
  {
    num: '01',
    title: 'SPEED IS A FEATURE',
    text: 'Response time is measured in seconds, not hours. Every workflow is optimised for velocity without sacrificing accountability.',
  },
  {
    num: '02',
    title: 'CLARITY OVER COMPLEXITY',
    text: 'The right information at the right moment. No noise, no bloated dashboards, no wasted cognitive load on any operator at any level.',
  },
  {
    num: '03',
    title: 'TRUST IS STRUCTURAL',
    text: 'Permissions are enforced at the architecture level. Security isn\'t a setting you toggle. It\'s the default state of the system.',
  },
]

const TESTIMONIALS = [
  {
    initials: 'MR',
    quote:
      '"Before DeskLine our escalation process was a Slack thread and a prayer. Now critical issues reach the supervisor in under 90 seconds, automatically. The routing logic alone saved us three full-time headcount."',
    name: 'Maya Reyes',
    role: 'Head of Support Ops — Scalr.io',
  },
  {
    initials: 'DK',
    quote:
      '"The AI intercept layer handles 60% of our incoming volume without agent involvement. My team went from triaging noise to solving real problems. The clearance-based UI means nobody sees what they shouldn\'t."',
    name: 'Daniel Kovacs',
    role: 'VP Engineering — Voltstream',
  },
  {
    initials: 'SN',
    quote:
      '"We evaluated five platforms. DeskLine was the only one that felt designed for teams who care about accountability. The real-time dashboard changed how our supervisors start every shift."',
    name: 'Serena Nakamura',
    role: 'CTO — Forgepoint SaaS',
  },
]

const TICKETS = [
  { id: '#TKT-0041', name: 'API rate limit exceeded', badge: 'ESCALATED', badgeClass: 'badge-red' },
  { id: '#TKT-0039', name: 'SSO config not loading', badge: 'IN PROGRESS', badgeClass: 'badge-yellow' },
  { id: '#TKT-0038', name: 'Invoice for Q2 missing', badge: 'OPEN', badgeClass: 'badge-blue' },
  { id: '#TKT-0035', name: 'Password reset not received', badge: 'RESOLVED', badgeClass: 'badge-green' },
  { id: '#TKT-0034', name: 'Webhook delivery failing', badge: 'IN PROGRESS', badgeClass: 'badge-yellow' },
]

/* ─── Component ──────────────────────────────────────────── */
export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [dark, setDark] = useDarkMode()

  if (isAuthenticated && user) {
    const roleHome: Record<string, string> = {
      employee: '/dashboard',
      agent: '/inbox',
      supervisor: '/tickets',
      admin: '/admin',
    }
    return <Navigate to={roleHome[user.role] ?? '/dashboard'} replace />
  }

  return (
    <div style={{ background: 'var(--theme-bg)', color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Subtle Background Grid ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(15,25,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,25,35,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ══════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          background: dark ? 'rgba(10,17,24,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'var(--theme-border)'}`,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3rem',
        }}
      >
        {/* Logo */}
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: 4, color: 'var(--theme-text-main)' }}>
          Desk<span style={{ color: '#FF4655' }}>Line</span>
        </div>

        {/* Nav Links */}
        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {['Features', 'Workflow', 'Roles', 'Doctrine', 'Pricing'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace('doctrine', 'philosophy')}`}
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--theme-text-main)',
                textDecoration: 'none',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#FF4655')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--theme-text-main)')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Theme toggle */}
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle dark mode"
            style={{
              width: 36,
              height: 36,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'var(--theme-border)'}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--theme-text-main)',
              borderRadius: 0,
              transition: 'border-color 150ms',
              fontSize: 16,
            }}
          >
            {dark ? '☀' : '☾'}
          </button>

          {/* Sign In */}
          <Link
            to="/login"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--theme-text-main)',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>

          {/* Get Started */}
          <Link to="/register" className="btn btn-primary btn-tactical btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          paddingTop: 72,
          borderBottom: '1px solid var(--theme-border)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '80px 3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5rem',
            width: '100%',
          }}
        >
          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Section label */}
            <div className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <span style={{ width: 28, height: 2, background: '#FF4655', display: 'block', flexShrink: 0 }} />
              SUPPORT OPERATIONS PLATFORM
            </div>

            {/* H1 */}
            <h1
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(72px, 10vw, 120px)',
                lineHeight: 0.92,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: 'var(--theme-text-main)',
                marginBottom: '1.5rem',
              }}
            >
              Close Every
              <br />
              <span style={{ color: '#FF4655' }}>TICKET</span>
              <br />
              Loop.
            </h1>

            {/* Subhead */}
            <p
              style={{
                fontSize: 17,
                color: 'var(--theme-muted)',
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: '2.5rem',
              }}
            >
              The tactical support infrastructure for elite SaaS teams. Streamline operations,
              empower agents, and eliminate friction with precision-engineered ticketing.
            </p>

            {/* CTA Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
              <Link to="/register" className="btn btn-primary btn-tactical btn-lg">
                INITIALISE ACCESS
              </Link>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 48,
                  padding: '0 28px',
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--theme-text-main)',
                  color: 'var(--theme-text-main)',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'border-color 150ms, color 150ms',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = '#FF4655'
                  el.style.color = '#FF4655'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--theme-text-main)'
                  el.style.color = 'var(--theme-text-main)'
                }}
              >
                VIEW DEMO
              </Link>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                border: '1px solid var(--theme-border)',
              }}
            >
              {[
                { val: '99.97', unit: '%', label: 'Uptime SLA' },
                { val: '<2', unit: 'min', label: 'Avg Response' },
                { val: '1,200', unit: '+', label: 'Active Teams' },
                { val: '4M', unit: '+', label: 'Tickets Resolved' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '1.25rem 1rem',
                    borderRight: i < 3 ? '1px solid var(--theme-border)' : 'none',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 40,
                      lineHeight: 1,
                      color: 'var(--theme-text-main)',
                    }}
                  >
                    {s.val}
                    <span style={{ color: '#FF4655' }}>{s.unit}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--theme-muted)',
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="landing-hero-right" style={{ width: 460, flexShrink: 0 }}>
            {/* Hero image */}
            <div
              style={{
                border: '1px solid var(--theme-border)',
                borderTop: '3px solid #0F1923',
                overflow: 'hidden',
                marginBottom: 0,
              }}
            >
              <img
                src={heroDashboard}
                alt="DeskLine agent dashboard"
                style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>

            {/* Ticket Inbox Mockup */}
            <div
              style={{
                border: '1px solid var(--theme-border)',
                borderTop: 'none',
                background: dark ? '#162130' : '#ffffff',
              }}
            >
              {/* Header bar */}
              <div
                style={{
                  background: '#0F1923',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  AGENT INBOX — LIVE
                </span>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#FF4655',
                    display: 'inline-block',
                    animation: 'lp-pulse 2s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Ticket rows */}
              <div style={{ padding: '0 16px' }}>
                {TICKETS.map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: i < TICKETS.length - 1 ? '1px solid var(--theme-border)' : 'none',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--theme-muted)', marginBottom: 2 }}>{t.id}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-main)' }}>{t.name}</div>
                    </div>
                    <span className={`lp-badge lp-${t.badgeClass}`}>{t.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Intercept Bar */}
            <div
              style={{
                border: '1px solid var(--theme-border)',
                borderTop: 'none',
                background: dark ? '#162130' : '#ffffff',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--theme-muted)',
                }}
              >
                AI INTERCEPT RATE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 120,
                    height: 4,
                    background: 'var(--theme-border)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '62%',
                      background: '#FF4655',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 20,
                    color: 'var(--theme-text-main)',
                  }}
                >
                  62%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section
        id="features"
        style={{
          background: 'var(--theme-bg)',
          borderBottom: '1px solid var(--theme-border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 3rem' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem', alignItems: 'end' }}>
            <div>
              <div className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <span style={{ width: 20, height: 2, background: '#FF4655', display: 'block', flexShrink: 0 }} />
                FEATURES
              </div>
              <h2
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                  color: 'var(--theme-text-main)',
                  margin: 0,
                }}
              >
                Precision-Engineered Capabilities
              </h2>
            </div>
            <div style={{ fontSize: 16, color: 'var(--theme-muted)', maxWidth: 400, lineHeight: 1.7 }}>
              Every module is purpose-built for support teams operating at high velocity. No bloat. No noise. Only what your team needs to execute.
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderLeft: '1px solid var(--theme-border)',
              borderTop: '1px solid var(--theme-border)',
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className="lp-feature-card"
                style={{
                  padding: '2.5rem',
                  paddingTop: '2rem',
                  borderRight: '1px solid var(--theme-border)',
                  borderBottom: '1px solid var(--theme-border)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 200ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = dark ? 'rgba(255,70,85,0.05)' : 'var(--theme-surface)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--theme-bg)'
                }}
              >
                {/* Ghost watermark number */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    right: 20,
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 100,
                    color: 'var(--theme-text-main)',
                    opacity: 0.04,
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {f.num}
                </span>

                {/* Indexed number badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  <span
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 13,
                      letterSpacing: '0.12em',
                      color: '#FF4655',
                      background: 'rgba(255,70,85,0.08)',
                      border: '1px solid rgba(255,70,85,0.2)',
                      padding: '3px 10px 2px',
                      lineHeight: 1.6,
                    }}
                  >
                    {f.num}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--theme-border)' }} />
                </div>

                {/* Feature name */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--theme-text-main)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ width: 3, height: 14, background: '#FF4655', display: 'inline-block', flexShrink: 0 }} />
                  {f.name}
                </div>
                <p style={{ fontSize: 14, color: 'var(--theme-muted)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WORKFLOW
      ══════════════════════════════════════════════════════ */}
      <section
        id="workflow"
        style={{
          background: '#0F1923',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 3rem' }}>
          <div style={{ marginBottom: '4rem' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#FF4655',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 20, height: 2, background: '#FF4655', display: 'block' }} />
              WORKFLOW
            </div>
            <h2
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                color: '#ffffff',
                margin: 0,
              }}
            >
              OPERATIONAL PROTOCOL
            </h2>
          </div>

          {/* Visual connector row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              marginBottom: 0,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {WORKFLOW_STEPS.map((s, i) => (
              <div
                key={`connector-${s.step}`}
                style={{
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  padding: '1.25rem 2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  position: 'relative',
                }}
              >
                {/* Step pill */}
                <span
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    color: '#FF4655',
                    background: 'rgba(255,70,85,0.1)',
                    border: '1px solid rgba(255,70,85,0.25)',
                    padding: '3px 10px 2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  STEP {s.step}
                </span>
                {/* Connector arrow */}
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polyline points="8,4 16,12 8,20" stroke="#FF4655" strokeWidth="1.5" strokeLinecap="square" fill="none" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {WORKFLOW_STEPS.map((s) => (
              <div
                key={s.step}
                style={{
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  padding: '2.5rem 2rem',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: '1px solid rgba(255,70,85,0.2)',
                    background: 'rgba(255,70,85,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  {s.icon}
                </div>

                {/* Big faint step number */}
                <div
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 56,
                    color: 'rgba(255,255,255,0.05)',
                    lineHeight: 1,
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {s.step}
                </div>

                <div style={{ width: 24, height: 2, background: '#FF4655', marginBottom: '1rem' }} />
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    marginBottom: '0.75rem',
                  }}
                >
                  {s.title}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ROLES
      ══════════════════════════════════════════════════════ */}
      <section
        id="roles"
        style={{
          background: dark ? '#162130' : '#F7F7F7',
          borderBottom: '1px solid var(--theme-border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 3rem' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <span style={{ width: 20, height: 2, background: '#FF4655', display: 'block' }} />
              ACCESS ARCHITECTURE
            </div>
            <h2
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                color: 'var(--theme-text-main)',
                margin: 0,
              }}
            >
              Four Clearance Levels. One Unified Platform.
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: '1px solid var(--theme-border)',
              borderLeft: '1px solid var(--theme-border)',
            }}
          >
            {ROLES.map((r) => (
              <div
                key={r.name}
                className="lp-role-card"
                style={{
                  borderRight: '1px solid var(--theme-border)',
                  borderBottom: '1px solid var(--theme-border)',
                  borderTop: `3px solid ${r.isAdmin ? 'var(--theme-text-main)' : 'transparent'}`,
                  padding: '2rem',
                  background: dark ? '#162130' : '#ffffff',
                  transition: 'border-top-color 150ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  if (!r.isAdmin) e.currentTarget.style.borderTopColor = '#FF4655'
                }}
                onMouseLeave={(e) => {
                  if (!r.isAdmin) e.currentTarget.style.borderTopColor = 'transparent'
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--theme-muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {r.tier}
                </div>
                <div
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 28,
                    letterSpacing: 2,
                    color: 'var(--theme-text-main)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {r.name}
                </div>
                <div
                  style={{
                    width: 24,
                    height: 2,
                    background: r.isAdmin ? 'var(--theme-text-main)' : '#FF4655',
                    marginBottom: '1rem',
                  }}
                />
                <p style={{ fontSize: 13, color: 'var(--theme-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{r.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {r.perms.map((p) => (
                    <li
                      key={p}
                      style={{
                        fontSize: 12,
                        color: 'var(--theme-text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          background: '#FF4655',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PHILOSOPHY
      ══════════════════════════════════════════════════════ */}
      <section
        id="philosophy"
        style={{
          background: 'var(--theme-bg)',
          borderBottom: '1px solid var(--theme-border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '120px 3rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6rem',
            alignItems: 'start',
          }}
        >
          {/* Left */}
          <div>
            <div className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <span style={{ width: 20, height: 2, background: '#FF4655', display: 'block' }} />
              DOCTRINE
            </div>
            <blockquote
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(36px, 4vw, 52px)',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                color: 'var(--theme-text-main)',
                borderLeft: '4px solid #FF4655',
                paddingLeft: '1.5rem',
                marginBottom: '2rem',
                marginLeft: 0,
              }}
            >
              Support isn't a cost centre.
              <br />
              It's your frontline.
            </blockquote>
            <p style={{ fontSize: 15, color: 'var(--theme-muted)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Most support tools are built to log problems. DeskLine is built to eliminate them. We believe that every unresolved ticket is a failure of infrastructure — not of people. Our job is to make the infrastructure invisible and the resolution inevitable.
            </p>
            <p style={{ fontSize: 15, color: 'var(--theme-muted)', lineHeight: 1.8, marginBottom: '2rem' }}>
              We designed DeskLine around one principle: give every agent on your team the operating conditions of your best agent.
            </p>

            {/* Pillars */}
            <div style={{ borderTop: '1px solid var(--theme-border)' }}>
              {PILLARS.map((p) => (
                <div
                  key={p.num}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '1rem',
                    padding: '1.25rem 0',
                    borderBottom: '1px solid var(--theme-border)',
                    alignItems: 'start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 18,
                      color: '#FF4655',
                      letterSpacing: 1,
                    }}
                  >
                    {p.num}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--theme-text-main)',
                        marginBottom: 3,
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--theme-muted)' }}>{p.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Metrics Panel */}
          <div
            style={{
              border: '1px solid var(--theme-border)',
              borderTop: '3px solid #FF4655',
              background: dark ? '#162130' : '#ffffff',
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--theme-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--theme-text-main)',
                }}
              >
                TEAM PERFORMANCE — THIS WEEK
              </span>
              <span
                style={{
                  background: '#DCFCE7',
                  color: '#166534',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                }}
              >
                LIVE
              </span>
            </div>

            {/* Metrics 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[
                { val: '247', unit: '', label: 'TICKETS CLOSED', red: false },
                { val: '1.8', unit: 'min', label: 'AVG RESOLUTION', red: true },
                { val: '98', unit: '%', label: 'SLA COMPLIANCE', red: true },
                { val: '4.9', unit: '', label: 'CSAT SCORE', red: false },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '1.5rem',
                    borderRight: i % 2 === 0 ? '1px solid var(--theme-border)' : 'none',
                    borderBottom: i < 2 ? '1px solid var(--theme-border)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: 44,
                      lineHeight: 1,
                      color: 'var(--theme-text-main)',
                    }}
                  >
                    {m.val}
                    {m.unit && (
                      <span style={{ fontSize: 24, color: '#FF4655' }}>{m.unit}</span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--theme-muted)',
                      marginTop: 4,
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Queue Breakdown */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--theme-border)' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--theme-muted)',
                  marginBottom: 12,
                }}
              >
                QUEUE BREAKDOWN
              </div>
              {[
                { label: 'IT Support', pct: 72, color: 'var(--theme-text-main)' },
                { label: 'HR Requests', pct: 54, color: '#FF4655' },
                { label: 'General', pct: 30, color: 'rgba(15,25,35,0.4)' },
              ].map((q) => (
                <div
                  key={q.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                    gap: '1rem',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--theme-muted)', minWidth: 80 }}>{q.label}</span>
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      background: 'var(--theme-border)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${q.pct}%`,
                        background: q.color,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-muted)', minWidth: 32, textAlign: 'right' }}>
                    {q.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section
        id="testimonials"
        style={{
          background: dark ? '#162130' : '#F7F7F7',
          borderTop: '1px solid var(--theme-border)',
          borderBottom: '1px solid var(--theme-border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 3rem' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <span style={{ width: 20, height: 2, background: '#FF4655', display: 'block' }} />
              FIELD INTELLIGENCE
            </div>
            <h2
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 'clamp(40px, 5vw, 64px)',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                color: 'var(--theme-text-main)',
                margin: 0,
              }}
            >
              What Operators Say
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderLeft: '1px solid var(--theme-border)',
              borderTop: '1px solid var(--theme-border)',
            }}
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.initials}
                className="lp-test-card"
                style={{
                  padding: '2.5rem',
                  borderRight: '1px solid var(--theme-border)',
                  borderBottom: '1px solid var(--theme-border)',
                  borderTop: '2px solid transparent',
                  background: dark ? '#162130' : '#ffffff',
                  transition: 'border-top-color 200ms ease',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderTopColor = '#FF4655')}
                onMouseLeave={(e) => (e.currentTarget.style.borderTopColor = 'transparent')}
              >
                {/* Giant decorative quote mark */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 20,
                    opacity: 0.06,
                    pointerEvents: 'none',
                  }}
                  width="80"
                  height="64"
                  viewBox="0 0 80 64"
                  fill="var(--theme-text-main)"
                >
                  <path d="M0 64V38.4C0 17.067 11.733 4.267 35.2 0l4.267 7.467C27.2 9.6 20.267 15.2 17.067 24H32V64H0zm48 0V38.4C48 17.067 59.733 4.267 83.2 0l4.267 7.467C75.2 9.6 68.267 15.2 65.067 24H80V64H48z" />
                </svg>

                {/* Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: '1.25rem' }}>
                  {[1,2,3,4,5].map((n) => (
                    <svg key={n} width="12" height="12" viewBox="0 0 24 24" fill="#FF4655">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </div>

                {/* Quote icon accent */}
                <svg
                  width="24"
                  height="18"
                  viewBox="0 0 24 18"
                  fill="#FF4655"
                  style={{ marginBottom: '1rem', opacity: 0.9 }}
                >
                  <path d="M0 18V11.4C0 5.1 3.5 1.275 10.5 0l1.275 2.225C8.1 2.875 6.075 4.55 5.1 7.25H9.6V18H0zm14.4 0V11.4C14.4 5.1 17.9 1.275 24.9 0l1.275 2.225C22.5 2.875 20.475 4.55 19.5 7.25H24V18H14.4z" />
                </svg>

                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--theme-muted)',
                    lineHeight: 1.8,
                    marginBottom: '2rem',
                    margin: '0 0 2rem',
                    fontStyle: 'normal',
                  }}
                >
                  {t.quote.replace(/^"|"$/g, '')}
                </p>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--theme-border)', marginBottom: '1.25rem' }} />

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: '1px solid rgba(255,70,85,0.3)',
                      background: 'rgba(255,70,85,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '0.1em',
                      color: '#FF4655',
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-main)', letterSpacing: '0.03em' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--theme-muted)', marginTop: 2, letterSpacing: '0.05em' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0F1923', padding: '4rem 3rem 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Footer Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '3rem',
              paddingBottom: '2.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 24,
                  letterSpacing: 4,
                  color: '#ffffff',
                  marginBottom: '1rem',
                }}
              >
                Desk<span style={{ color: '#FF4655' }}>Line</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
                Tactical support infrastructure for elite SaaS teams. Precision-engineered to eliminate friction at every level of your organisation.
              </p>
            </div>

            {/* Columns */}
            {[
              { title: 'PRODUCT', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Status'] },
              { title: 'COMPANY', links: ['Blog', 'Contact'] },
              { title: 'RESOURCES', links: ['API Reference', 'Integrations', 'Community'] },
            ].map((col) => (
              <div key={col.title}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.3)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {col.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {col.links.map((l) => (
                    <a
                      key={l}
                      href="#"
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.55)',
                        textDecoration: 'none',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#ffffff')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)')}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bottom Bar */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <span>© {new Date().getFullYear()} DeskLine Technologies Ltd. All rights reserved.</span>

            {/* Status pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  animation: 'lp-pulse 2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                All systems operational
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['Privacy', 'Terms'].map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scoped styles for landing-only components ── */}
      <style>{`
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .lp-badge {
          display: inline-block;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .lp-badge-red    { background: #FEE2E2; color: #B91C1C; }
        .lp-badge-yellow { background: #FEF9C3; color: #A16207; }
        .lp-badge-green  { background: #DCFCE7; color: #166534; }
        .lp-badge-blue   { background: #DBEAFE; color: #1D4ED8; }

        @media (max-width: 900px) {
          .landing-nav-links { display: none !important; }
          .landing-hero-right { display: none !important; }
        }

        @media (max-width: 640px) {
          .landing-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
