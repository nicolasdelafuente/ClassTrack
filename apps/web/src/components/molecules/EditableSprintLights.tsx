import {
  SPRINT_STATUS_LABELS,
  nextSprintStatus,
  type GroupSprint,
  type SprintStatus,
} from '../../types'
import { cn } from '../../lib/cn'

type EditableSprintLightsProps = {
  sprints: GroupSprint[]
  disabled?: boolean
  onCycle: (sprintNumber: number, next: SprintStatus) => void
}

const chipTone: Record<SprintStatus, string> = {
  ok: 'border-ok/25 bg-ok-soft text-ok',
  attention: 'border-attention/30 bg-attention-soft text-attention',
  critical: 'border-critical/25 bg-critical-soft text-critical',
  unknown: 'border-border bg-surface-2 text-fg-muted',
}

export function EditableSprintLights({
  sprints,
  disabled = false,
  onCycle,
}: EditableSprintLightsProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)

  return (
    <ul
      className="m-0 flex list-none flex-col gap-2 p-0"
      aria-label="Semáforo de sprints editable"
    >
      {ordered.map((sprint, index) => {
        const label = SPRINT_STATUS_LABELS[sprint.status]
        return (
          <li
            key={sprint.sprintNumber}
            style={{ animationDelay: `${index * 40}ms` }}
            className="motion-safe:animate-fade-up"
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onCycle(sprint.sprintNumber, nextSprintStatus(sprint.status))
              }
              aria-label={`Sprint ${sprint.sprintNumber}: ${label}. Tocar para cambiar`}
              title="Tocar para cambiar estado"
              className={cn(
                'group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lift motion-safe:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
                chipTone[sprint.status],
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="text-[13px] font-semibold tabular-nums">
                  Sprint {sprint.sprintNumber}
                </span>
                <span className="truncate text-[13px] font-medium opacity-90">
                  {label}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-medium opacity-70 transition-opacity group-hover:opacity-100">
                Cambiar
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
