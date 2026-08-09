import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  addGroupMember,
  fetchGroupDetail,
  fetchGroupSprintSheets,
  fetchUnassignedStudents,
  patchGroupLinks,
  patchGroupSprint,
  removeGroupMember,
} from '../api/client'
import { ButtonLink } from '../components/atoms/ButtonLink'
import { IconLink, IconSignal, IconUsers } from '../components/atoms/icons'
import { Panel } from '../components/atoms/Panel'
import { SheetStatusBadge } from '../components/atoms/SheetStatusBadge'
import { StatusBadge } from '../components/atoms/StatusBadge'
import { SectionTitle } from '../components/molecules/SectionTitle'
import { SprintTimeline } from '../components/molecules/SprintTimeline'
import { StateBox } from '../components/molecules/StateBox'
import { TutorAssigner } from '../components/molecules/TutorAssigner'
import { LinksEditor } from '../components/organisms/LinksEditor'
import { GroupNotesPanel } from '../components/organisms/GroupNotesPanel'
import { MembersList } from '../components/organisms/MembersList'
import { GroupDetailPageSkeleton } from '../components/organisms/PageSkeletons'
import { HeroActions } from '../components/molecules/HeroActions'
import { PageHero } from '../components/organisms/PageHero'
import { AppShell } from '../components/templates/AppShell'
import {
  currentSprint,
  linkedCount,
  overallSprintStatus,
  sprintProgress,
} from '../lib/sprintMeta'
import {
  type GroupDetail,
  type GroupLinks,
  type SheetStatus,
  type SprintStatus,
  type UnassignedStudent,
} from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; group: GroupDetail }

type SheetChip = {
  sprintNumber: number
  start: SheetStatus | null
  end: SheetStatus | null
}

export function GroupDetailPage() {
  const { groupId } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busy, setBusy] = useState(false)
  const [unassigned, setUnassigned] = useState<UnassignedStudent[]>([])
  const [sheetChips, setSheetChips] = useState<SheetChip[]>([])

  useEffect(() => {
    if (!groupId) {
      setState({ status: 'error', message: 'Falta el id del grupo' })
      return
    }

    let cancelled = false

    async function load() {
      try {
        const group = await fetchGroupDetail(groupId!)
        if (cancelled) return
        setState({ status: 'ready', group })
        try {
          const list = await fetchUnassignedStudents(group.courseId)
          if (!cancelled) setUnassigned(list)
        } catch {
          if (!cancelled) setUnassigned([])
        }

        const chips: SheetChip[] = []
        for (const n of [1, 2, 3, 4, 5]) {
          try {
            const sheets = await fetchGroupSprintSheets(groupId!, n)
            chips.push({
              sprintNumber: n,
              start: sheets.start?.status ?? null,
              end: sheets.end?.status ?? null,
            })
          } catch {
            chips.push({ sprintNumber: n, start: null, end: null })
          }
        }
        if (!cancelled) setSheetChips(chips)
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

  async function refreshUnassigned(courseId: string) {
    try {
      setUnassigned(await fetchUnassignedStudents(courseId))
    } catch {
      setUnassigned([])
    }
  }

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

  async function handleAddMember(studentId: string) {
    if (!groupId || state.status !== 'ready') return
    setBusy(true)
    try {
      const group = await addGroupMember(groupId, studentId)
      setState({ status: 'ready', group })
      await refreshUnassigned(group.courseId)
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo agregar al alumno',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveMember(studentId: string) {
    if (!groupId || state.status !== 'ready') return
    const ok = window.confirm('¿Sacar a este alumno del grupo?')
    if (!ok) return
    setBusy(true)
    try {
      const group = await removeGroupMember(groupId, studentId)
      setState({ status: 'ready', group })
      await refreshUnassigned(group.courseId)
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'No se pudo sacar al alumno',
      )
    } finally {
      setBusy(false)
    }
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
              value: `${group.members.length}/${group.capacity}`,
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
            <HeroActions
              primary={
                <ButtonLink
                  className="min-h-11 px-4 text-[14px]"
                  to={`/courses/${group.courseId}/attendance?groupId=${group.id}`}
                >
                  Tomar asistencia
                </ButtonLink>
              }
              more={
                <>
                  <ButtonLink
                    variant="ghost"
                    className="min-h-11"
                    to={`/courses/${group.courseId}/sprint-sheets?status=in_review`}
                  >
                    Fichas de sprint
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
            />
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

        {sheetChips.length > 0 ? (
          <Panel
            as="section"
            tone="soft"
            className="p-4 sm:p-5 lg:col-span-2"
          >
            <SectionTitle hint="Estado de fichas inicio / fin por sprint">
              Fichas de sprint
            </SectionTitle>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
              {sheetChips.map((chip) => (
                <li
                  key={chip.sprintNumber}
                  className="rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-[12px]"
                >
                  <span className="font-semibold text-fg">
                    S{chip.sprintNumber}
                  </span>
                  <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-fg-muted">
                    · Inicio:{' '}
                    {chip.start ? (
                      <SheetStatusBadge status={chip.start} />
                    ) : (
                      '—'
                    )}
                    · Fin:{' '}
                    {chip.end ? (
                      <SheetStatusBadge status={chip.end} />
                    ) : (
                      '—'
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

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
            hint={`${group.members.length}/${group.capacity} · el docente puede forzar altas/bajas`}
          >
            Integrantes
          </SectionTitle>
          <MembersList
            members={group.members}
            capacity={group.capacity}
            unassigned={unassigned}
            busy={busy}
            profileBasePath={`/courses/${group.courseId}/groups/${group.id}/students`}
            onAdd={(id) => void handleAddMember(id)}
            onRemove={(id) => void handleRemoveMember(id)}
          />
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

        <Panel
          as="section"
          tone="default"
          stagger={4}
          className="p-4 sm:p-5 lg:col-span-2"
        >
          <GroupNotesPanel groupId={group.id} disabled={busy} />
        </Panel>
      </article>
    </AppShell>
  )
}
