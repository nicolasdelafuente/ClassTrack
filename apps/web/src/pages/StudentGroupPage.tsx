import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchSprintCalendar,
  fetchStudentGroupDetail,
  fetchStudentSprintOverview,
} from '../api/client'
import { Avatar } from '../components/atoms/Avatar'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { formatDateDisplay } from '../components/molecules/DatePicker'
import { ListRow } from '../components/molecules/ListRow'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { SprintTimeline } from '../components/molecules/SprintTimeline'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type {
  SprintCalendar,
  SprintSheetOverview,
  StudentGroupDetail,
} from '../types'

type Ready = {
  detail: StudentGroupDetail
  overview: SprintSheetOverview
  calendar: SprintCalendar
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Ready }

function sprintRangeLabel(startsOn: string, endsOn: string | null) {
  const start = formatDateDisplay(startsOn)
  if (!endsOn) return `Desde ${start}`
  return `${start} → ${formatDateDisplay(endsOn)}`
}

/**
 * Student “Mi grupo”: compañeros, semáforo y historial de fichas.
 */
export function StudentGroupPage() {
  const { groupId = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    if (!groupId) {
      setState({ status: 'error', message: 'Falta el grupo' })
      return
    }
    try {
      const detailPromise = fetchStudentGroupDetail(groupId)
      const overviewPromise = fetchStudentSprintOverview(groupId)
      const detail = await detailPromise
      const [overview, calendar] = await Promise.all([
        overviewPromise,
        fetchSprintCalendar(detail.group.courseId),
      ])
      setState({ status: 'ready', data: { detail, overview, calendar } })
    } catch (err) {
      setState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu grupo',
      })
    }
  }, [groupId])

  useEffect(() => {
    void load()
  }, [load])

  if (state.status === 'loading') {
    return (
      <AppShell showBack backTo="/alumno" backLabel="← Inicio">
        <p className="m-0 text-[14px] text-fg-muted">Cargando grupo…</p>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack backTo="/alumno" backLabel="← Inicio">
        <StateBox title="No se pudo abrir el grupo" message={state.message} />
      </AppShell>
    )
  }

  const { detail, overview, calendar } = state.data
  const { group, members, sprints } = detail
  const currentN = calendar.currentSprintNumber
  const title = group.name?.trim()
    ? `Grupo ${group.number} · ${group.name}`
    : `Grupo ${group.number}`

  return (
    <AppShell showBack backTo="/alumno" backLabel="← Inicio">
      <article className="flex flex-col gap-4 pb-10">
        <PageHero
          compact
          eyebrow={group.course.code}
          title={title}
          description={
            group.projectTopic?.trim()
              ? group.projectTopic
              : `${group.course.name} · ${members.length}/${group.capacity} integrantes`
          }
          actions={
            <ButtonLink to="/alumno" variant="ghost">
              Inicio alumno
            </ButtonLink>
          }
        />

        <Panel as="section" tone="default" className="p-4" stagger={2}>
          <SectionTitle hint="Evaluación del docente (solo lectura)">
            Semáforo de sprints
          </SectionTitle>
          <div className="mt-3">
            <SprintTimeline sprints={sprints} compact />
          </div>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {sprints.map((s) => (
              <li
                key={s.sprintNumber}
                className="flex items-center justify-between gap-2 rounded-lg px-1 py-1"
              >
                <span className="text-[14px] font-medium text-fg">
                  Sprint {s.sprintNumber}
                  {s.sprintNumber === currentN ? (
                    <span className="ml-2 text-[12px] font-semibold text-accent">
                      Actual
                    </span>
                  ) : null}
                </span>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="section" tone="soft" className="p-4" stagger={3}>
          <SectionTitle hint="Inicio y fin de cada sprint">
            Todas las fichas
          </SectionTitle>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {overview.sprints.map((s) => {
              const isCurrent = s.sprintNumber === currentN
              const win = calendar.sprints.find(
                (w) => w.sprintNumber === s.sprintNumber,
              )
              return (
                <ListRow
                  key={s.sprintNumber}
                  to={`/alumno/grupos/${group.id}/sprints/${s.sprintNumber}`}
                  className={
                    isCurrent
                      ? 'block border-accent/25 bg-accent-soft/40 px-3.5 py-3 text-fg'
                      : 'block px-3.5 py-3 text-fg'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-[15px] font-semibold text-fg">
                      Sprint {s.sprintNumber}
                      {isCurrent ? (
                        <span className="ml-2 text-[12px] font-semibold text-accent">
                          Actual
                        </span>
                      ) : null}
                    </p>
                    <span className="text-[13px] font-medium text-accent">
                      Abrir →
                    </span>
                  </div>
                  {win ? (
                    <p className="mt-1 m-0 text-[12px] text-fg-faint">
                      {sprintRangeLabel(win.startsOn, win.endsOn)}
                    </p>
                  ) : null}
                  <p className="mt-1.5 m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
                    <span className="inline-flex items-center gap-1.5">
                      Inicio:{' '}
                      {s.start?.status ? (
                        <SheetStatusBadge status={s.start.status} />
                      ) : (
                        'Sin crear'
                      )}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      Fin:{' '}
                      {s.end?.status ? (
                        <SheetStatusBadge status={s.end.status} />
                      ) : (
                        'Sin crear'
                      )}
                    </span>
                  </p>
                </ListRow>
              )
            })}
          </ul>
        </Panel>

        <Panel as="section" tone="soft" className="p-4" stagger={4}>
          <SectionTitle hint="Datos del padrón de cada integrante">
            Compañeros
          </SectionTitle>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5"
              >
                <Avatar name={m.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[14px] font-medium text-fg">
                    {m.fullName}
                    {m.isMe ? (
                      <span className="ml-1.5 text-[12px] font-semibold text-accent">
                        Vos
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 m-0 truncate text-[12px] text-fg-faint">
                    {m.legajo ? `Legajo ${m.legajo}` : 'Sin legajo'}
                    {m.email ? ` · ${m.email}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </article>
    </AppShell>
  )
}
