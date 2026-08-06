import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchGroupDetail,
  patchGroupLinks,
  patchGroupSprint,
} from '../api/client'
import { AppShell } from '../components/AppShell'
import { EditableSprintLights } from '../components/EditableSprintLights'
import { LinksEditor } from '../components/LinksEditor'
import { MembersList } from '../components/MembersList'
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
        <p className="state-msg">Cargando grupo…</p>
      </AppShell>
    )
  }

  if (state.status === 'error') {
    return (
      <AppShell showBack>
        <div className="state-box" role="alert">
          <h1>No se pudo abrir el grupo</h1>
          <p>{state.message}</p>
        </div>
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
      <article className="detail">
        <header className="detail__header">
          <span className="group-card__number">G{group.number}</span>
          <h1 className="detail__title">{title}</h1>
          <p className="detail__topic">
            {group.projectTopic?.trim() || 'Sin tema cargado'}
          </p>
          <p className="detail__teacher">
            Docente a cargo:{' '}
            <strong>{group.teacherName?.trim() || '—'}</strong>
          </p>
        </header>

        <section className="detail__section">
          <h2>Semáforo</h2>
          <p className="detail__hint">Tocá un sprint para cambiar el estado.</p>
          <EditableSprintLights
            sprints={group.sprints}
            disabled={busy}
            onCycle={(n, next) => void handleCycleSprint(n, next)}
          />
        </section>

        <section className="detail__section">
          <h2>Integrantes ({group.members.length})</h2>
          <MembersList members={group.members} />
        </section>

        <section className="detail__section">
          <h2>Links</h2>
          <p className="detail__hint">
            URLs manuales (sin sync). Guardá después de editar.
          </p>
          <LinksEditor
            links={group.links}
            disabled={busy}
            onSave={handleSaveLinks}
          />
        </section>

        <section className="detail__section">
          <h2>Acciones</h2>
          <button type="button" className="btn btn--ghost" disabled title="CT-013">
            Tomar asistencia de este grupo (próximo: CT-013)
          </button>
        </section>
      </article>
    </AppShell>
  )
}
