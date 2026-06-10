import type { Ticket } from '@/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { STATUS_LABELS, SUBTYPE_LABELS, PRIORITY_LABELS } from '@/types'
import { format } from 'date-fns'

export function TicketMetaPanel({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="flex flex-col gap-6">
      <div>
        <div className="section-label mb-2">Details</div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Ticket ID</dt>
            <dd className="font-mono text-xs font-bold text-[var(--color-navy)]">{ticket.id.slice(0, 8)}</dd>
          </div>
          <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Status</dt>
            <dd><Badge variant={ticket.status}>{STATUS_LABELS[ticket.status]}</Badge></dd>
          </div>
          <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Priority</dt>
            <dd><Badge variant={ticket.priority}>{PRIORITY_LABELS[ticket.priority]}</Badge></dd>
          </div>
          <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Category</dt>
            <dd className="font-semibold text-[var(--color-navy)]">{ticket.category}</dd>
          </div>
          <div className="flex justify-between pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Type</dt>
            <dd className="font-semibold text-[var(--color-navy)]">{SUBTYPE_LABELS[ticket.subType]}</dd>
          </div>
        </dl>
      </div>

      <div>
        <div className="section-label mb-2">People</div>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-muted)] font-medium">Requester</dt>
            <dd className="font-semibold text-[var(--color-navy)]">{ticket.employee?.name || 'Unknown'}</dd>
            <dd className="text-xs text-[var(--color-muted)]">{ticket.employee?.department || ''} Dept</dd>
          </div>
          <div className="flex flex-col gap-1 pb-1">
            <dt className="text-[var(--color-muted)] font-medium">Assigned Agent</dt>
            <dd className="font-semibold text-[var(--color-navy)]">
              {ticket.agent ? ticket.agent.name : <span className="italic">Unassigned</span>}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <div className="section-label mb-2">Timeline</div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
            <dt className="text-[var(--color-muted)] font-medium">Created</dt>
            <dd className="text-right text-xs text-[var(--color-navy)] font-medium">
              {format(new Date(ticket.createdAt), 'MMM d, yyyy')}<br/>
              <span className="text-[var(--color-muted)]">{format(new Date(ticket.createdAt), 'h:mm a')}</span>
            </dd>
          </div>
          <div className="flex justify-between pb-1">
            <dt className="text-[var(--color-muted)] font-medium">Last Activity</dt>
            <dd className="text-right text-xs text-[var(--color-navy)] font-medium">
              {ticket.lastActivityAt ? (
                <>
                  {format(new Date(ticket.lastActivityAt), 'MMM d, yyyy')}<br/>
                  <span className="text-[var(--color-muted)]">{format(new Date(ticket.lastActivityAt), 'h:mm a')}</span>
                </>
              ) : 'Never'}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}
