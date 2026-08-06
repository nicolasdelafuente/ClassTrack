import { Link } from 'react-router-dom'
import type { GroupSummary } from '../types'
import { SprintLights } from './SprintLights'

type GroupCardProps = {
  group: GroupSummary
  courseId: string
}

export function GroupCard({ group, courseId }: GroupCardProps) {
  const title = group.name?.trim() || `Grupo ${group.number}`

  return (
    <Link
      className="group-card"
      to={`/courses/${courseId}/groups/${group.id}`}
      aria-label={`${title}. ${group.projectTopic ?? 'Sin tema'}`}
    >
      <header className="group-card__header">
        <span className="group-card__number">G{group.number}</span>
        <h2 className="group-card__title">{title}</h2>
      </header>

      <p className="group-card__topic">
        {group.projectTopic?.trim() || 'Sin tema cargado'}
      </p>

      <dl className="group-card__meta">
        <div>
          <dt>Docente</dt>
          <dd>{group.teacherName?.trim() || '—'}</dd>
        </div>
        <div>
          <dt>Integrantes</dt>
          <dd>{group.memberCount}</dd>
        </div>
      </dl>

      <SprintLights sprints={group.sprints} />
    </Link>
  )
}
