import { useTickets } from '@/hooks/useTickets'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function EmployeeDashboardPage() {
  const navigate = useNavigate()
  // As an employee, GET /api/tickets returns only their own tickets
  const { data, isLoading, isError, error } = useTickets({
    pageSize: 10,
  })

  const handleRaiseTicket = () => {
    navigate('/tickets/raise')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-header">My Tickets</h1>
          <p className="text-[var(--color-muted)]">Track and manage your support requests.</p>
        </div>
        <Button tactical onClick={handleRaiseTicket} className="gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Raise Ticket
        </Button>
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load tickets" />}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          title="No Active Tickets"
          description="You don't have any support tickets at the moment."
          action={
            <Button variant="secondary" onClick={handleRaiseTicket}>
              Raise your first ticket
            </Button>
          }
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
        </div>
      )}
    </div>
  )
}
