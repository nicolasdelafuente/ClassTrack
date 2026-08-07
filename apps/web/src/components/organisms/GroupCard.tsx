import { Link } from 'react-router-dom'
import type { GroupSummary } from '../../types'
import { Badge } from '../atoms/Badge'
import { Heading, Text } from '../atoms/Text'
import { SprintLights } from '../molecules/SprintLights'

type GroupCardProps = {
  group: GroupSummary
  courseId: string
}

export function GroupCard({ group, courseId }: GroupCardProps) {
  const title = group.name?.trim() || `Grupo ${group.number}`

  return (
    <Link
      className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-1 px-3.5 py-3 no-underline transition hover:border-border-strong hover:bg-surface-hover active:scale-[0.985]"
      to={`/courses/${courseId}/groups/${group.id}`}
      aria-label={`${title}. ${group.projectTopic ?? 'Sin tema'}`}
    >
      <header className="flex items-center gap-2">
        <Badge>G{group.number}</Badge>
        <Heading as="h2" className="text-sm">
          {title}
        </Heading>
      </header>

      <Text className="line-clamp-2 min-h-[2.5em]">
        {group.projectTopic?.trim() || 'Sin tema cargado'}
      </Text>

      <dl className="m-0 grid grid-cols-[1fr_auto] gap-2 text-xs">
        <div>
          <dt className="m-0 text-[11px] uppercase tracking-wide text-fg-faint">
            Docente
          </dt>
          <dd className="mt-0.5 font-medium text-fg">
            {group.teacherName?.trim() || '—'}
          </dd>
        </div>
        <div>
          <dt className="m-0 text-[11px] uppercase tracking-wide text-fg-faint">
            Integrantes
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-fg">
            {group.memberCount}
          </dd>
        </div>
      </dl>

      <SprintLights sprints={group.sprints} />
    </Link>
  )
}
