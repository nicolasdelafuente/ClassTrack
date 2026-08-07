import type { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  )
}
