import type { TicketStatus } from '@/types'
import { Check } from 'lucide-react'

export function TicketStatusTimeline({ currentStatus }: { currentStatus: TicketStatus }) {
  const steps: { status: TicketStatus; label: string }[] = [
    { status: 'open', label: 'Open' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'resolved', label: 'Resolved' },
    { status: 'closed', label: 'Closed' },
  ]

  // If escalated, replace in_progress with escalated for the visual
  if (currentStatus === 'escalated') {
    steps[1] = { status: 'escalated', label: 'Escalated' }
  }

  const currentIndex = steps.findIndex(s => s.status === currentStatus)
  // If we can't find it (e.g. it was escalated but now resolved), we just assume standard progression
  // The actual logic might need to be smarter if we have a full history log, but for now we infer from current status.
  const activeIndex = currentIndex === -1 && currentStatus === 'resolved' 
    ? 2 
    : currentIndex === -1 && currentStatus === 'closed'
      ? 3
      : currentIndex

  return (
    <div className="timeline">
      {steps.map((step, index) => {
        const isDone = index < activeIndex
        const isActive = index === activeIndex
        const isEscalatedStep = step.status === 'escalated'

        return (
          <div key={step.status} className="timeline-step">
            <div className="timeline-node">
              <div 
                className={`timeline-dot ${isActive ? 'timeline-dot-active' : ''} ${isDone ? 'timeline-dot-done' : ''}`}
                style={isEscalatedStep && isActive ? { borderColor: 'var(--color-brand-red)', backgroundColor: 'var(--color-brand-red)' } : {}}
              >
                {isDone && <Check size={8} className="absolute inset-0 m-auto text-white" strokeWidth={4} />}
              </div>
              <div 
                className={`timeline-label ${isActive ? 'timeline-label-active' : ''} ${isDone ? 'timeline-label-done' : ''}`}
                style={isEscalatedStep && isActive ? { color: 'var(--color-brand-red)' } : {}}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`timeline-connector ${isDone ? 'timeline-connector-done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
