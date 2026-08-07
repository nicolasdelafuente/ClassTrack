import {
  SPRINT_STATUS_LABELS,
  type GroupSprint,
  type SprintStatus,
} from '../types'

export function overallSprintStatus(sprints: GroupSprint[]): SprintStatus {
  if (sprints.some((s) => s.status === 'critical')) return 'critical'
  if (sprints.some((s) => s.status === 'attention')) return 'attention'
  if (sprints.length > 0 && sprints.every((s) => s.status === 'ok')) return 'ok'
  return 'unknown'
}

export function currentSprint(sprints: GroupSprint[]): GroupSprint | undefined {
  const ordered = [...sprints].sort((a, b) => b.sprintNumber - a.sprintNumber)
  return ordered.find((s) => s.status !== 'unknown') ?? ordered[0]
}

export function sprintProgress(sprints: GroupSprint[]) {
  const total = sprints.length
  const ok = sprints.filter((s) => s.status === 'ok').length
  return { ok, total, ratio: total === 0 ? 0 : ok / total }
}

export function linkedCount(links: {
  githubUrl: string | null
  trelloUrl: string | null
  driveUrl: string | null
} | null | undefined) {
  if (!links) return 0
  return [links.githubUrl, links.trelloUrl, links.driveUrl].filter(Boolean)
    .length
}

export function statusLabel(status: SprintStatus) {
  return SPRINT_STATUS_LABELS[status]
}
