import { useState } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TicketFilters } from '@/components/tickets/TicketFilters'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { TicketFilters as Filters, Ticket } from '@/types'
import { ListOrdered } from 'lucide-react'

export default function MyTicketsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
    agentId: user?.id // Only fetch tickets assigned to this supervisor
  })

  const { data, isLoading, isError, error } = useTickets(filters)

  const displayTickets = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">My Tickets</h1>
        <p className="text-[var(--color-muted)]">View and manage tickets directly assigned to you.</p>
      </div>

      <TicketFilters filters={filters} onChange={(newFilters) => setFilters({ ...newFilters, agentId: user?.id })} showAgentFilters={false} />

      {isError && <ErrorMessage error={error} title="Failed to load tickets" />}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={5} />
        </div>
      ) : displayTickets?.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-12 w-12 text-[var(--color-muted)] opacity-50" />}
          title="No Tickets Found"
          description="You don't have any tickets assigned to you that match these filters."
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
