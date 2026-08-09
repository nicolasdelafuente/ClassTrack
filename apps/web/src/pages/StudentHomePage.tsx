import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCurrentCourse,
  fetchMeProfile,
  fetchMyGroup,
  fetchSprintCalendar,
  fetchStudentSprintOverview,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../auth/roles'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { formatDateDisplay } from '../components/molecules/DatePicker'
import { ListRow } from '../components/molecules/ListRow'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { PageHero } from '../components/organisms/PageHero'
import { StudentHomeSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import type {
  SprintCalendar,
  SprintSheetOverview,
  StudentMeProfile,
  StudentMyGroup,
} from '../types'

type Ready = {
  profile: StudentMeProfile
  group: NonNullable<StudentMyGroup['group']>
  calendar: SprintCalendar
  overview: SprintSheetOverview
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Ready }
  | { status: 'no_group'; profile: StudentMeProfile }

function currentWindow(calendar: SprintCalendar) {
  if (calendar.currentSprintNumber == null) return null
  return (
    calendar.sprints.find(
      (s) => s.sprintNumber === calendar.currentSprintNumber,
    ) ?? null
  )
}

function sprintRangeLabel(startsOn: string, endsOn: string | null) {
  const start = formatDateDisplay(startsOn)
  if (!endsOn) return `Desde ${start}`
  return `${start} → ${formatDateDisplay(endsOn)}`
}

/**
 * Student home: padrones + sprint actual (cronograma) + fichas (CT-E09).
 */
export function StudentHomePage() {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const [course, profile] = await Promise.all([
        fetchCurrentCourse(),
        fetchMeProfile(),
      ])
      const { group } = await fetchMyGroup(course.id)
      if (!group) {
        setState({ status: 'no_group', profile })
        return
      }
      const [calendar, overview] = await Promise.all([
        fetchSprintCalendar(course.id),
        fetchStudentSprintOverview(group.id),
      ])
      setState({
        status: 'ready',
        data: { profile, group, calendar, overview },
      })
    } catch (err) {
      setState({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu espacio. ¿Corriste el seed?',
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const greetingName =
    state.status === 'ready' || state.status === 'no_group'
      ? state.profile.student.fullName.split(' ')[0]
      : user?.displayName?.trim() || ''
  const title = greetingName ? `Hola, ${greetingName}` : 'Hola'

  return (
    <AppShell>
      <section className="mx-auto flex max-w-lg flex-col gap-4 pb-10">
        <PageHero
          eyebrow={`Espacio ${roleLabel('student').toLowerCase()}`}
          title={title}
          description="Tu sprint según el cronograma, tus datos del padrón y las fichas de inicio/fin."
          stats={
            state.status === 'ready'
              ? [
                  {
                    label: 'Cursada',
                    value: state.data.group.course.name,
                  },
                  {
                    label: 'Grupo',
                    value: state.data.group.name
                      ? `${state.data.group.number} · ${state.data.group.name}`
                      : String(state.data.group.number),
                  },
                ]
              : undefined
          }
        />

        {state.status === 'loading' ? <StudentHomeSkeleton /> : null}

        {state.status === 'error' ? (
          <StateBox title="No pudimos cargar" message={state.message} />
        ) : null}

        {state.status === 'no_group' ? (
          <>
            <ProfilePanel profile={state.profile} />
            <StateBox
              title="Todavía no tenés grupo"
              message="Cuando el docente te asigne a un grupo, acá vas a ver el sprint actual y las fichas."
            />
          </>
        ) : null}

        {state.status === 'ready' ? (
          <ReadyHome data={state.data} />
        ) : null}
      </section>
    </AppShell>
  )
}

function ProfilePanel({ profile }: { profile: StudentMeProfile }) {
  const { student } = profile
  return (
    <Panel as="section" tone="default" className="p-4" stagger={2}>
      <SectionTitle hint="Datos del padrón / Excel">Mis datos</SectionTitle>
      <dl className="m-0 mt-3 grid gap-2 text-[14px]">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
          <dt className="m-0 text-fg-muted">Nombre</dt>
          <dd className="m-0 font-medium text-fg">{student.fullName}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
          <dt className="m-0 text-fg-muted">Legajo</dt>
          <dd className="m-0 font-medium text-fg">
            {student.legajo ?? 'Sin legajo'}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
          <dt className="m-0 text-fg-muted">Mail</dt>
          <dd className="m-0 break-all font-medium text-fg">
            {student.email ?? 'Sin mail'}
          </dd>
        </div>
      </dl>
    </Panel>
  )
}

function ReadyHome({ data }: { data: Ready }) {
  const { profile, group, calendar, overview } = data
  const window = currentWindow(calendar)
  const currentN = calendar.currentSprintNumber
  const currentOverview =
    currentN != null
      ? overview.sprints.find((s) => s.sprintNumber === currentN)
      : null

  let sprintMessage: string
  if (currentN != null && window) {
    sprintMessage = `Estás en el Sprint ${currentN}`
  } else if (calendar.sprints.length === 0) {
    sprintMessage = 'Esta cursada aún no tiene sprints en el cronograma'
  } else if (
    calendar.sprints.every((s) => s.endsOn && s.endsOn < calendar.today)
  ) {
    sprintMessage = 'Ya terminaron los sprints del calendario'
  } else {
    sprintMessage = 'Hoy no hay un sprint en curso según el cronograma'
  }

  return (
    <>
      <ProfilePanel profile={profile} />

      <Panel as="section" tone="elevated" className="p-4" stagger={2}>
        <SectionTitle hint="Según el cronograma (no el semáforo)">
          Sprint actual
        </SectionTitle>
        <p className="mt-2 m-0 text-[17px] font-semibold text-fg">
          {sprintMessage}
        </p>
        {window ? (
          <p className="mt-1 m-0 text-[13px] text-fg-muted">
            {sprintRangeLabel(window.startsOn, window.endsOn)}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to={`/alumno/grupos/${group.id}`} variant="primary">
            Ir a mi grupo
          </ButtonLink>
          {currentN != null ? (
            <ButtonLink
              to={`/alumno/grupos/${group.id}/sprints/${currentN}`}
              variant="ghost"
            >
              Fichas del Sprint {currentN}
            </ButtonLink>
          ) : null}
        </div>

        {currentOverview ? (
          <p className="mt-3 m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              Inicio:{' '}
              {currentOverview.start?.status ? (
                <SheetStatusBadge status={currentOverview.start.status} />
              ) : (
                'Sin crear'
              )}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              Fin:{' '}
              {currentOverview.end?.status ? (
                <SheetStatusBadge status={currentOverview.end.status} />
              ) : (
                'Sin crear'
              )}
            </span>
          </p>
        ) : null}
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
        <p className="mt-3 m-0 text-[12px] text-fg-faint">
          ¿Dudas del calendario?{' '}
          <Link
            className="font-medium text-accent underline-offset-2 hover:underline"
            to={`/alumno/grupos/${group.id}`}
          >
            Ver compañeros y evaluaciones
          </Link>
        </p>
      </Panel>
    </>
  )
}
