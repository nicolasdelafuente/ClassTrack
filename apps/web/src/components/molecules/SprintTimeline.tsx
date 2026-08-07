import { Fragment } from 'react'
import {
  SPRINT_STATUS_LABELS,
  nextSprintStatus,
  type GroupSprint,
  type SprintStatus,
} from '../../types'
import { cn } from '../../lib/cn'

type SprintTimelineProps = {
  sprints: GroupSprint[]
  disabled?: boolean
  onCycle?: (sprintNumber: number, next: SprintStatus) => void
  /** Compact read-only strip (e.g. board cards) */
  compact?: boolean
  className?: string
}

const nodeTone: Record<SprintStatus, string> = {
  ok: 'border-ok/30 bg-ok-soft text-ok',
  attention: 'border-attention/35 bg-attention-soft text-attention',
  critical: 'border-critical/30 bg-critical-soft text-critical',
  unknown: 'border-border bg-surface-2 text-fg-muted',
}

const connectorTone: Record<SprintStatus, string> = {
  ok: 'bg-ok/35',
  attention: 'bg-attention/40',
  critical: 'bg-critical/35',
  unknown: 'bg-border-strong',
}

export function SprintTimeline({
  sprints,
  disabled = false,
  onCycle,
  compact = false,
  className,
}: SprintTimelineProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)
  const editable = Boolean(onCycle) && !compact

  return (
    <ul
      className={cn(
        'm-0 flex list-none items-stretch gap-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        compact ? 'w-full pt-0' : 'snap-x snap-mandatory',
        className,
      )}
      aria-label="Semáforo de sprints"
    >
      {ordered.map((sprint, index) => {
        const label = SPRINT_STATUS_LABELS[sprint.status]
        const isLast = index === ordered.length - 1
        const node = (
          <>
            <span
              className={cn(
                'font-semibold tabular-nums',
                compact ? 'text-[10px]' : 'text-[12px]',
              )}
            >
              S{sprint.sprintNumber}
            </span>
            <span
              className={cn(
                'truncate font-medium',
                compact ? 'text-[9px] leading-tight' : 'text-[11px]',
              )}
            >
              {compact
                ? label === 'Sin datos'
                  ? '—'
                  : label.slice(0, 3)
                : label}
            </span>
          </>
        )

        const nodeClass = cn(
          'flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border',
          compact ? 'min-w-0 px-1 py-1.5' : 'min-w-[4.5rem] px-2.5 py-2.5 sm:min-w-[5.25rem]',
          nodeTone[sprint.status],
        )

        return (
          <Fragment key={sprint.sprintNumber}>
            <li
              className={cn(
                'flex min-w-0 items-center',
                // Equal columns: connectors live as siblings, not inside flex-1
                compact ? 'flex-1' : 'shrink-0 snap-start',
              )}
            >
              {editable ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onCycle?.(
                      sprint.sprintNumber,
                      nextSprintStatus(sprint.status),
                    )
                  }
                  aria-label={`Sprint ${sprint.sprintNumber}: ${label}. Tocar para cambiar`}
                  title="Tocar para cambiar estado"
                  className={cn(
                    nodeClass,
                    'transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lift motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {node}
                </button>
              ) : (
                <div
                  className={nodeClass}
                  title={`Sprint ${sprint.sprintNumber}: ${label}`}
                  aria-label={`Sprint ${sprint.sprintNumber}: ${label}`}
                >
                  {node}
                </div>
              )}
            </li>

            {!isLast ? (
              <li
                aria-hidden
                className={cn(
                  'flex shrink-0 items-center self-center',
                  compact ? 'px-0.5' : 'px-1',
                )}
              >
                <span
                  className={cn(
                    'h-0.5 rounded-full',
                    compact ? 'w-1.5 min-[400px]:w-2' : 'w-3 sm:w-5',
                    connectorTone[sprint.status],
                  )}
                />
              </li>
            ) : null}
          </Fragment>
        )
      })}
    </ul>
  )
}
