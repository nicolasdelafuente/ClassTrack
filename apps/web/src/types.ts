export type SprintStatus = 'unknown' | 'ok' | 'attention' | 'critical'

/** teacher = docente, student = alumno (CT-039). */
export type UserRole = 'teacher' | 'student'

/** Logged-in account (MVP auth). No token; stored in localStorage. */
export type AuthUser = {
  id: string
  email: string
  displayName: string | null
  role: UserRole
}

export type Course = {
  id: string
  name: string
  code: string
  isCurrent: boolean
  /** Students may join/leave groups when true (CT-045). */
  groupEnrollmentOpen?: boolean
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
  capacity: number
  memberCount: number
  spotsLeft: number
  /** Roster preview for the board (CT-054). */
  members: GroupMember[]
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
  capacity: number
  teacherName: string | null
  tutorUserId: string | null
  tutor: {
    id: string
    email: string
    displayName: string | null
  } | null
  sprints: GroupSprint[]
  members: GroupMember[]
  links: GroupLinks
}

/** Student view of groups for enrollment (CT-045). */
export type StudentGroupEnrollment = {
  course: {
    id: string
    name: string
    code: string
    groupEnrollmentOpen: boolean
  }
  myGroup: {
    id: string
    number: number
    name: string | null
  } | null
  groups: {
    id: string
    number: number
    name: string | null
    capacity: number
    memberCount: number
    spotsLeft: number
    isMine: boolean
  }[]
}

export type UnassignedStudent = {
  id: string
  fullName: string
  legajo: string | null
  email: string | null
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

/** Teacher view: student profile + attendance history in a course. */
export type CourseStudentProfile = {
  student: {
    id: string
    fullName: string
    legajo: string | null
    email: string | null
  }
  account: {
    displayName: string | null
    email: string
  } | null
  group: {
    id: string
    number: number
    name: string | null
  }
  course: {
    id: string
    name: string
    code: string
    maxAbsencesAllowed: number
  }
  attendance: {
    totalClasses: number
    present: number
    absent: number
    participationCount: number
    absenceCount: number
    maxAbsencesAllowed: number
    isLibre: boolean
    presentRate: number
    sessions: CourseStudentAttendanceSession[]
  }
}

export type CourseStudentAttendanceSession = {
  sessionId: string
  date: string
  title: string
  isMandatory: boolean
  present: boolean
  participated: boolean
  recorded: boolean
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

/** Sprint sheet categories (CT-046). */
export type TaskCategory =
  | 'backend'
  | 'frontend'
  | 'documentation'
  | 'testing'
  | 'devops'
  | 'design'
  | 'other'

export const TASK_CATEGORIES: TaskCategory[] = [
  'backend',
  'frontend',
  'documentation',
  'testing',
  'devops',
  'design',
  'other',
]

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  documentation: 'Documentación',
  testing: 'Testing',
  devops: 'DevOps / Deploy',
  design: 'Diseño / UX',
  other: 'Otro',
}

export type SheetKind = 'start' | 'end'
export type SheetStatus = 'draft' | 'in_review' | 'needs_changes' | 'approved'

export const SHEET_STATUS_LABELS: Record<SheetStatus, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  needs_changes: 'Cambios pedidos',
  approved: 'Aprobada',
}

export type SprintSheetTask = {
  id: string
  /** Optional tags (0..n) from TASK_CATEGORIES (CT-069). */
  categories: TaskCategory[]
  title: string
  description: string | null
  completed: boolean | null
  incompleteReason: string | null
  isExtra: boolean
  extraReason: string | null
  sourceTaskId: string | null
  /** Optional Trello card URLs related to this task (CT-058). */
  trelloLinks: string[]
  sortOrder: number
}

export type SprintSheetComment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    displayName: string | null
    email: string
  }
}

export type SprintSheet = {
  id: string
  groupId: string
  sprintNumber: number
  kind: SheetKind
  status: SheetStatus
  submittedAt: string | null
  approvedAt: string | null
  updatedAt: string
  tasks: SprintSheetTask[]
  comments: SprintSheetComment[]
}

export type SprintSheetOverview = {
  groupId: string
  sprints: {
    sprintNumber: number
    start: { id: string; status: SheetStatus } | null
    end: { id: string; status: SheetStatus } | null
  }[]
}

export type StudentMyGroup = {
  group: {
    id: string
    number: number
    name: string | null
    courseId: string
    course: { id: string; name: string; code: string }
  } | null
}

export type CourseSprintSheetSummary = {
  id: string
  kind: SheetKind
  status: SheetStatus
  sprintNumber: number
  submittedAt: string | null
  approvedAt: string | null
  taskCount: number
  commentCount: number
  group: { id: string; number: number; name: string | null }
}

/** Teacher follow-up note on a group (CT-049 / CT-050). */
export type GroupNoteAttachment = {
  id: string
  noteId: string
  /** Path under the API host, e.g. /api/uploads/group-notes/…. */
  url: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy: {
    id: string
    displayName: string | null
    email: string
    label: string
  }
}

export type GroupNote = {
  id: string
  groupId: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    displayName: string | null
    email: string
    label: string
  }
  attachments: GroupNoteAttachment[]
}

/**
 * Preset titles for the note form. Value "" means “custom / free title”.
 * The API always stores the final display string in `title`.
 */
export const GROUP_NOTE_TITLE_PRESETS: { value: string; label: string }[] = [
  { value: 'Sprint 1', label: 'Sprint 1' },
  { value: 'Sprint 2', label: 'Sprint 2' },
  { value: 'Sprint 3', label: 'Sprint 3' },
  { value: 'Sprint 4', label: 'Sprint 4' },
  { value: 'Sprint 5', label: 'Sprint 5' },
  { value: 'Seguimiento sprint 1', label: 'Seguimiento sprint 1' },
  { value: 'Seguimiento sprint 2', label: 'Seguimiento sprint 2' },
  { value: 'Seguimiento sprint 3', label: 'Seguimiento sprint 3' },
  { value: 'Seguimiento sprint 4', label: 'Seguimiento sprint 4' },
  { value: 'Seguimiento sprint 5', label: 'Seguimiento sprint 5' },
  { value: 'Presentación de medio término', label: 'Presentación de medio término' },
  { value: 'Presentación final', label: 'Presentación final' },
  { value: '', label: 'Título libre…' },
]
