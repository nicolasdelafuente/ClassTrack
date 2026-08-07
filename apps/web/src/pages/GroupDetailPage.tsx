import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchGroupDetail,
  patchGroupLinks,
  patchGroupSprint,
} from '../api/client'
import { Badge } from '../components/atoms/Badge'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { Panel } from '../components/atoms/Panel'
import { Heading, Text } from '../components/atoms/Text'
import { EditableSprintLights } from '../components/molecules/EditableSprintLights'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { LinksEditor } from '../components/organisms/LinksEditor'
import { MembersList } from '../components/organisms/MembersList'
import { AppShell } from '../components/templates/AppShell'
import type { GroupDetail, GroupLinks, SprintStatus } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; group: GroupDetail }

export function GroupDetailPage() {
  const { groupId } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!groupId) {
      setState({ status: 'error', message: 'Falta el id del grupo' })
      return
    }

    let cancelled = false

    async function load() {
      try {
        const group = await fetchGroupDetail(groupId!)
        if (!cancelled) setState({ status: 'ready', group })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error ? err.message : 'No se pudo cargar el grupo',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [groupId])

  async function handleCycleSprint(sprintNumber: number, next: SprintStatus) {
    if (!groupId || state.status !== 'ready') return
    setBusy(true)
    try {
      const updated = await patchGroupSprint(groupId, sprintNumber, next)
      setState({
        status: 'ready',
        group: {
          ...state.group,
          sprints: state.group.sprints.map((s) =>
            s.sprintNumber === updated.sprintNumber ? updated : s,
          ),
        },
      })
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo actualizar el sprint',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveLinks(links: GroupLinks) {
    if (!groupId || state.status !== 'ready') return
    const saved = await patchGroupLinks(groupId, links)
    setState({
      status: 'ready',
      group: { ...state.group, links: saved },
    })
  }

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <StateMessage>Cargando grupo…</StateMessage>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <StateBox title="No se pudo abrir el grupo" message={state.message} />
      </AppShell>
    )
  }

  const { group } = state
  const title = group.name?.trim() || `Grupo ${group.number}`

  return (
    <AppShell
      showBack
      courseName={group.course.name}
      courseCode={group.course.code}
    >
      <article className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <Panel as="header" className="p-4 lg:col-span-2">
          <Badge>G{group.number}</Badge>
          <Heading className="mt-2">{title}</Heading>
          <Text className="mt-1.5">
            {group.projectTopic?.trim() || 'Sin tema cargado'}
          </Text>
          <Text className="mt-3" muted={false}>
            Docente a cargo:{' '}
            <strong className="font-semibold text-fg">
              {group.teacherName?.trim() || '—'}
            </strong>
          </Text>
        </Panel>

        <Panel as="section" className="p-4">
          <Heading as="h2">Semáforo</Heading>
          <Text faint className="mb-3 mt-1 text-xs">
            Tocá un sprint para cambiar el estado.
          </Text>
          <EditableSprintLights
            sprints={group.sprints}
            disabled={busy}
            onCycle={(n, next) => void handleCycleSprint(n, next)}
          />
        </Panel>

        <Panel as="section" className="p-4 lg:row-span-2">
          <Heading as="h2">Integrantes ({group.members.length})</Heading>
          <div className="mt-3">
            <MembersList members={group.members} />
          </div>
        </Panel>

        <Panel as="section" className="p-4">
          <Heading as="h2">Links</Heading>
          <Text faint className="mb-3 mt-1 text-xs">
            URLs manuales (sin sync). Guardá después de editar.
          </Text>
          <LinksEditor
            links={group.links}
            disabled={busy}
            onSave={handleSaveLinks}
          />
        </Panel>

        <Panel as="section" className="p-4 lg:col-start-2">
          <Heading as="h2">Acciones</Heading>
          <div className="mt-3">
            <ButtonLink
              to={`/courses/${group.courseId}/attendance?groupId=${group.id}`}
            >
              Tomar asistencia de este grupo
            </ButtonLink>
          </div>
        </Panel>
      </article>
    </AppShell>
  )
}
