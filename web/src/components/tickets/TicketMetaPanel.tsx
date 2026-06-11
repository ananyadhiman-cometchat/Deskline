import type { Ticket } from '@/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { STATUS_LABELS, SUBTYPE_LABELS, PRIORITY_LABELS } from '@/types'
import { format } from 'date-fns'
import { 
  Hash, 
  Activity, 
  Flag, 
  Folder, 
  Layers, 
  User, 
  Headset, 
  Clock, 
  History,
  Info,
  Users,
  CalendarDays
} from 'lucide-react'

export function TicketMetaPanel({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="flex flex-col gap-8 p-6">
      
      {/* Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 mb-4">
          <Info size={16} className="text-[var(--color-brand-red)]" />
          <h3 className="section-label mb-0">Details</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--theme-bg)] text-[var(--color-muted)] border border-[var(--color-border)] flex-shrink-0">
              <Hash size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Ticket ID</div>
              <div className="font-mono text-sm font-bold text-[var(--color-navy)] uppercase">{ticket.id.slice(0, 8)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--theme-bg)] text-[var(--color-muted)] border border-[var(--color-border)] flex-shrink-0">
              <Activity size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Status</div>
              <div><Badge variant={ticket.status}>{STATUS_LABELS[ticket.status]}</Badge></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--theme-bg)] text-[var(--color-muted)] border border-[var(--color-border)] flex-shrink-0">
              <Flag size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Priority</div>
              <div><Badge variant={ticket.priority}>{PRIORITY_LABELS[ticket.priority]}</Badge></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-[var(--theme-surface)] border border-[var(--color-border)] p-3 rounded-sm">
              <div className="flex items-center gap-1.5 text-[var(--color-muted)] mb-1.5">
                <Folder size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Category</span>
              </div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">{ticket.category}</div>
            </div>
            
            <div className="bg-[var(--theme-surface)] border border-[var(--color-border)] p-3 rounded-sm">
              <div className="flex items-center gap-1.5 text-[var(--color-muted)] mb-1.5">
                <Layers size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Type</span>
              </div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">{SUBTYPE_LABELS[ticket.subType]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* People Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 mb-4">
          <Users size={16} className="text-[var(--color-brand-red)]" />
          <h3 className="section-label mb-0">People</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--theme-bg)] text-[var(--color-brand-red)] border border-[var(--color-border)] flex-shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Requester</div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">{ticket.employee?.name || 'Unknown'}</div>
              <div className="text-xs text-[var(--color-muted)]">{ticket.employee?.department || ''} Dept</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--theme-bg)] text-[var(--color-status-resolved)] border border-[var(--color-border)] flex-shrink-0">
              <Headset size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Assigned Agent</div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">
                {ticket.agent ? ticket.agent.name : <span className="italic font-normal text-[var(--color-muted)]">Unassigned</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 mb-4">
          <CalendarDays size={16} className="text-[var(--color-brand-red)]" />
          <h3 className="section-label mb-0">Timeline</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--theme-bg)] text-[var(--color-muted)] border border-[var(--color-border)] flex-shrink-0">
              <Clock size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Created</div>
              <div className="font-semibold text-sm text-[var(--color-navy)]">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</div>
              <div className="text-xs text-[var(--color-muted)]">{format(new Date(ticket.createdAt), 'h:mm a')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--theme-bg)] text-[var(--color-muted)] border border-[var(--color-border)] flex-shrink-0">
              <History size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase mb-0.5">Last Activity</div>
              {ticket.lastActivityAt ? (
                <>
                  <div className="font-semibold text-sm text-[var(--color-navy)]">{format(new Date(ticket.lastActivityAt), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-[var(--color-muted)]">{format(new Date(ticket.lastActivityAt), 'h:mm a')}</div>
                </>
              ) : (
                <div className="font-medium text-sm text-[var(--color-muted)] italic">Never</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </Card>
  )
}
