import { cn } from './Button'

export function SkeletonLoader({ type = 'text', count = 1, className }: { type?: 'text' | 'title' | 'card'; count?: number; className?: string }) {
  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div 
      key={i} 
      className={cn(
        'skeleton', 
        {
          'skeleton-text': type === 'text',
          'skeleton-title': type === 'title',
          'skeleton-card': type === 'card',
        },
        className
      )} 
    />
  ))

  return <>{skeletons}</>
}
