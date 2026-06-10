import { useState } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import type { TicketFilters as Filters } from '@/types'
import { Inbox } from 'lucide-react'

export default function AgentInboxPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
    // By default, show active tickets (we can let them filter it, but maybe default to not closed)
  })

  // As an agent, GET /api/tickets returns only their ASSIGNED tickets.
  const { data, isLoading, isError, error } = useTickets(filters)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Agent Inbox</h1>
        <p className="text-[var(--color-muted)]">Manage your assigned support tickets.</p>
      </div>

      <TicketFilters filters={filters} onChange={setFilters} />

      {isError && <ErrorMessage error={error} title="Failed to load inbox" />}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={5} />
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-12 w-12 text-[var(--color-muted)] opacity-50" />}
          title="Inbox Zero"
          description="You have no tickets matching these filters. Good job!"
        />
      ) : (
        <div className="space-y-4">
          {data?.data.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            />
          ))}
          
          {data?.meta && data.meta.total > data.meta.pageSize && (
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
