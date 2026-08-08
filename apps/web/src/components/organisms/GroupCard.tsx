import { Link } from 'react-router-dom'
import type { GroupSummary } from '../../types'
import { Badge } from '../atoms/Badge'
import { StatusBadge } from '../atoms/StatusBadge'
import { Heading, Text } from '../atoms/Text'
import { SprintLights } from '../molecules/SprintLights'
import {
  linkedCount,
  overallSprintStatus,
} from '../../lib/sprintMeta'
import { cn } from '../../lib/cn'

type GroupCardProps = {
  group: GroupSummary
  courseId: string
  className?: string
}

export function GroupCard({ group, courseId, className }: GroupCardProps) {
  const title = group.name?.trim() || `Grupo ${group.number}`
  const overall = overallSprintStatus(group.sprints)
  const links = linkedCount(group.links)
  const members = group.members ?? []

  return (
    <Link
      className={cn(
        'flex [content-visibility:auto] [contain-intrinsic-size:auto_180px] flex-col gap-2.5 rounded-xl border border-border bg-surface-1 px-3.5 py-3.5 shadow-panel no-underline transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:border-border-strong hover:bg-surface-hover hover:shadow-lift motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99] motion-safe:animate-fade-up',
        className,
      )}
      to={`/courses/${courseId}/groups/${group.id}`}
      aria-label={`${title}. ${group.projectTopic ?? 'Sin tema'}. ${members.length} integrantes`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge>G{group.number}</Badge>
          <Heading as="h2" className="truncate text-[15px]">
            {title}
          </Heading>
        </div>
        <StatusBadge status={overall} className="shrink-0 text-[11px] px-2 py-0.5" />
      </header>

      <Text className="line-clamp-2 min-h-[2.5em] text-[13px]">
        {group.projectTopic?.trim() || 'Sin tema cargado'}
      </Text>

      <div>
        <p className="m-0 text-[11px] font-medium uppercase tracking-wide text-fg-faint">
          Integrantes · {group.memberCount}/{group.capacity ?? '—'}
        </p>
        {members.length === 0 ? (
          <p className="m-0 mt-1 text-[12px] text-fg-faint">Sin alumnos aún</p>
        ) : (
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-0.5 p-0">
            {members.map((m) => (
              <li
                key={m.id}
                className="truncate text-[12px] font-medium text-fg"
                title={m.email ?? m.fullName}
              >
                {m.fullName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="m-0 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="m-0 font-medium text-fg-faint">Docente</dt>
          <dd className="mt-0.5 truncate font-semibold text-fg">
            {group.teacherName?.trim() || '—'}
          </dd>
        </div>
        <div>
          <dt className="m-0 font-medium text-fg-faint">Links</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-fg">
            {links}/3
          </dd>
        </div>
      </dl>

      <SprintLights sprints={group.sprints} />
    </Link>
  )
}
