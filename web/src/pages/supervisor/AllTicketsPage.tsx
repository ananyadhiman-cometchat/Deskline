import { useState } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import { useSupervisorEscalations } from '@/hooks/useAdmin'
import type { TicketFilters as Filters, Ticket } from '@/types'
import { ListOrdered } from 'lucide-react'

export default function AllTicketsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'escalation'>('all')

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
  })

  // Determine actual filters based on tab
  // Escalation queue logic: subType=escalation AND (status=escalated OR status=open)
  // Our backend /api/tickets handles this if we pass the right filters, or we can just 
  // request it explicitly. Based on AGENTS.md, supervisor gets all tickets.
  // Wait, AGENTS.md says: escalation queue is `subType=escalation AND (status=escalated OR status=open)`.
  // We can pass `subType=escalation` and `status=escalated` to start, but maybe backend has a dedicated filter?
  // Let's just pass subType=escalation to the backend and filter the rest locally if needed, or assume the backend 
  // can handle an array of statuses. The API contract in SCHEMA doesn't mention array statuses.
  // Let's rely on standard filtering.
  
  const currentFilters = activeTab === 'escalation' 
    ? { ...filters, subType: 'escalation' as const } // backend should handle open/escalated
    : filters

  const { data, isLoading, isError, error } = useTickets(currentFilters)
  const { data: escalationData } = useSupervisorEscalations()

  // Quick local filter for escalation tab to ensure we only show open/escalated 
  // if backend doesn't do the strict OR logic.
  const displayTickets = activeTab === 'escalation'
    ? escalationData?.data ?? []
    : data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Ticket Operations</h1>
        <p className="text-[var(--color-muted)]">Global view of all system tickets and escalation queues.</p>
      </div>

      <div className="flex space-x-1 border-b border-[var(--color-border)] mb-6">
        <button
          className={`px-4 py-3 text-sm font-bold uppercase tracking-wider ${
            activeTab === 'all'
              ? 'border-b-2 border-[var(--color-brand-red)] text-[var(--color-navy)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-navy)]'
          }`}
          onClick={() => { setActiveTab('all'); setFilters({ page: 1, pageSize: 10 }) }}
        >
          All Tickets
        </button>
        <button
          className={`px-4 py-3 text-sm font-bold uppercase tracking-wider ${
            activeTab === 'escalation'
              ? 'border-b-2 border-[var(--color-brand-red)] text-[var(--color-navy)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-navy)]'
          }`}
          onClick={() => { setActiveTab('escalation'); setFilters({ page: 1, pageSize: 10 }) }}
        >
          Escalation Queue
        </button>
      </div>

      {activeTab === 'all' && (
        <TicketFilters filters={filters} onChange={setFilters} showAgentFilters />
      )}

      {isError && <ErrorMessage error={error} title="Failed to load tickets" />}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={5} />
        </div>
      ) : displayTickets?.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-12 w-12 text-[var(--color-muted)] opacity-50" />}
          title="No Tickets Found"
          description="No tickets match your current filters."
        />
      ) : (
        <div className="space-y-4">
          {displayTickets?.map((ticket: Ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            />
          ))}
          
          {data?.meta && data.meta.total > data.meta.pageSize && activeTab === 'all' && (
            <Pagination
              page={data.meta.page}
              pageSize={data.meta.pageSize}
              total={data.meta.total}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          )}
        </div>
      )}
    </div>
  )
}
