import { cn } from './Button'

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }[size]

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-t-[var(--color-brand-red)] border-r-transparent border-b-[var(--color-border)] border-l-[var(--color-border)]',
          sizeClasses
        )} 
      />
    </div>
  )
}

