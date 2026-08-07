import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'header'
  children: ReactNode
}

export function Panel({
  as: Tag = 'div',
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-border bg-surface-1 shadow-panel motion-safe:animate-fade-up',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
