import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from './Button'

export interface AvatarProps {
  src?: string
  fallback: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, fallback, className, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size]

  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-none border border-[var(--color-border)] bg-[var(--color-surface)]',
        sizeClasses,
        className
      )}
    >
      <AvatarPrimitive.Image
        src={src}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-bold text-[var(--color-navy)]"
      >
        {fallback.slice(0, 2).toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
