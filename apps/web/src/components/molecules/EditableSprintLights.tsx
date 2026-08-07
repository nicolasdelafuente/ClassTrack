import {
  SPRINT_STATUS_LABELS,
  nextSprintStatus,
  type GroupSprint,
  type SprintStatus,
} from '../../types'
import { StatusDot } from '../atoms/StatusDot'

type EditableSprintLightsProps = {
  sprints: GroupSprint[]
  disabled?: boolean
  onCycle: (sprintNumber: number, next: SprintStatus) => void
}

export function EditableSprintLights({
  sprints,
  disabled = false,
  onCycle,
}: EditableSprintLightsProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)

  return (
    <ul
      className="m-0 grid list-none grid-cols-5 gap-1.5 p-0"
      aria-label="Semáforo de sprints editable"
    >
      {ordered.map((sprint) => {
        const label = SPRINT_STATUS_LABELS[sprint.status]
        return (
          <li key={sprint.sprintNumber}>
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onCycle(sprint.sprintNumber, nextSprintStatus(sprint.status))
              }
              aria-label={`Sprint ${sprint.sprintNumber}: ${label}. Tocar para cambiar`}
              title="Tocar para cambiar estado"
              className="flex w-full flex-col items-center gap-1.5 rounded-md border border-border bg-surface-2 px-1 py-2.5 text-fg transition hover:border-border-strong hover:bg-surface-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-[10px] font-semibold tabular-nums text-fg-faint">
                S{sprint.sprintNumber}
              </span>
              <StatusDot status={sprint.status} aria-hidden />
              <span className="text-center text-[10px] font-medium leading-tight text-fg-muted">
                {label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
