export type SprintStatus = 'unknown' | 'ok' | 'attention' | 'critical'

export type Course = {
  id: string
  name: string
  code: string
  isCurrent: boolean
}

export type GroupSprint = {
  sprintNumber: number
  status: SprintStatus
}

export type GroupLinks = {
  githubUrl: string | null
  trelloUrl: string | null
  driveUrl: string | null
}

export type GroupSummary = {
  id: string
  number: number
  name: string | null
  projectTopic: string | null
  teacherName: string | null
  memberCount: number
  sprints: GroupSprint[]
  links: GroupLinks | null
}

export type GroupMember = {
  id: string
  fullName: string
  legajo: string | null
  email: string | null
}

export type GroupDetail = {
  id: string
  courseId: string
  course: {
    id: string
    name: string
    code: string
  }
  number: number
  name: string | null
  projectTopic: string | null
  teacherName: string | null
  sprints: GroupSprint[]
  members: GroupMember[]
  links: GroupLinks
}

export const SPRINT_STATUS_ORDER: SprintStatus[] = [
  'unknown',
  'ok',
  'attention',
  'critical',
]

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  unknown: 'Sin datos',
  ok: 'Ok',
  attention: 'Atención',
  critical: 'Crítico',
}

export function nextSprintStatus(current: SprintStatus): SprintStatus {
  const idx = SPRINT_STATUS_ORDER.indexOf(current)
  return SPRINT_STATUS_ORDER[(idx + 1) % SPRINT_STATUS_ORDER.length]
}
