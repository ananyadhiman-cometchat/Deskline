import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ticketCreateSchema, type TicketCreateFormValues } from '@/lib/schemas'
import { useCreateTicket } from '@/hooks/useTickets'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SUBTYPE_DESCRIPTIONS } from '@/types'
import { PlusSquare, AlertTriangle, Info } from 'lucide-react'

export default function RaiseTicketPage() {
  const navigate = useNavigate()
  const createMutation = useCreateTicket()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TicketCreateFormValues>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      category: 'IT',
      priority: 'low',
    },
  })

  const selectedSubType = watch('subType')

  const onSubmit = (data: TicketCreateFormValues) => {
    createMutation.mutate(data, {
      onSuccess: (ticket) => {
        navigate(`/tickets/${ticket.id}`)
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] rounded-sm flex-shrink-0">
          <PlusSquare size={22} />
        </div>
        <div>
          <h1 className="page-header mb-1">Raise a Ticket</h1>
          <p className="page-subtitle mt-0">Submit a new support request.</p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="mb-6">
          <ErrorMessage error={createMutation.error} title="Failed to create ticket" />
        </div>
      )}

      {/* Form Card */}
      <div className="border border-[var(--color-border)] bg-[var(--theme-bg)]">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-8 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <Info size={16} className="text-[var(--color-muted)]" />
          <span className="font-heading text-sm uppercase tracking-wider text-[var(--color-navy)]">
            Ticket Information
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-7">
          <Input
            label="Title"
            {...register('title')}
            error={errors.title?.message}
            required
            placeholder="Brief summary of the issue"
          />

          <Textarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            required
            rows={5}
            placeholder="Provide detailed information about your request..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <Select
              label="Department Category"
              {...register('category')}
              error={errors.category?.message}
              required
              options={[
                { value: 'IT', label: 'IT' },
                { value: 'HR', label: 'HR' },
                { value: 'General', label: 'General' },
              ]}
            />
            <Select
              label="Priority"
              {...register('priority')}
              error={errors.priority?.message}
              required
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>

          <div className="space-y-4">
            <Select
              label="Request Type"
              {...register('subType')}
              error={errors.subType?.message}
              required
              options={[
                { value: 'information', label: 'Information (Q&A / Policy)' },
                { value: 'action', label: 'Action (Provisioning / Access)' },
                { value: 'conversation', label: 'Conversation (Discussion)' },
                { value: 'escalation', label: 'Escalation (Urgent / Sensitive)' },
              ]}
              placeholder="Select the type of request"
            />
            {selectedSubType && (
              <div className="flex items-start gap-3 p-4 border-l-4 border-[var(--color-brand-red)]" style={{ background: 'rgba(255, 70, 85, 0.08)' }}>
                <AlertTriangle size={18} className="text-[var(--color-brand-red)] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-[var(--color-brand-red)] uppercase tracking-widest mb-1">
                    Routing Info
                  </span>
                  <p className="text-sm text-[var(--theme-text-main)] leading-relaxed">
                    {SUBTYPE_DESCRIPTIONS[selectedSubType as keyof typeof SUBTYPE_DESCRIPTIONS]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" tactical isLoading={createMutation.isPending} className="gap-2">
              <PlusSquare size={16} />
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
