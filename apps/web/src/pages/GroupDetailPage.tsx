import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  fetchGroupDetail,
  patchGroupLinks,
  patchGroupSprint,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { IconLink, IconSignal, IconUsers } from '../components/atoms/icons'
import { Panel } from '../components/atoms/Panel'
import { EditableSprintLights } from '../components/molecules/EditableSprintLights'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { StateBox, StateMessage } from '../components/molecules/StateBox'
import { LinksEditor } from '../components/organisms/LinksEditor'
import { MembersList } from '../components/organisms/MembersList'
import { AppShell } from '../components/templates/AppShell'
import {
  SPRINT_STATUS_LABELS,
  type GroupDetail,
  type GroupLinks,
  type SprintStatus,
} from '../types'
import { cn } from '../lib/cn'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; group: GroupDetail }

function overallStatus(sprints: GroupDetail['sprints']): SprintStatus {
  if (sprints.some((s) => s.status === 'critical')) return 'critical'
  if (sprints.some((s) => s.status === 'attention')) return 'attention'
  if (sprints.every((s) => s.status === 'ok')) return 'ok'
  return 'unknown'
}

const statusTone: Record<SprintStatus, string> = {
  ok: 'bg-ok-soft text-ok',
  attention: 'bg-attention-soft text-attention',
  critical: 'bg-critical-soft text-critical',
  unknown: 'bg-surface-2 text-fg-muted',
}

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

  const summary = useMemo(() => {
    if (state.status !== 'ready') return null
    const { group } = state
    const linked = [group.links.githubUrl, group.links.trelloUrl, group.links.driveUrl].filter(
      Boolean,
    ).length
    const currentSprint =
      [...group.sprints].sort((a, b) => b.sprintNumber - a.sprintNumber).find(
        (s) => s.status !== 'unknown',
      ) ?? group.sprints[group.sprints.length - 1]
    return {
      linked,
      overall: overallStatus(group.sprints),
      currentSprint,
    }
  }, [state])

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
      <article className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        {/* Hero workspace */}
        <Panel as="header" tone="elevated" className="p-5 lg:col-span-2 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-wide text-fg-faint">
                Workspace del grupo
              </p>
              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-fg sm:text-[32px]">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] text-fg-muted text-pretty">
                {group.projectTopic?.trim() || 'Sin tema cargado'}
              </p>
            </div>
            {summary ? (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-semibold',
                  statusTone[summary.overall],
                )}
              >
                {SPRINT_STATUS_LABELS[summary.overall]}
                {summary.currentSprint
                  ? ` · Sprint ${summary.currentSprint.sprintNumber}`
                  : ''}
              </span>
            ) : null}
          </div>

          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-fg-muted">
            <div>
              <dt className="sr-only">Docente</dt>
              <dd className="m-0">
                <span className="text-fg-faint">Docente · </span>
                <span className="font-medium text-fg">
                  {group.teacherName?.trim() || '—'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Integrantes</dt>
              <dd className="m-0">
                <span className="text-fg-faint">Integrantes · </span>
                <span className="font-medium tabular-nums text-fg">
                  {group.members.length}
                </span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Links</dt>
              <dd className="m-0">
                <span className="text-fg-faint">Links · </span>
                <span className="font-medium tabular-nums text-fg">
                  {summary?.linked ?? 0}/3
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink
              className="min-h-11 px-4 text-[14px]"
              to={`/courses/${group.courseId}/attendance?groupId=${group.id}`}
            >
              Tomar asistencia
            </ButtonLink>
            {group.links.trelloUrl ? (
              <ButtonLink
                external
                variant="ghost"
                className="min-h-11"
                href={group.links.trelloUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver Trello
              </ButtonLink>
            ) : null}
            {group.links.githubUrl ? (
              <ButtonLink
                external
                variant="ghost"
                className="min-h-11"
                href={group.links.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver GitHub
              </ButtonLink>
            ) : null}
          </div>
        </Panel>

        <Panel as="section" tone="default" className="p-4 sm:p-5">
          <SectionTitle
            icon={<IconSignal className="text-fg-muted" />}
            hint="Tocá un sprint para cambiar el estado."
          >
            Semáforo
          </SectionTitle>
          <EditableSprintLights
            sprints={group.sprints}
            disabled={busy}
            onCycle={(n, next) => void handleCycleSprint(n, next)}
          />
        </Panel>

        <Panel as="section" tone="default" className="p-4 sm:p-5 lg:row-span-2">
          <SectionTitle
            icon={<IconUsers className="text-fg-muted" />}
            hint={`${group.members.length} personas en el equipo`}
          >
            Integrantes
          </SectionTitle>
          <MembersList members={group.members} />
        </Panel>

        <Panel as="section" tone="soft" className="p-4 sm:p-5">
          <SectionTitle
            icon={<IconLink className="text-fg-muted" />}
            hint="Recursos del equipo (URLs manuales)"
          >
            Recursos
          </SectionTitle>
          <LinksEditor
            links={group.links}
            disabled={busy}
            onSave={handleSaveLinks}
          />
        </Panel>
      </article>
    </AppShell>
  )
}
