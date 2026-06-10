import { cn } from './Button'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean
  hover?: boolean
  size?: 'sm' | 'base'
}

export function Card({ className, accent, hover, size = 'base', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        {
          'card-accent': accent,
          'card-hover': hover,
          'card-sm': size === 'sm',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
