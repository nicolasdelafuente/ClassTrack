import { SPRINT_STATUS_LABELS, type SprintStatus } from '../../types'
import { StatusDot } from '../atoms/StatusDot'

type SprintLightsProps = {
  sprints: { sprintNumber: number; status: SprintStatus }[]
}

export function SprintLights({ sprints }: SprintLightsProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)

  return (
    <ul
      className="mt-0.5 flex justify-between gap-1 border-t border-border pt-2.5"
      aria-label="Semáforo de sprints"
    >
      {ordered.map((sprint) => (
        <li
          key={sprint.sprintNumber}
          className="flex flex-1 flex-col items-center gap-1.5"
        >
          <span className="text-[10px] font-semibold tabular-nums text-fg-faint">
            S{sprint.sprintNumber}
          </span>
          <StatusDot
            status={sprint.status}
            title={`Sprint ${sprint.sprintNumber}: ${SPRINT_STATUS_LABELS[sprint.status]}`}
            aria-label={`Sprint ${sprint.sprintNumber}: ${SPRINT_STATUS_LABELS[sprint.status]}`}
          />
        </li>
      ))}
    </ul>
  )
}
