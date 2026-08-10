import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { fetchCourseSprintSheets, fetchCurrentBoard } from '../api/client'
import { Label } from '../components/atoms/Label'
import { Select } from '../components/atoms/Select'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { Text } from '../components/atoms/Text'
import { ListRow } from '../components/molecules/ListRow'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { SprintSheetsListSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import {
  SHEET_STATUS_LABELS,
  type CourseSprintSheetSummary,
  type SheetStatus,
} from '../types'

/**
 * Teacher queue of sprint sheets for the course (CT-046).
 */
export function TeacherSprintSheetsPage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || 'in_review'
  const sprintFilter = searchParams.get('sprint') || ''

  const [resolvedCourseId, setResolvedCourseId] = useState(courseId)
  const [courseName, setCourseName] = useState('')
  const [items, setItems] = useState<CourseSprintSheetSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const board = await fetchCurrentBoard()
        if (cancelled) return
        setCourseName(board.course.name)
        const id =
          courseId && courseId !== 'current' ? courseId : board.course.id
        setResolvedCourseId(id)
        const list = await fetchCourseSprintSheets(id, {
          status: statusFilter || undefined,
          sprint: sprintFilter ? Number(sprintFilter) : undefined,
        })
        if (!cancelled) setItems(list)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, statusFilter, sprintFilter])

  return (
    <AppShell courseName={courseName}>
      <section className="flex flex-col gap-4">
        <PageHero
          eyebrow="Revisión"
          title="Fichas de sprint"
          description="Cola de fichas de inicio y fin enviadas por los grupos."
        />

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="sheets-status-filter">Estado</Label>
            <Select
              id="sheets-status-filter"
              value={statusFilter}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                if (e.target.value) next.set('status', e.target.value)
                else next.delete('status')
                setSearchParams(next)
              }}
              className="mt-1 max-w-[14rem]"
            >
              <option value="">Todos los estados</option>
              {(
                [
                  'in_review',
                  'needs_changes',
                  'draft',
                  'approved',
                ] as SheetStatus[]
              ).map((s) => (
                <option key={s} value={s}>
                  {SHEET_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sheets-sprint-filter">Sprint</Label>
            <Select
              id="sheets-sprint-filter"
              value={sprintFilter}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                if (e.target.value) next.set('sprint', e.target.value)
                else next.delete('sprint')
                setSearchParams(next)
              }}
              className="mt-1 max-w-[10rem]"
            >
              <option value="">Todos los sprints</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  Sprint {n}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? <SprintSheetsListSkeleton /> : null}
        {error ? <StateBox title="Error" message={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <Text className="text-fg-muted">
            No hay fichas con esos filtros.
          </Text>
        ) : null}

        {!loading && !error ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item) => (
            <li key={item.id}>
              <ListRow
                to={`/courses/${resolvedCourseId}/sprint-sheets/${item.id}`}
                className="flex items-center justify-between gap-3 px-3.5 py-3 text-fg"
              >
                <div>
                  <p className="m-0 text-[14px] font-semibold">
                    G{item.group.number}
                    {item.group.name ? ` · ${item.group.name}` : ''} · S
                    {item.sprintNumber} ·{' '}
                    {item.kind === 'start' ? 'Inicio' : 'Fin'}
                  </p>
                  <p className="mt-0.5 m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-fg-muted">
                    <SheetStatusBadge status={item.status} />
                    <span>
                      · {item.taskCount} tareas
                      {item.commentCount
                        ? ` · ${item.commentCount} comentarios`
                        : ''}
                    </span>
                  </p>
                </div>
                <span className="text-[13px] font-medium text-accent">
                  Revisar →
                </span>
              </ListRow>
            </li>
          ))}
        </ul>
        ) : null}
      </section>
    </AppShell>
  )
}
