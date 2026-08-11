import { Fragment } from 'react'
import {
  SPRINT_STATUS_LABELS,
  nextSprintStatus,
  type GroupSprint,
  type SheetStatus,
  type SprintStatus,
} from '../../types'
import { cn } from '../../lib/cn'
import { SheetStatusBadge } from '../atoms/SheetStatusBadge'

export type SprintSheetSummary = {
  start: SheetStatus | null
  end: SheetStatus | null
}

type SprintTimelineProps = {
  sprints: GroupSprint[]
  disabled?: boolean
  /** Cycle status in place (legacy). Ignored when `onSelect` is set. */
  onCycle?: (sprintNumber: number, next: SprintStatus) => void
  /** Navigate / open a sprint (preferred on group detail). */
  onSelect?: (sprintNumber: number) => void
  /** Compact read-only strip (e.g. board cards) */
  compact?: boolean
  /** Optional Inicio/Fin meta under each node (group detail). */
  sheetSummaries?: Record<number, SprintSheetSummary>
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

function SheetMeta({
  summary,
}: {
  summary: SprintSheetSummary | undefined
}) {
  if (!summary) return null

  return (
    <div className="mt-1.5 flex w-full min-w-0 flex-col items-center gap-1 px-0.5">
      <span className="inline-flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1 text-[9px] font-medium leading-tight text-fg-faint">
        <span className="shrink-0">Ficha inicio</span>
        {summary.start ? (
          <SheetStatusBadge
            status={summary.start}
            className="px-1.5 py-0 text-[9px]"
          />
        ) : (
          <span className="text-fg-muted">—</span>
        )}
      </span>
      <span className="inline-flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1 text-[9px] font-medium leading-tight text-fg-faint">
        <span className="shrink-0">Ficha fin</span>
        {summary.end ? (
          <SheetStatusBadge
            status={summary.end}
            className="px-1.5 py-0 text-[9px]"
          />
        ) : (
          <span className="text-fg-muted">—</span>
        )}
      </span>
    </div>
  )
}

export function SprintTimeline({
  sprints,
  disabled = false,
  onCycle,
  onSelect,
  compact = false,
  sheetSummaries,
  className,
}: SprintTimelineProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)
  const selectable = Boolean(onSelect) && !compact
  const editable = !selectable && Boolean(onCycle) && !compact
  const interactive = selectable || editable
  const showSheets = Boolean(sheetSummaries) && !compact

  return (
    <ul
      className={cn(
        'm-0 flex w-full min-w-0 list-none items-stretch gap-0',
        // Prefer fitting all nodes; allow scroll only if many sprints overflow.
        // pt keeps hover translate from clipping against overflow-x scrollport.
        'overflow-x-auto overscroll-x-contain pb-1',
        compact ? 'pt-0' : 'pt-1 snap-x snap-mandatory',
        className,
      )}
      aria-label="Semáforo de sprints"
    >
      {ordered.map((sprint, index) => {
        const label = SPRINT_STATUS_LABELS[sprint.status]
        const isLast = index === ordered.length - 1
        const summary = sheetSummaries?.[sprint.sprintNumber]
        const node = (
          <>
            <span
              className={cn(
                'font-semibold tabular-nums',
                compact ? 'text-[10px]' : 'text-[11px] sm:text-[12px]',
              )}
            >
              S{sprint.sprintNumber}
            </span>
            <span
              className={cn(
                'max-w-full text-center font-medium',
                compact
                  ? 'truncate text-[9px] leading-tight'
                  : 'text-[10px] leading-tight sm:text-[11px]',
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
          compact
            ? 'min-w-0 px-1 py-1.5'
            : 'min-w-0 px-1 py-2 sm:px-2 sm:py-2.5',
          nodeTone[sprint.status],
        )

        const interactiveClass = cn(
          nodeClass,
          // Keep lift/shadow; isolation contains paint so connectors stay visible.
          'relative z-0 cursor-pointer transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lift motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
        )

        return (
          <Fragment key={sprint.sprintNumber}>
            <li
              className={cn(
                'relative z-0 flex min-w-0 flex-1 flex-col items-center',
                !compact && 'snap-start',
                // Soft floor so very many sprints can still scroll.
                !compact && ordered.length > 6 && 'min-w-[4.25rem]',
              )}
            >
              {interactive ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(sprint.sprintNumber)
                      return
                    }
                    onCycle?.(
                      sprint.sprintNumber,
                      nextSprintStatus(sprint.status),
                    )
                  }}
                  aria-label={
                    selectable
                      ? `Sprint ${sprint.sprintNumber}: ${label}. Abrir detalle`
                      : `Sprint ${sprint.sprintNumber}: ${label}. Tocar para cambiar`
                  }
                  title={
                    selectable
                      ? 'Abrir sprint'
                      : 'Tocar para cambiar estado'
                  }
                  className={interactiveClass}
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
              {showSheets ? <SheetMeta summary={summary} /> : null}
            </li>

            {!isLast ? (
              <li
                aria-hidden
                className={cn(
                  // Above hover transform/shadow of neighboring nodes (S1→S2 etc.).
                  'relative z-10 flex shrink-0 items-center',
                  showSheets ? 'self-start' : 'self-center',
                  compact ? 'px-0.5' : 'px-1 sm:px-1.5',
                  showSheets && !compact && 'pt-5',
                )}
              >
                <span
                  className={cn(
                    'h-0.5 rounded-full',
                    compact ? 'w-1.5 min-[400px]:w-2' : 'w-2 sm:w-3.5',
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
