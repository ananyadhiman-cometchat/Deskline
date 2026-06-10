import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { Ticket } from '@/types'
import { STATUS_LABELS, SUBTYPE_LABELS, PRIORITY_LABELS } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick?: () => void }) {
  const isEscalated = ticket.status === 'escalated'

  return (
    <Card 
      hover={!!onClick} 
      accent={isEscalated} 
      onClick={onClick}
      className={isEscalated ? 'border-l-[var(--color-brand-red)] bg-red-50/20' : ''}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-muted)]">
              #{ticket.id.slice(0, 8)}
            </span>
            <Badge variant={ticket.status}>{STATUS_LABELS[ticket.status]}</Badge>
            {isEscalated && (
              <Badge variant="escalation">Escalated</Badge>
            )}
          </div>
          <h3 className="font-heading text-base font-bold text-[var(--color-navy)] line-clamp-1">
            {ticket.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
            <span className="font-medium uppercase tracking-wider">{ticket.category}</span>
            <span>•</span>
            <span>{SUBTYPE_LABELS[ticket.subType]}</span>
            <span>•</span>
            <span>Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-2">
          <Badge variant={ticket.priority}>{PRIORITY_LABELS[ticket.priority]} Priority</Badge>
          {ticket.agent ? (
            <span className="text-xs text-[var(--color-muted)]">
              Assigned to <span className="font-medium text-[var(--color-navy)]">{ticket.agent.name.split(' ')[0]}</span>
            </span>
          ) : (
            <span className="text-xs italic text-[var(--color-muted)]">Unassigned</span>
          )}
        </div>
      </div>
    </Card>
  )
}
