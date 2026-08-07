import { ButtonLink } from '../atoms/ButtonLink'
import type { AttendanceGroup, AttendanceStudent } from '../../types'
import { AttendanceToggles } from '../molecules/AttendanceToggles'
import { Avatar } from '../atoms/Avatar'
import { Panel } from '../atoms/Panel'
import { Heading } from '../atoms/Text'

type AttendanceGroupBlockProps = {
  group: AttendanceGroup
  courseId: string
  date: string
  scoped: boolean
  savingId: string | null
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
  onToggle,
  stagger,
}: AttendanceGroupBlockProps) {
  return (
    <Panel as="section" tone="default" stagger={stagger} className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-surface-2/80 px-3.5 py-2.5">
        <Heading as="h2" className="text-[15px]">
          Grupo {group.number}
          {group.name ? ` · ${group.name}` : ''}
        </Heading>
        {!scoped ? (
          <ButtonLink
            variant="text"
            className="text-xs"
            to={`/courses/${courseId}/attendance?date=${date}&groupId=${group.id}`}
          >
            Solo este grupo
          </ButtonLink>
        ) : null}
      </header>

      <ul className="m-0 list-none p-0 py-1">
        {group.students.map((student) => {
          const busy = savingId === student.id
          return (
            <li
              key={student.id}
              className="flex flex-col gap-2.5 border-b border-border px-3.5 py-2.5 transition-colors duration-200 last:border-b-0 hover:bg-surface-interactive sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={student.fullName} size="sm" />
                <div className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-fg">
                    {student.fullName}
                  </span>
                  {student.legajo ? (
                    <span className="mt-0.5 block text-[12px] tabular-nums text-fg-faint">
                      Legajo {student.legajo}
                    </span>
                  ) : null}
                </div>
              </div>
              <AttendanceToggles
                present={student.present}
                participated={student.participated}
                disabled={busy}
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
