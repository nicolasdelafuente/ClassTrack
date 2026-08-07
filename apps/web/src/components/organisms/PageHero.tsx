import type { ReactNode } from 'react'
import { Panel } from '../atoms/Panel'
import { MetaStats, type MetaStatItem } from '../molecules/MetaStats'
import { cn } from '../../lib/cn'

type PageHeroProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  /** Flat meta row (default). Ignored if `meta` is set. */
  stats?: MetaStatItem[]
  /** Custom grouped metrics — use when flat stats are not enough. */
  meta?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  /** Tighter padding / type for dense academic screens (e.g. Cronograma). */
  compact?: boolean
  className?: string
  stagger?: 1 | 2 | 3 | 4
}

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
  stats,
  meta,
  actions,
  footer,
  compact = false,
  className,
  stagger = 1,
}: PageHeroProps) {
  return (
    <Panel
      as="header"
      tone="elevated"
      className={cn(
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5',
        stagger === 1 && 'stagger-1',
        stagger === 2 && 'stagger-2',
        stagger === 3 && 'stagger-3',
        stagger === 4 && 'stagger-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-fg-faint sm:text-[12px]">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              'mt-0.5 font-bold tracking-tight text-fg',
              compact
                ? 'text-[24px] sm:text-[28px]'
                : 'text-[28px] sm:text-[32px]',
            )}
          >
            {title}
          </h1>
          {description ? (
            <div
              className={cn(
                'mt-1 max-w-2xl text-fg-muted text-pretty',
                compact ? 'text-[13px] sm:text-[14px]' : 'text-[15px]',
              )}
            >
              {description}
            </div>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      {meta ? (
        <div className={cn(compact ? 'mt-2.5' : 'mt-3')}>{meta}</div>
      ) : stats && stats.length > 0 ? (
        <MetaStats items={stats} className={compact ? 'mt-2.5' : 'mt-3'} />
      ) : null}

      {actions ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            compact ? 'mt-2.5' : 'mt-4',
          )}
        >
          {actions}
        </div>
      ) : null}

      {footer ? (
        <div className={compact ? 'mt-2.5' : 'mt-4'}>{footer}</div>
      ) : null}
    </Panel>
  )
}
