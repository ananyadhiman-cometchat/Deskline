import { cn } from './Button'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed'
    | 'low' | 'medium' | 'high'
    | 'employee' | 'agent' | 'supervisor' | 'admin'
    | 'information' | 'action' | 'conversation' | 'escalation'
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant && `badge-${variant}`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
