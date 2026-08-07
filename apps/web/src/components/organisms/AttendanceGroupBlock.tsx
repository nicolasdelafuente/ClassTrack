import { ButtonLink } from '../atoms/ButtonLink'
import type { AttendanceGroup, AttendanceStudent } from '../../types'
import { AttendanceToggles } from '../molecules/AttendanceToggles'
import { Avatar } from '../atoms/Avatar'
import { Panel } from '../atoms/Panel'
import { StatusBadge } from '../atoms/StatusBadge'
import { Heading } from '../atoms/Text'
import { cn } from '../../lib/cn'

type AttendanceGroupBlockProps = {
  group: AttendanceGroup
  courseId: string
  date: string
  scoped: boolean
  savingId: string | null
  savedId: string | null
  onToggle: (
    student: AttendanceStudent,
    field: 'present' | 'participated',
  ) => void
  stagger?: 1 | 2 | 3 | 4
}

export function AttendanceGroupBlock({
  group,
  courseId,
  date,
  scoped,
  savingId,
  savedId,
  onToggle,
  stagger,
}: AttendanceGroupBlockProps) {
  const presentCount = group.students.filter((s) => s.present).length
  const libreCount = group.students.filter((s) => s.isLibre).length
  const total = group.students.length
  const ratio = total === 0 ? 0 : presentCount / total

  return (
    <Panel as="section" tone="default" stagger={stagger} className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/80 px-3.5 py-3">
        <div className="min-w-0">
          <Heading as="h2" className="text-[15px]">
            Grupo {group.number}
            {group.name ? ` · ${group.name}` : ''}
          </Heading>
          <p className="mt-1 m-0 text-[12px] font-medium tabular-nums text-fg-faint">
            {presentCount}/{total} presentes
            {libreCount > 0 ? ` · ${libreCount} en libre` : ''}
          </p>
          <div
            className="mt-2 h-1 w-40 max-w-full overflow-hidden rounded-full bg-surface-1"
            role="progressbar"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Presentes del grupo ${group.number}`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink
            variant="ghost"
            className="min-h-9 text-[12px]"
            to={`/courses/${courseId}/groups/${group.id}`}
          >
            Ver grupo
          </ButtonLink>
          {!scoped ? (
            <ButtonLink
              variant="text"
              className="text-xs"
              to={`/courses/${courseId}/attendance?date=${date}&groupId=${group.id}`}
            >
              Solo este grupo
            </ButtonLink>
          ) : null}
        </div>
      </header>

      <ul className="m-0 list-none p-0 py-1">
        {group.students.map((student, index) => {
          const busy = savingId === student.id
          const justSaved = savedId === student.id && !busy
          return (
            <li
              key={student.id}
              style={{ animationDelay: `${index * 30}ms` }}
              className={cn(
                'flex flex-col gap-2.5 border-b border-border px-3.5 py-2.5 transition-[background-color,transform] duration-200 last:border-b-0 hover:bg-surface-interactive motion-safe:animate-fade-up sm:flex-row sm:items-center sm:justify-between',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  name={student.fullName}
                  size="sm"
                  className={cn(
                    'transition-transform duration-200',
                    busy && 'motion-safe:scale-95 opacity-80',
                    justSaved && 'motion-safe:scale-105',
                  )}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-fg">
                      {student.fullName}
                    </span>
                    {student.isLibre ? (
                      <StatusBadge status="critical" label="Libre" />
                    ) : null}
                  </div>
                  <span className="mt-0.5 block text-[12px] tabular-nums text-fg-faint">
                    {student.legajo ? `Legajo ${student.legajo} · ` : ''}
                    {student.absenceCount}/{student.maxAbsencesAllowed} faltas
                    {student.isLibre ? ' (excedió el cupo)' : ''}
                  </span>
                </div>
              </div>
              <AttendanceToggles
                present={student.present}
                participated={student.participated}
                disabled={busy}
                saving={busy}
                justSaved={justSaved}
                onTogglePresent={() => onToggle(student, 'present')}
                onToggleParticipated={() => onToggle(student, 'participated')}
              />
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
