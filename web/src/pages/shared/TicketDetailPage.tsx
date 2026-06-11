import { useParams, useNavigate } from 'react-router-dom'
import { useTicket, useUpdateTicket, useEscalateTicket } from '@/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { TicketMetaPanel } from '@/components/tickets/TicketMetaPanel'
import { TicketStatusTimeline } from '@/components/tickets/TicketStatusTimeline'
import { AIReplyPanel } from '@/components/tickets/AIReplyPanel'
import { EscalationBanner } from '@/components/tickets/EscalationBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useState } from 'react'
import { getApiErrorMessage } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { ArrowLeft, FileText, GitBranch } from 'lucide-react'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: ticket, isLoading, isError, error } = useTicket(id!)
  const updateMutation = useUpdateTicket(id!)
  const escalateMutation = useEscalateTicket(id!)

  const [isEscalateModalOpen, setEscalateModalOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState<string>('')
  const showToast = useUIStore((s) => s.showToast)

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          &larr; Back
        </Button>
        <ErrorMessage error={error} title="Ticket Not Found" />
      </div>
    )
  }

  if (isLoading || !ticket) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <SkeletonLoader type="title" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
          <div>
            <SkeletonLoader type="card" />
          </div>
        </div>
      </div>
    )
  }

  const isAssignedAgent = user?.id === ticket.agentId
  const isAgentOrSupervisor = user?.role === 'agent' || user?.role === 'supervisor' || user?.role === 'admin'
  const canUpdateStatus = isAgentOrSupervisor && (isAssignedAgent || user?.role !== 'agent')
  
  const handleStatusUpdate = () => {
    if (statusDraft && statusDraft !== ticket.status) {
      updateMutation.mutate({ status: statusDraft as any }, {
        onSuccess: () => setStatusDraft('')
      })
    }
  }

  const handleEscalate = () => {
    escalateMutation.mutate(undefined, {
      onSuccess: () => setEscalateModalOpen(false),
      onError: (error) => showToast(getApiErrorMessage(error))
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-0 hover:bg-transparent flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-navy)]">
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-header mb-1">{ticket.title}</h1>
          <p className="text-[var(--color-muted)] text-sm font-mono uppercase tracking-wider mt-1">TICKET — {ticket.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {canUpdateStatus && ticket.status !== 'closed' && (
          <div className="flex items-center gap-2 bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
            <Select
              className="min-w-[140px] m-0"
              value={statusDraft || ticket.status}
              onChange={(e) => setStatusDraft(e.target.value)}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
              disabled={updateMutation.isPending}
            />
            {statusDraft && statusDraft !== ticket.status && (
              <Button size="sm" tactical onClick={handleStatusUpdate} isLoading={updateMutation.isPending}>
                Update
              </Button>
            )}
            {ticket.status === 'in_progress' && (
              <Button 
                size="sm" 
                variant="danger" 
                onClick={() => setEscalateModalOpen(true)}
                disabled={escalateMutation.isPending}
              >
                Escalate
              </Button>
            )}
          </div>
        )}
      </div>

      {ticket.status === 'escalated' && <EscalationBanner />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 section-label">
              <FileText size={14} />
              Description
            </div>
            <div className="mt-4 text-[var(--color-navy)] text-base leading-[1.85] whitespace-pre-wrap">
              {ticket.description}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 section-label">
              <GitBranch size={14} />
              Status Progression
            </div>
            <TicketStatusTimeline currentStatus={ticket.status} />
          </Card>

          {ticket.subType === 'information' && (
            <AIReplyPanel replyBody="This is an automated system response. Based on your 'Information' request, here are the relevant policy documents and answers...\n\n(AI Reply mocked until backend integration is complete)" />
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <TicketMetaPanel ticket={ticket} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={isEscalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        onConfirm={handleEscalate}
        title="Escalate Ticket"
        description="Are you sure you want to escalate this ticket? It will be reassigned to the supervisor queue immediately."
        confirmText="Yes, Escalate"
        isDestructive
        isLoading={escalateMutation.isPending}
      />
    </div>
  )
}
