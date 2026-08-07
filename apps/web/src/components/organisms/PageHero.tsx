import type { ReactNode } from 'react'
import { Panel } from '../atoms/Panel'
import { MetaStats, type MetaStatItem } from '../molecules/MetaStats'
import { cn } from '../../lib/cn'

type PageHeroProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  stats?: MetaStatItem[]
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  stagger?: 1 | 2 | 3 | 4
}

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  stats,
  actions,
  footer,
  className,
  stagger = 1,
}: PageHeroProps) {
  return (
    <Panel
      as="header"
      tone="elevated"
      className={cn(
        'p-4 sm:p-5',
        stagger === 1 && 'stagger-1',
        stagger === 2 && 'stagger-2',
        stagger === 3 && 'stagger-3',
        stagger === 4 && 'stagger-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-fg sm:text-[32px]">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 max-w-2xl text-[15px] text-fg-muted text-pretty">
              {description}
            </div>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <MetaStats items={stats} className="mt-3" />
      ) : null}

      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      ) : null}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Panel>
  )
}
