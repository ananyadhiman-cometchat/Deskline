import { useParams, useNavigate } from 'react-router-dom'
import { useTicket, useUpdateTicket, useEscalateTicket, useConfirmResolution, useRejectResolution, useRequestHumanHelp, useInterceptTicket } from '@/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { TicketMetaPanel } from '@/components/tickets/TicketMetaPanel'
import { TicketStatusTimeline } from '@/components/tickets/TicketStatusTimeline'
import { TicketCommunicationThread } from '@/components/tickets/TicketCommunicationThread'
import { EscalationBanner } from '@/components/tickets/EscalationBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useState, useEffect } from 'react'
import { getApiErrorMessage } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { ArrowLeft, FileText, GitBranch, CheckCircle2, XCircle } from 'lucide-react'
import { TicketChatSection } from '@/cometchat'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: ticket, isLoading, isError, error } = useTicket(id!)
  const updateMutation = useUpdateTicket(id!)
  const escalateMutation = useEscalateTicket(id!)
  const confirmMutation = useConfirmResolution(id!)
  const rejectMutation = useRejectResolution(id!)
  const humanHelpMutation = useRequestHumanHelp(id!)
  const interceptMutation = useInterceptTicket(id!)

  const [isEscalateModalOpen, setEscalateModalOpen] = useState(false)
  const [isResolutionModalOpen, setResolutionModalOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState<string>('')
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    if (ticket && ticket.status === 'resolved' && user?.role === 'employee' && ticket.employeeId === user?.id) {
      setResolutionModalOpen(true)
    }
  }, [ticket?.status, user?.role, ticket?.employeeId, user?.id])

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
      onError: (error) => showToast({ type: 'error', title: 'Escalation Failed', message: getApiErrorMessage(error) })
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
          <div className="flex items-center gap-3">
            <h1 className="page-header mb-1">{ticket.title}</h1>
          </div>
          <p className="text-[var(--color-muted)] text-sm font-mono uppercase tracking-wider mt-1">TICKET — {ticket.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {user?.role === 'employee' && ticket.status === 'resolved' && ticket.employeeId === user?.id && (
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => setResolutionModalOpen(true)}>
              Review Resolution
            </Button>
          </div>
        )}

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

      {/* Intercept (Join) button for admins/supervisors */}
      {(user?.role === 'admin' || user?.role === 'supervisor') && ticket.cometchatConvoId && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => interceptMutation.mutate()}
            isLoading={interceptMutation.isPending}
          >
            Join Conversation
          </Button>
        </div>
      )}

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

          {ticket.subType === 'information' && user?.role === 'employee' && ticket.employeeId === user.id && !ticket.agentId && ticket.status === 'open' && (
            <Card>
              <div className="space-y-4">
                <div>
                  <h3 className="section-label">Need Human Assistance?</h3>
                  <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">
                    If the automated response did not answer your question, request support from a human agent.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => humanHelpMutation.mutate()}
                  isLoading={humanHelpMutation.isPending}
                >
                  Request Human Help
                </Button>
              </div>
            </Card>
          )}

          {/* CometChat Communication — replaces old thread when conversation exists */}
          {ticket.cometchatConvoId && (
            <TicketChatSection
              conversationId={ticket.cometchatConvoId}
              ticketStatus={ticket.status}
              subType={ticket.subType}
              employee={ticket.employee ?? { id: ticket.employeeId, name: 'Employee' }}
              agent={ticket.agent ?? (ticket.agentId ? { id: ticket.agentId, name: 'Agent' } : null)}
            />
          )}

          {/* Fall back to old thread when no CometChat conversation */}
          {!ticket.cometchatConvoId && (
            <TicketCommunicationThread ticket={ticket} />
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

      <Modal 
        isOpen={isResolutionModalOpen} 
        onClose={() => setResolutionModalOpen(false)} 
        title="Resolution Confirmation Required"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <p className="text-[var(--color-navy)] text-sm leading-relaxed">
            Your ticket has been marked as resolved by the assigned agent. Please review the ticket details and confirm whether your issue has been successfully resolved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--color-border)] mt-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => rejectMutation.mutate(undefined, { onSuccess: () => setResolutionModalOpen(false) })}
              isLoading={rejectMutation.isPending}
              disabled={confirmMutation.isPending}
            >
              <XCircle size={16} className="mr-2 text-[var(--color-brand-red)]" />
              Reject & Reopen
            </Button>
            <Button 
              className="flex-1 !bg-[#10b981] hover:!bg-[#059669] !text-white !border-none !shadow-none hover:!shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
              onClick={() => confirmMutation.mutate(undefined, { onSuccess: () => setResolutionModalOpen(false) })}
              isLoading={confirmMutation.isPending}
              disabled={rejectMutation.isPending}
            >
              <CheckCircle2 size={16} className="mr-2" />
              Confirm Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
