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

export type AttendanceStudent = {
  id: string
  fullName: string
  legajo: string | null
  email: string | null
  present: boolean
  participated: boolean
}

export type AttendanceGroup = {
  id: string
  number: number
  name: string | null
  students: AttendanceStudent[]
}

export type AttendanceRoster = {
  course: {
    id: string
    name: string
    code: string
  }
  date: string
  groupId: string | null
  groups: AttendanceGroup[]
}

export type AttendanceMark = {
  studentId: string
  date: string
  present: boolean
  participated: boolean
}

export function todayDateInputValue(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
