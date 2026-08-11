import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchGroupDetail,
  fetchGroupSprintSheets,
  patchGroupSprint,
} from '../api/client'
import { Button } from '../components/atoms/Button'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { IconSignal } from '../components/atoms/icons'
import { InlineStatus } from '../components/atoms/InlineStatus'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { SprintSheetPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import { cn } from '../lib/cn'
import {
  SPRINT_STATUS_LABELS,
  SPRINT_STATUS_ORDER,
  type GroupDetail,
  type SprintSheet,
  type SprintStatus,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      group: GroupDetail
      sprintStatus: SprintStatus
      start: SprintSheet | null
      end: SprintSheet | null
    }

const statusSelectedClass: Record<SprintStatus, string> = {
  unknown: 'border-border-strong bg-surface-2 text-fg',
  ok: 'border-ok/45 bg-ok-soft text-ok',
  attention: 'border-attention/45 bg-attention-soft text-attention',
  critical: 'border-critical/45 bg-critical-soft text-critical',
}

function SheetRow({
  label,
  sheet,
  href,
}: {
  label: string
  sheet: SprintSheet | null
  href: string | null
}) {
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-surface-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <p className="m-0 text-[14px] font-semibold text-fg">{label}</p>
        {sheet ? (
          <p className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-fg-muted">
            <SheetStatusBadge status={sheet.status} />
            <span className="text-fg-faint">
              Actualizada{' '}
              {new Date(sheet.updatedAt).toLocaleDateString('es-AR')}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-[13px] text-fg-faint">Sin crear</p>
        )}
      </div>
      {sheet && href ? (
        <ButtonLink
          variant="ghost"
          className="min-h-10 w-full shrink-0 sm:w-auto"
          to={href}
        >
          Abrir ficha
        </ButtonLink>
      ) : null}
    </li>
  )
}

/**
 * Teacher view for one group sprint: rate semáforo + open start/end sheets.
 */
export function TeacherGroupSprintPage() {
  const { courseId = '', groupId = '', sprintNumber: sprintParam = '' } =
    useParams()
  const sprintNumber = Number(sprintParam)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busy, setBusy] = useState(false)
  const [savePhase, setSavePhase] = useState<'idle' | 'saved' | 'error'>(
    'idle',
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId || !Number.isInteger(sprintNumber) || sprintNumber < 1) {
      setState({ status: 'error', message: 'Sprint inválido' })
      return
    }

    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const [group, sheets] = await Promise.all([
          fetchGroupDetail(groupId),
          fetchGroupSprintSheets(groupId, sprintNumber),
        ])
        if (cancelled) return
        const sprint = group.sprints.find((s) => s.sprintNumber === sprintNumber)
        setState({
          status: 'ready',
          group,
          sprintStatus: sprint?.status ?? 'unknown',
          start: sheets.start,
          end: sheets.end,
        })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'No se pudo cargar el sprint',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [groupId, sprintNumber])

  async function handleSetStatus(next: SprintStatus) {
    if (state.status !== 'ready' || busy) return
    if (state.sprintStatus === next) return
    setBusy(true)
    setSaveError(null)
    setSavePhase('idle')
    try {
      const updated = await patchGroupSprint(groupId, sprintNumber, next)
      setState({
        ...state,
        sprintStatus: updated.status,
      })
      setSavePhase('saved')
    } catch (err) {
      setSavePhase('error')
      setSaveError(
        err instanceof Error ? err.message : 'No se pudo actualizar el sprint',
      )
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <SprintSheetPageSkeleton rows={3} />
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se pudo abrir el sprint" message={state.message} />
      </AppShell>
    )
  }

  const { group, sprintStatus, start, end } = state
  const groupTitle = group.name?.trim() || `Grupo ${group.number}`
  const groupHref = `/courses/${courseId || group.courseId}/groups/${group.id}`
  const sheetBase = `/courses/${courseId || group.courseId}/sprint-sheets`

  return (
    <AppShell
      showBack
      courseName={group.course.name}
      courseCode={group.course.code}
    >
      <article className="flex min-w-0 flex-col gap-4">
        <PageHero
          eyebrow="Sprint del grupo"
          title={
            <span className="break-words text-balance">
              {groupTitle} · Sprint {sprintNumber}
            </span>
          }
          description={group.projectTopic?.trim() || 'Sin tema cargado'}
          badge={<StatusBadge status={sprintStatus} pulseCritical />}
          actions={
            <ButtonLink
              variant="ghost"
              className="min-h-11 w-full sm:w-auto"
              to={groupHref}
            >
              Volver al grupo
            </ButtonLink>
          }
        />

        <Panel as="section" tone="default" className="min-w-0 p-4 sm:p-5">
          <SectionTitle
            icon={<IconSignal className="text-fg-muted" />}
            hint="Elegí el estado del semáforo para este sprint."
          >
            Calificación
          </SectionTitle>
          <div
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
            role="group"
            aria-label="Estado del sprint"
          >
            {SPRINT_STATUS_ORDER.map((status) => {
              const selected = sprintStatus === status
              return (
                <Button
                  key={status}
                  variant="toggle"
                  disabled={busy}
                  aria-pressed={selected}
                  onClick={() => void handleSetStatus(status)}
                  className={cn(
                    'min-h-11 w-full justify-center sm:w-auto sm:min-w-[7.5rem]',
                    selected && statusSelectedClass[status],
                  )}
                >
                  {SPRINT_STATUS_LABELS[status]}
                </Button>
              )
            })}
          </div>
          <InlineStatus
            className="mt-3"
            phase={
              busy ? 'saving' : savePhase === 'saved' ? 'saved' : savePhase === 'error' ? 'error' : 'idle'
            }
            savedLabel="Semáforo actualizado"
            errorMessage={saveError}
          />
        </Panel>

        <Panel as="section" tone="soft" className="min-w-0 p-4 sm:p-5">
          <SectionTitle hint="Fichas de inicio y fin de este sprint.">
            Fichas
          </SectionTitle>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            <SheetRow
              label="Inicio"
              sheet={start}
              href={start ? `${sheetBase}/${start.id}` : null}
            />
            <SheetRow
              label="Fin"
              sheet={end}
              href={end ? `${sheetBase}/${end.id}` : null}
            />
          </ul>
          <p className="mt-3 text-[13px] text-fg-faint">
            También podés ver todas las fichas del curso en{' '}
            <Link
              className="font-medium text-accent underline-offset-2 hover:underline"
              to={`/courses/${courseId || group.courseId}/sprint-sheets`}
            >
              Fichas de sprint
            </Link>
            .
          </p>
        </Panel>
      </article>
    </AppShell>
  )
}
