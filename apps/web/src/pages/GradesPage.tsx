import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchFinalGrades,
  fetchPreliminaryGrades,
  patchGroupPreliminaryComment,
  putFinalGrade,
  putPreliminaryGrade,
  type GradeStudentRow,
  type GradesRoster,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { Input } from '../components/atoms/Input'
import { Label } from '../components/atoms/Label'
import { Select } from '../components/atoms/Select'
import { Textarea } from '../components/atoms/Textarea'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { GradesPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'

type Mode = 'preliminary' | 'final'

type GradesPageProps = {
  mode: Mode
}

function markSelectValue(s: GradeStudentRow): string {
  if (s.isAbsent) return 'A'
  if (s.score != null) return String(s.score)
  return ''
}

/**
 * Teacher grades roster: preliminary (CT-047) or final (CT-048).
 * Marks: integers 1–10 or A (ausente).
 */
export function GradesPage({ mode }: GradesPageProps) {
  const { courseId = '' } = useParams()
  const [roster, setRoster] = useState<GradesRoster | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data =
        mode === 'preliminary'
          ? await fetchPreliminaryGrades(courseId)
          : await fetchFinalGrades(courseId)
      setRoster(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [courseId, mode])

  useEffect(() => {
    void load()
  }, [load])

  async function handleMark(
    studentId: string,
    value: string,
    comment?: string | null,
  ) {
    const key = `${studentId}-mark`
    setBusyKey(key)
    try {
      let body: {
        score?: number
        isAbsent?: boolean
        clear?: boolean
        comment?: string | null
      }
      if (value === '') {
        body = { clear: true, comment: comment ?? undefined }
      } else if (value === 'A') {
        body = { isAbsent: true, comment: comment ?? undefined }
      } else {
        body = {
          score: Number(value),
          isAbsent: false,
          comment: comment ?? undefined,
        }
      }

      const updated =
        mode === 'preliminary'
          ? await putPreliminaryGrade(courseId, studentId, body)
          : await putFinalGrade(courseId, studentId, body)

      setRoster((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          groups: prev.groups.map((g) => ({
            ...g,
            students: g.students.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    score: updated.score,
                    isAbsent: updated.isAbsent,
                    hasMark: updated.hasMark,
                    comment:
                      'comment' in updated
                        ? (updated.comment ?? null)
                        : s.comment,
                  }
                : s,
            ),
          })),
        }
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleComment(studentId: string, comment: string) {
    if (mode !== 'preliminary') return
    const key = `${studentId}-comment`
    setBusyKey(key)
    try {
      const updated = await putPreliminaryGrade(courseId, studentId, {
        comment: comment.trim() || null,
      })
      setRoster((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          groups: prev.groups.map((g) => ({
            ...g,
            students: g.students.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    comment: updated.comment ?? null,
                    score: updated.score,
                    isAbsent: updated.isAbsent,
                    hasMark: updated.hasMark,
                  }
                : s,
            ),
          })),
        }
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleGroupComment(groupId: string, comment: string) {
    setBusyKey(`group-${groupId}`)
    try {
      const res = await patchGroupPreliminaryComment(
        groupId,
        comment.trim() || null,
      )
      setRoster((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  preliminaryGroupComment: res.preliminaryGroupComment,
                }
              : g,
          ),
        }
      })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusyKey(null)
    }
  }

  const title =
    mode === 'preliminary' ? 'Precalificación' : 'Notas finales'
  const description =
    mode === 'preliminary'
      ? 'Nota individual 1–10 o A (ausente) antes de la presentación, con comentarios opcionales.'
      : 'Nota final 1–10 o A (ausente) por cada integrante del grupo.'

  return (
    <AppShell>
      <section className="mx-auto flex max-w-3xl flex-col gap-4 pb-10">
        <PageHero
          eyebrow="Evaluación"
          title={title}
          description={description}
          actions={
            <>
              <ButtonLink
                variant={mode === 'preliminary' ? 'primary' : 'ghost'}
                className="min-h-11"
                to={`/courses/${courseId}/grades/preliminary`}
              >
                Precalificación
              </ButtonLink>
              <ButtonLink
                variant={mode === 'final' ? 'primary' : 'ghost'}
                className="min-h-11"
                to={`/courses/${courseId}/grades/final`}
              >
                Nota final
              </ButtonLink>
            </>
          }
        />

        {loading ? <GradesPageSkeleton /> : null}
        {error ? <StateBox title="Error" message={error} /> : null}

        {!loading && !error
          ? roster?.groups.map((group) => (
          <Panel as="section" key={group.id} className="p-4">
            <h2 className="m-0 text-[16px] font-semibold text-fg">
              Grupo {group.number}
              {group.name ? ` · ${group.name}` : ''}
            </h2>

            {mode === 'preliminary' ? (
              <div className="mt-3">
                <Label htmlFor={`gcomment-${group.id}`}>
                  Comentario del grupo (opcional)
                </Label>
                <Textarea
                  id={`gcomment-${group.id}`}
                  rows={2}
                  defaultValue={group.preliminaryGroupComment ?? ''}
                  key={`${group.id}-${group.preliminaryGroupComment ?? ''}`}
                  disabled={busyKey === `group-${group.id}`}
                  onBlur={(e) => {
                    const next = e.target.value
                    if (next !== (group.preliminaryGroupComment ?? '')) {
                      void handleGroupComment(group.id, next)
                    }
                  }}
                />
              </div>
            ) : null}

            <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
              {group.students.map((student) => (
                <li
                  key={student.id}
                  className="rounded-md border border-border bg-surface-2 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 text-[14px] font-medium text-fg">
                        {student.fullName}
                      </p>
                      <p className="mt-0.5 m-0 text-[12px] text-fg-faint">
                        {student.legajo
                          ? `Legajo ${student.legajo}`
                          : 'Sin legajo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        aria-label={`Nota de ${student.fullName}`}
                        className="w-[5.5rem]"
                        value={markSelectValue(student)}
                        disabled={busyKey === `${student.id}-mark`}
                        onChange={(e) =>
                          void handleMark(student.id, e.target.value)
                        }
                      >
                        <option value="">—</option>
                        <option value="A">A</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={String(n)}>
                            {n}
                          </option>
                        ))}
                      </Select>
                      {student.hasMark ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-[12px]"
                          disabled={busyKey !== null}
                          onClick={() => void handleMark(student.id, '')}
                        >
                          Borrar
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {mode === 'preliminary' ? (
                    <div className="mt-2">
                      <Label htmlFor={`c-${student.id}`}>
                        Comentario individual (opcional)
                      </Label>
                      <Input
                        id={`c-${student.id}`}
                        defaultValue={student.comment ?? ''}
                        key={`${student.id}-c-${student.comment ?? ''}`}
                        disabled={busyKey === `${student.id}-comment`}
                        onBlur={(e) => {
                          const next = e.target.value
                          if (next !== (student.comment ?? '')) {
                            void handleComment(student.id, next)
                          }
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        ))
          : null}
      </section>
    </AppShell>
  )
}
