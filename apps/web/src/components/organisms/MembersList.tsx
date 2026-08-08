import type { GroupMember, UnassignedStudent } from '../../types'
import { Avatar } from '../atoms/Avatar'
import { Button } from '../atoms/Button'
import { Select } from '../atoms/Select'
import { Text } from '../atoms/Text'

type MembersListProps = {
  members: GroupMember[]
  capacity?: number
  unassigned?: UnassignedStudent[]
  busy?: boolean
  onAdd?: (studentId: string) => void
  onRemove?: (studentId: string) => void
}

/**
 * Group roster. Teacher can add (override) or remove members (CT-045).
 */
export function MembersList({
  members,
  capacity,
  unassigned = [],
  busy = false,
  onAdd,
  onRemove,
}: MembersListProps) {
  return (
    <div className="flex flex-col gap-3">
      {capacity != null ? (
        <Text className="text-[13px] text-fg-muted">
          Cupo: {members.length}/{capacity}
          {members.length >= capacity ? ' · lleno' : ''}
        </Text>
      ) : null}

      {members.length === 0 ? (
        <Text>Sin integrantes cargados.</Text>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {members.map((member) => (
            <li
              key={member.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-[background-color,transform] duration-200 ease-out hover:bg-surface-interactive motion-safe:hover:translate-x-0.5"
            >
              <Avatar
                name={member.fullName}
                size="sm"
                className="motion-safe:group-hover:scale-105"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-fg">
                  {member.fullName}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-fg-faint">
                  {member.legajo ? `Legajo ${member.legajo}` : 'Sin legajo'}
                  {member.email ? ` · ${member.email}` : ''}
                </span>
              </div>
              {onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 px-2 py-1 text-[12px]"
                  disabled={busy}
                  onClick={() => onRemove(member.id)}
                >
                  Sacar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {onAdd ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Text className="text-[12px] font-medium text-fg">
            Agregar alumno (override docente)
          </Text>
          {unassigned.length === 0 ? (
            <Text className="text-[12px] text-fg-faint">
              No hay alumnos sin grupo vinculados a la cursada.
            </Text>
          ) : (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const select = form.elements.namedItem(
                  'studentId',
                ) as HTMLSelectElement
                if (select.value) onAdd(select.value)
              }}
            >
              <Select
                name="studentId"
                className="min-w-[12rem] flex-1"
                disabled={busy}
                defaultValue=""
              >
                <option value="" disabled>
                  Elegí un alumno…
                </option>
                {unassigned.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                    {s.legajo ? ` (${s.legajo})` : ''}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={busy}>
                Agregar
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  )
}
