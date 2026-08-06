import type { SprintStatus } from '../types'

const LABELS: Record<SprintStatus, string> = {
  unknown: 'Sin datos',
  ok: 'Ok',
  attention: 'Atención',
  critical: 'Crítico',
}

type SprintLightsProps = {
  sprints: { sprintNumber: number; status: SprintStatus }[]
}

export function SprintLights({ sprints }: SprintLightsProps) {
  const ordered = [...sprints].sort((a, b) => a.sprintNumber - b.sprintNumber)

  return (
    <ul className="sprint-lights" aria-label="Semáforo de sprints">
      {ordered.map((sprint) => (
        <li key={sprint.sprintNumber} className="sprint-lights__item">
          <span className="sprint-lights__label">S{sprint.sprintNumber}</span>
          <span
            className={`sprint-lights__dot sprint-lights__dot--${sprint.status}`}
            title={`Sprint ${sprint.sprintNumber}: ${LABELS[sprint.status]}`}
            aria-label={`Sprint ${sprint.sprintNumber}: ${LABELS[sprint.status]}`}
          />
        </li>
      ))}
    </ul>
  )
}
