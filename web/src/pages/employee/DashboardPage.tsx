import { useTickets } from '@/hooks/useTickets'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Button } from '@/components/ui/Button'
import { Plus, LayoutList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useTickets({ pageSize: 10 })

  const handleRaiseTicket = () => {
    navigate('/tickets/raise')
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-9 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] rounded-sm">
            <LayoutList size={22} />
          </div>
          <div>
            <h1 className="page-header">My Tickets</h1>
            <p className="page-subtitle">Track and manage your support requests.</p>
          </div>
        </div>
        <Button tactical onClick={handleRaiseTicket} className="self-start sm:self-auto gap-2">
          <Plus size={16} />
          Raise Ticket
        </Button>
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load tickets" />}

      {isLoading ? (
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-4">
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
