import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchSprintCalendar,
  fetchStudentGroupDetail,
  fetchStudentSprintOverview,
  patchMyGroupLinks,
} from '../api/client'
import { Avatar } from '../components/atoms/Avatar'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { IconLink } from '../components/atoms/icons'
import { Panel } from '../components/atoms/Panel'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import {
  SprintTimeline,
  type SprintSheetSummary,
} from '../components/molecules/SprintTimeline'
import { LinksEditor } from '../components/organisms/LinksEditor'
import { PageHero } from '../components/organisms/PageHero'
import { StudentGroupPageSkeleton } from '../components/organisms/PageSkeletons'
import { AppShell } from '../components/templates/AppShell'
import type {
  GroupLinks,
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

/**
 * Student “Mi grupo”: compañeros, semáforo y recursos del equipo.
 */
export function StudentGroupPage() {
  const { groupId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [linksBusy, setLinksBusy] = useState(false)

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

  const sheetSummaries = useMemo(() => {
    if (state.status !== 'ready') return {}
    const map: Record<number, SprintSheetSummary> = {}
    for (const s of state.data.overview.sprints) {
      map[s.sprintNumber] = {
        start: s.start?.status ?? null,
        end: s.end?.status ?? null,
      }
    }
    return map
  }, [state])

  async function handleSaveLinks(links: GroupLinks) {
    if (state.status !== 'ready') return
    setLinksBusy(true)
    try {
      const saved = await patchMyGroupLinks(groupId, links)
      setState({
        status: 'ready',
        data: {
          ...state.data,
          detail: { ...state.data.detail, links: saved },
        },
      })
    } finally {
      setLinksBusy(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack backTo="/alumno" backLabel="← Inicio">
        <StudentGroupPageSkeleton />
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

  const { detail, calendar } = state.data
  const { group, members, sprints, links } = detail
  const currentN = calendar.currentSprintNumber
  const title = group.name?.trim()
    ? `Grupo ${group.number} · ${group.name}`
    : `Grupo ${group.number}`

  const semaforoHint =
    currentN != null
      ? `Sprint actual: S${currentN}. Tocá un nodo para abrir las fichas.`
      : 'Tocá un nodo para abrir las fichas.'

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
          <SectionTitle hint={semaforoHint}>Semáforo de sprints</SectionTitle>
          <div className="mt-3 min-w-0">
            <SprintTimeline
              sprints={sprints}
              sheetSummaries={sheetSummaries}
              onSelect={(n) =>
                navigate(`/alumno/grupos/${group.id}/sprints/${n}`)
              }
            />
          </div>
        </Panel>

        <Panel as="section" tone="soft" className="p-4" stagger={3}>
          <SectionTitle
            icon={<IconLink className="text-fg-muted" />}
            hint="Espacio GitHub, repos (una rama c/u), Trello y Drive. Cualquier integrante puede actualizarlos."
          >
            Recursos del equipo
          </SectionTitle>
          <LinksEditor
            links={links}
            disabled={linksBusy}
            onSave={handleSaveLinks}
          />
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
