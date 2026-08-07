import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded border border-accent-border bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums tracking-wide text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
