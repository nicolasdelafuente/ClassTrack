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
import { StatusBadge } from '../components/atoms/StatusBadge'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { SprintTimeline } from '../components/molecules/SprintTimeline'
import { StateBox } from '../components/molecules/StateBox'
import { TutorAssigner } from '../components/molecules/TutorAssigner'
import { LinksEditor } from '../components/organisms/LinksEditor'
import { MembersList } from '../components/organisms/MembersList'
import { GroupDetailPageSkeleton } from '../components/organisms/PageSkeletons'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import {
  currentSprint,
  linkedCount,
  overallSprintStatus,
  sprintProgress,
} from '../lib/sprintMeta'
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

  const summary = useMemo(() => {
    if (state.status !== 'ready') return null
    const { group } = state
    const overall = overallSprintStatus(group.sprints)
    const current = currentSprint(group.sprints)
    const progress = sprintProgress(group.sprints)
    return {
      overall,
      current,
      progress,
      linked: linkedCount(group.links),
    }
  }, [state])

  if (state.status === 'loading') {
    return (
      <AppShell showBack>
        <GroupDetailPageSkeleton />
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
        <PageHero
          className="lg:col-span-2"
          eyebrow="Workspace del grupo"
          title={title}
          description={group.projectTopic?.trim() || 'Sin tema cargado'}
          badge={
            summary ? (
              <StatusBadge status={summary.overall} pulseCritical />
            ) : null
          }
          stats={[
            {
              label: 'Docente',
              value:
                group.tutor?.displayName?.trim() ||
                group.teacherName?.trim() ||
                '—',
            },
            {
              label: 'Integrantes',
              value: group.members.length,
            },
            {
              label: 'Links',
              value: `${summary?.linked ?? 0}/3`,
            },
            {
              label: 'Sprint',
              value: summary?.current
                ? `S${summary.current.sprintNumber}`
                : '—',
            },
          ]}
          actions={
            <>
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
            </>
          }
          footer={
            summary ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] font-medium text-fg-faint">
                  <span>Progreso de sprints (Ok)</span>
                  <span className="tabular-nums text-fg">
                    {summary.progress.ok}/{summary.progress.total}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-valuenow={Math.round(summary.progress.ratio * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Porcentaje de sprints en Ok"
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
                    style={{ width: `${summary.progress.ratio * 100}%` }}
                  />
                </div>
              </div>
            ) : null
          }
        />

        <Panel as="section" tone="default" stagger={2} className="p-4 sm:p-5">
          <SectionTitle
            hint="Asigná tu tutoría o la de otro docente registrado."
          >
            Tutoría
          </SectionTitle>
          <TutorAssigner
            groupId={group.id}
            tutorUserId={group.tutorUserId}
            teacherName={group.teacherName}
            disabled={busy}
            onSaved={(next) => {
              setState({
                status: 'ready',
                group: {
                  ...group,
                  tutorUserId: next.tutorUserId,
                  teacherName: next.teacherName,
                  tutor: next.tutor,
                },
              })
            }}
          />
        </Panel>

        <Panel as="section" tone="default" stagger={2} className="p-4 sm:p-5">
          <SectionTitle
            icon={<IconSignal className="text-fg-muted" />}
            hint="Timeline de sprints — tocá un nodo para cambiar el estado."
          >
            Semáforo
          </SectionTitle>
          <SprintTimeline
            sprints={group.sprints}
            disabled={busy}
            onCycle={(n, next) => void handleCycleSprint(n, next)}
          />
        </Panel>

        <Panel
          as="section"
          tone="default"
          stagger={3}
          className="p-4 sm:p-5 lg:row-span-2"
        >
          <SectionTitle
            icon={<IconUsers className="text-fg-muted" />}
            hint={`${group.members.length} personas en el equipo`}
          >
            Integrantes
          </SectionTitle>
          <MembersList members={group.members} />
        </Panel>

        <Panel as="section" tone="soft" stagger={4} className="p-4 sm:p-5">
          <SectionTitle
            icon={<IconLink className="text-fg-muted" />}
            hint="Recursos del equipo"
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
