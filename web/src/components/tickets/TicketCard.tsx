import { Badge } from '../ui/Badge'
import type { Ticket } from '@/types'
import { STATUS_LABELS, SUBTYPE_LABELS, PRIORITY_LABELS } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick?: () => void }) {
  // Tailwind v4 uses standard classes. Instead of arbitrary classes in index.css, we'll use utility classes.
  
  const getStatusBorderClass = (status: string) => {
    switch(status) {
      case 'open': return 'border-l-4 border-l-blue-500'
      case 'in_progress': return 'border-l-4 border-l-amber-500'
      case 'escalated': return 'border-l-4 border-l-red-500'
      case 'resolved': return 'border-l-4 border-l-emerald-500'
      case 'closed': return 'border-l-4 border-l-slate-400'
      default: return 'border-l-4 border-l-transparent'
    }
  }

  return (
    <div
      className={`border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 transition-all duration-200 ${getStatusBorderClass(ticket.status)} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-muted)]' : ''}`}
      onClick={onClick}
    >
      {/* Title — top of card */}
      <h3 className="font-heading text-lg sm:text-xl text-[var(--color-navy)] uppercase tracking-wide truncate mb-3">
        {ticket.title}
      </h3>

      {/* Ticket ID + Status + Priority row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="font-mono text-xs font-bold tracking-widest text-[var(--color-muted)]">
          #{ticket.id.slice(0, 8).toUpperCase()}
        </span>
        <Badge variant={ticket.status}>{STATUS_LABELS[ticket.status]}</Badge>
        <Badge variant={ticket.priority}>{PRIORITY_LABELS[ticket.priority]}</Badge>
      </div>

      {/* Bottom meta row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ticket.subType as any}>{SUBTYPE_LABELS[ticket.subType]}</Badge>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--color-navy)] bg-[var(--theme-bg)] border border-[var(--color-border)] px-2 py-1 rounded-sm">
            {ticket.category}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
          {ticket.agent ? (
            <span>
              Assigned to <span className="font-semibold text-[var(--color-navy)]">{ticket.agent.name.split(' ')[0]}</span>
            </span>
          ) : (
            <span className="italic">Unassigned</span>
          )}
          <span className="text-[var(--color-border)]">•</span>
          <span>Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}
