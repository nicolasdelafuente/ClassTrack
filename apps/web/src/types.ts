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
  /** Absences on mandatory classes only (CT-030). */
  absenceCount: number
  maxAbsencesAllowed: number
  /** true when absenceCount > maxAbsencesAllowed (e.g. 5th falta if max is 4). */
  isLibre: boolean
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
    maxAbsencesAllowed: number
  }
  date: string
  groupId: string | null
  session: {
    id: string
    date: string
    isMandatory: boolean
    allowsAttendance: boolean
    mandatorySource: 'derived' | 'manual'
  }
  groups: AttendanceGroup[]
}

export type AttendanceMark = {
  studentId: string
  date: string
  present: boolean
  participated: boolean
  absenceCount: number
  maxAbsencesAllowed: number
  isLibre: boolean
}

export type ClassActivityType =
  | 'feriado'
  | 'sprint_planning'
  | 'sprint_review'
  | 'seguimiento'
  | 'teorica'
  | 'presentacion_medio'
  | 'presentacion_final'

export type MandatorySource = 'derived' | 'manual'

export type ScheduleItem = {
  id: string
  title: string
  sortOrder: number
  activityType: ClassActivityType
  isMandatory: boolean
}

export type ScheduleSession = {
  id: string
  date: string
  isMandatory: boolean
  mandatorySource: MandatorySource
  allowsAttendance: boolean
  items: ScheduleItem[]
}

export type ActivityTypeDefault = {
  activityType: ClassActivityType
  isMandatoryByDefault: boolean
  allowsAttendance: boolean
}

export type CourseSchedule = {
  course: {
    id: string
    name: string
    code: string
    maxAbsencesAllowed: number
  }
  activityTypeDefaults: ActivityTypeDefault[]
  sessions: ScheduleSession[]
}

export const CLASS_ACTIVITY_TYPE_LABELS: Record<ClassActivityType, string> = {
  feriado: 'Feriado',
  sprint_planning: 'Sprint planning',
  sprint_review: 'Sprint review',
  seguimiento: 'Seguimiento',
  teorica: 'Teórica',
  presentacion_medio: 'Presentación medio término',
  presentacion_final: 'Presentación final',
}

export function todayDateInputValue(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
