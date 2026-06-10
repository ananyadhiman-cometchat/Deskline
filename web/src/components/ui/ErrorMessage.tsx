import { AlertCircle } from 'lucide-react'
import { cn } from './Button'

export function ErrorMessage({ 
  error, 
  title = 'An error occurred',
  className 
}: { 
  error: unknown
  title?: string
  className?: string 
}) {
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
      ? error.message 
      : 'Unknown error'

  return (
    <div className={cn('alert alert-error mb-6 flex items-start gap-3', className)}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-red)]" />
      <div>
        <h4 className="font-semibold uppercase tracking-wider text-[var(--color-brand-red)] text-xs mb-1">
          {title}
        </h4>
        <p>{message}</p>
      </div>
    </div>
  )
}
