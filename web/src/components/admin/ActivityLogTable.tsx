import type { ActivityLog } from '@/types'
import { format } from 'date-fns'

/* ── Action → display config ─────────────────────────────── */
type ActionConfig = { label: string; bg: string; color: string; dot: string }

const ACTION_MAP: Record<string, ActionConfig> = {
  ticket_created:      { label: 'Ticket Created',       bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', dot: '#3b82f6' },
  ticket_updated:      { label: 'Ticket Updated',       bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
  status_changed:      { label: 'Status Changed',       bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
  ticket_escalated:    { label: 'Escalated',            bg: 'rgba(255,70,85,0.1)',  color: '#FF4655', dot: '#FF4655' },
  ticket_assigned:     { label: 'Assigned',             bg: 'rgba(99,102,241,0.1)', color: '#6366f1', dot: '#6366f1' },
  ticket_resolved:     { label: 'Resolved',             bg: 'rgba(16,185,129,0.1)', color: '#10b981', dot: '#10b981' },
  ticket_closed:       { label: 'Closed',               bg: 'rgba(100,116,139,0.1)',color: '#64748b', dot: '#64748b' },
  ai_reply_sent:       { label: 'AI Reply',             bg: 'rgba(168,85,247,0.1)', color: '#a855f7', dot: '#a855f7' },
  cc_message_sent:     { label: 'CC Message',           bg: 'rgba(168,85,247,0.1)', color: '#a855f7', dot: '#a855f7' },
  user_created:        { label: 'User Created',         bg: 'rgba(16,185,129,0.1)', color: '#10b981', dot: '#10b981' },
  user_updated:        { label: 'User Updated',         bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
  user_deactivated:    { label: 'Deactivated',          bg: 'rgba(255,70,85,0.1)',  color: '#FF4655', dot: '#FF4655' },
  login:               { label: 'Login',                bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', dot: '#3b82f6' },
  logout:              { label: 'Logout',               bg: 'rgba(100,116,139,0.1)',color: '#64748b', dot: '#64748b' },
  comment_added:       { label: 'Comment Added',        bg: 'rgba(99,102,241,0.1)', color: '#6366f1', dot: '#6366f1' },
  announcement_sent:   { label: 'Announcement',         bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
}

const FALLBACK_CONFIG: ActionConfig = {
  label: '',
  bg: 'rgba(107,114,128,0.1)',
  color: '#6b7280',
  dot: '#6b7280',
}

function getActionConfig(action: string): ActionConfig {
  if (ACTION_MAP[action]) return ACTION_MAP[action]
  return {
    ...FALLBACK_CONFIG,
    label: action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  }
}

/* ── Entity type badge colours ──────────────────────────── */
const ENTITY_COLOURS: Record<string, string> = {
  ticket: '#3b82f6',
  user:   '#10b981',
  notification: '#a855f7',
  comment: '#6366f1',
}

/* ── Metadata renderer ───────────────────────────────────── */
function MetadataChips({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta || {})
  if (entries.length === 0) return <span style={{ color: 'var(--theme-muted)', fontSize: 12 }}>—</span>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {entries.map(([key, val]) => {
        const display = typeof val === 'object' ? JSON.stringify(val) : String(val)
        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
        return (
          <span
            key={key}
            title={`${key}: ${display}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-main)',
              whiteSpace: 'nowrap',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: 'var(--theme-muted)', fontWeight: 500, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
              {label}
            </span>
            <span style={{ color: 'var(--theme-border)', userSelect: 'none' }}>·</span>
            <span style={{ color: 'var(--theme-text-main)', fontFamily: 'monospace', fontSize: 11 }}>
              {display.length > 22 ? display.slice(0, 22) + '…' : display}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────── */
export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  return (
    <div style={{ border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 180px 160px 90px 110px 1fr',
          background: 'var(--theme-surface)',
          borderBottom: '2px solid var(--theme-border)',
          padding: '0 1rem',
        }}
      >
        {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Metadata'].map((h) => (
          <div
            key={h}
            style={{
              padding: '10px 12px 10px 0',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--theme-muted)',
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {logs.map((log, i) => {
        const cfg = getActionConfig(log.action)
        const entityColor = ENTITY_COLOURS[log.entityType] ?? '#6b7280'

        return (
          <div
            key={log.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 180px 160px 90px 110px 1fr',
              padding: '0 1rem',
              borderBottom: i < logs.length - 1 ? '1px solid var(--theme-border)' : 'none',
              alignItems: 'center',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Timestamp */}
            <div style={{ padding: '14px 12px 14px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-main)', fontFamily: 'monospace' }}>
                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
              </div>
            </div>

            {/* User */}
            <div style={{ padding: '14px 12px 14px 0' }}>
              {log.user ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-main)', marginBottom: 2 }}>
                    {log.user.name}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      background: 'var(--theme-surface)',
                      border: '1px solid var(--theme-border)',
                      color: 'var(--theme-muted)',
                    }}
                  >
                    {log.user.role}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#6b7280',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--theme-muted)', fontStyle: 'italic' }}>System</span>
                </div>
              )}
            </div>

            {/* Action badge */}
            <div style={{ padding: '14px 12px 14px 0' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}22`,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: cfg.dot,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {cfg.label}
              </span>
            </div>

            {/* Entity type */}
            <div style={{ padding: '14px 12px 14px 0' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: entityColor,
                }}
              >
                {log.entityType}
              </span>
            </div>

            {/* Entity ID */}
            <div style={{ padding: '14px 12px 14px 0' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'var(--theme-muted)',
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  padding: '2px 6px',
                  letterSpacing: '0.05em',
                }}
                title={log.entityId}
              >
                {log.entityId.slice(0, 8)}…
              </span>
            </div>

            {/* Metadata chips */}
            <div style={{ padding: '14px 0' }}>
              <MetadataChips meta={log.metadata} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
