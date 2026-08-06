import {
  SPRINT_STATUS_LABELS,
  nextSprintStatus,
  type GroupSprint,
  type SprintStatus,
} from '../types'

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
    <ul className="sprint-edit" aria-label="Semáforo de sprints editable">
      {ordered.map((sprint) => {
        const label = SPRINT_STATUS_LABELS[sprint.status]
        return (
          <li key={sprint.sprintNumber}>
            <button
              type="button"
              className={`sprint-edit__btn sprint-edit__btn--${sprint.status}`}
              disabled={disabled}
              onClick={() =>
                onCycle(sprint.sprintNumber, nextSprintStatus(sprint.status))
              }
              aria-label={`Sprint ${sprint.sprintNumber}: ${label}. Tocar para cambiar`}
              title="Tocar para cambiar estado"
            >
              <span className="sprint-edit__num">S{sprint.sprintNumber}</span>
              <span
                className={`sprint-lights__dot sprint-lights__dot--${sprint.status}`}
                aria-hidden
              />
              <span className="sprint-edit__label">{label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
