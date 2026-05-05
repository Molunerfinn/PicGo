import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function CloudCardShell ({
  className,
  ...props
}: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border/60 bg-card p-6',
        className
      )}
      {...props}
    />
  )
}
