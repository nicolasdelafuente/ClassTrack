import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PanelTone = 'elevated' | 'default' | 'soft' | 'flat'

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'header'
  tone?: PanelTone
  interactive?: boolean
  stagger?: 1 | 2 | 3 | 4
  children: ReactNode
}

const tones: Record<PanelTone, string> = {
  elevated: 'border-border bg-surface-1 shadow-lift',
  default: 'border-border bg-surface-1 shadow-panel',
  soft: 'border-transparent bg-surface-2 shadow-none',
  flat: 'border-transparent bg-transparent shadow-none',
}

const staggerClass = {
  1: 'stagger-1',
  2: 'stagger-2',
  3: 'stagger-3',
  4: 'stagger-4',
} as const

export function Panel({
  as: Tag = 'div',
  tone = 'default',
  interactive = false,
  stagger,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border motion-safe:animate-fade-up',
        tones[tone],
        stagger && staggerClass[stagger],
        interactive &&
          'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
