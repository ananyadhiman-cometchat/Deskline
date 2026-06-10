import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ticketCreateSchema, type TicketCreateFormValues } from '@/lib/schemas'
import { useCreateTicket } from '@/hooks/useTickets'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SUBTYPE_DESCRIPTIONS } from '@/types'

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-header">Raise a Ticket</h1>
        <p className="text-[var(--color-muted)]">
          Submit a new request to the operational support matrix.
        </p>
      </div>

      {createMutation.isError && (
        <ErrorMessage error={createMutation.error} title="Failed to create ticket" />
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

          <div className="space-y-2">
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
              <div className="rounded border-l-2 border-[var(--color-brand-red)] bg-red-50/10 p-3 text-sm text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-brand-red)] uppercase tracking-wide text-xs mb-1 block">Routing Info</span>
                {SUBTYPE_DESCRIPTIONS[selectedSubType as keyof typeof SUBTYPE_DESCRIPTIONS]}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 border-t border-[var(--color-border)] pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              tactical
              isLoading={createMutation.isPending}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
