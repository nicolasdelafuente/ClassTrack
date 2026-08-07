import { ButtonLink } from '../atoms/ButtonLink'
import type { AttendanceGroup, AttendanceStudent } from '../../types'
import { AttendanceToggles } from '../molecules/AttendanceToggles'
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
}

export function AttendanceGroupBlock({
  group,
  courseId,
  date,
  scoped,
  savingId,
  onToggle,
}: AttendanceGroupBlockProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <header className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-surface-2 px-3.5 py-2.5">
        <Heading as="h2">
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
              className="flex flex-col gap-2.5 border-b border-border px-3.5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="block text-[13px] font-medium text-fg">
                  {student.fullName}
                </span>
                {student.legajo ? (
                  <span className="mt-0.5 block text-xs tabular-nums text-fg-faint">
                    Legajo {student.legajo}
                  </span>
                ) : null}
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
    </section>
  )
}
