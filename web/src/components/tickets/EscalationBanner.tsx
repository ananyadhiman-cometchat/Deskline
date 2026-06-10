import { AlertTriangle } from 'lucide-react'

export function EscalationBanner() {
  return (
    <div className="escalation-banner">
      <AlertTriangle className="escalation-banner-icon h-5 w-5" />
      <div className="escalation-banner-text">
        This ticket has been escalated to a supervisor
      </div>
    </div>
  )
}
