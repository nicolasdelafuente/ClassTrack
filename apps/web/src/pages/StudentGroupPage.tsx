import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchStudentGroupDetail } from '../api/client'
import { Avatar } from '../components/atoms/Avatar'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox } from '../components/molecules/StateBox'
import { SprintTimeline } from '../components/molecules/SprintTimeline'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import type { StudentGroupDetail } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: StudentGroupDetail }

/**
 * Student “Mi grupo”: compañeros + evaluaciones de sprint (solo lectura).
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
      const detail = await fetchStudentGroupDetail(groupId)
      setState({ status: 'ready', detail })
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

  const { detail } = state
  const { group, members, sprints } = detail
  const title = group.name?.trim()
    ? `Grupo ${group.number} · ${group.name}`
    : `Grupo ${group.number}`

  return (
    <AppShell showBack backTo="/alumno" backLabel="← Inicio">
      <article className="mx-auto flex max-w-lg flex-col gap-4 pb-10">
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
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  <ButtonLink
                    to={`/alumno/grupos/${group.id}/sprints/${s.sprintNumber}`}
                    variant="text"
                    className="text-[13px]"
                  >
                    Fichas →
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="section" tone="soft" className="p-4" stagger={3}>
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
