import { useEffect, useState } from 'react'
import {
  fetchTeachers,
  patchGroupTutor,
  type TeacherOption,
} from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../atoms/Button'
import { Label } from '../atoms/Label'
import { Select } from '../atoms/Select'
import { Text } from '../atoms/Text'

type TutorAssignerProps = {
  groupId: string
  tutorUserId: string | null
  teacherName: string | null
  disabled?: boolean
  onSaved: (next: {
    tutorUserId: string | null
    teacherName: string | null
    tutor: TeacherOption | null
  }) => void
}

/** Assign your tutoría or another teacher's to this group (CT-044). */
export function TutorAssigner({
  groupId,
  tutorUserId,
  teacherName,
  disabled = false,
  onSaved,
}: TutorAssignerProps) {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [value, setValue] = useState(tutorUserId ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setValue(tutorUserId ?? '')
  }, [tutorUserId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await fetchTeachers()
        if (!cancelled) setTeachers(list)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los docentes',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function save() {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      const nextId = value.trim() === '' ? null : value
      const saved = await patchGroupTutor(groupId, nextId)
      onSaved(saved)
      setMessage('Tutoría guardada')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la tutoría',
      )
    } finally {
      setSaving(false)
    }
  }

  function assignMe() {
    if (!user || user.role !== 'teacher') return
    setValue(user.id)
  }

  const labelFor = (t: TeacherOption) =>
    t.displayName?.trim() ? `${t.displayName} · ${t.email}` : t.email

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="group-tutor">Docente tutor</Label>
        <Select
          id="group-tutor"
          disabled={disabled || loading || saving}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Sin tutor asignado</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {labelFor(t)}
              {user?.id === t.id ? ' (vos)' : ''}
            </option>
          ))}
        </Select>
        {!tutorUserId && teacherName ? (
          <Text faint className="mt-1">
            Etiqueta anterior del seed: {teacherName}
          </Text>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {user?.role === 'teacher' ? (
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || saving}
            onClick={assignMe}
          >
            Asignarme a mí
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={
            disabled ||
            saving ||
            loading ||
            (value || '') === (tutorUserId || '')
          }
          onClick={() => void save()}
        >
          {saving ? 'Guardando…' : 'Guardar tutoría'}
        </Button>
      </div>

      {error ? (
        <p className="m-0 text-[13px] text-critical" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="m-0 text-[13px] font-medium text-ok" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
