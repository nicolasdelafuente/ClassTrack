import type {
  AttendanceMark,
  AttendanceRoster,
  AuthUser,
  ClassActivityType,
  Course,
  CourseSchedule,
  GroupDetail,
  GroupLinks,
  GroupSprint,
  GroupSummary,
  ScheduleSession,
  SprintStatus,
  ActivityTypeDefault,
  StudentGroupEnrollment,
  UnassignedStudent,
  SprintSheet,
  SprintSheetOverview,
  StudentMyGroup,
  CourseSprintSheetSummary,
  TaskCategory,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

/** MVP identity for /me endpoints (client-side auth). */
let apiUserId: string | null = null

export function setApiUserId(userId: string | null) {
  apiUserId = userId
}

/** Parse Nest/HTTP error bodies without leaking raw stacks to the UI. */
function messageFromErrorBody(body: string, status: number, path: string): string {
  if (!body) return `Error ${status} en ${path}`
  try {
    const parsed = JSON.parse(body) as {
      message?: string | string[]
      error?: string
    }
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' · ')
    }
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message
    }
  } catch {
    // not JSON
  }
  if (body.length > 280) {
    return `Error ${status} en ${path}`
  }
  return body
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (apiUserId) {
    headers['X-User-Id'] = apiUserId
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(messageFromErrorBody(body, res.status, path))
  }
  return res.json() as Promise<T>
}

export type CurrentBoard = {
  course: Course
  groups: GroupSummary[]
}

export function fetchCurrentBoard() {
  return requestJson<CurrentBoard>('/courses/current/board')
}

export function fetchCurrentCourse() {
  return requestJson<Course>('/courses/current')
}

export function fetchCourseGroups(courseId: string) {
  return requestJson<GroupSummary[]>(`/courses/${courseId}/groups`)
}

export function fetchGroupDetail(groupId: string) {
  return requestJson<GroupDetail>(`/groups/${groupId}`)
}

export function patchGroupSprint(
  groupId: string,
  sprintNumber: number,
  status: SprintStatus,
) {
  return requestJson<GroupSprint>(`/groups/${groupId}/sprints/${sprintNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function patchGroupLinks(groupId: string, links: GroupLinks) {
  return requestJson<GroupLinks>(`/groups/${groupId}/links`, {
    method: 'PATCH',
    body: JSON.stringify(links),
  })
}

export type TeacherOption = {
  id: string
  email: string
  displayName: string | null
}

export function fetchTeachers() {
  return requestJson<TeacherOption[]>('/auth/teachers')
}

export function patchGroupTutor(groupId: string, tutorUserId: string | null) {
  return requestJson<{
    tutorUserId: string | null
    teacherName: string | null
    tutor: TeacherOption | null
  }>(`/groups/${groupId}/tutor`, {
    method: 'PATCH',
    body: JSON.stringify({ tutorUserId }),
  })
}

export function fetchAttendanceRoster(
  courseId: string,
  date: string,
  groupId?: string | null,
) {
  const params = new URLSearchParams({ date })
  if (groupId) params.set('groupId', groupId)
  return requestJson<AttendanceRoster>(
    `/courses/${courseId}/attendance?${params.toString()}`,
  )
}

export function patchAttendanceMark(
  courseId: string,
  payload: {
    date: string
    studentId: string
    present?: boolean
    participated?: boolean
  },
) {
  return requestJson<AttendanceMark>(`/courses/${courseId}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function fetchCourseSchedule(courseId: string) {
  return requestJson<CourseSchedule>(`/courses/${courseId}/schedule`)
}

export function patchScheduleSession(
  courseId: string,
  sessionId: string,
  body: {
    isMandatory?: boolean
    useDerivedMandatory?: boolean
    date?: string
  },
) {
  return requestJson<ScheduleSession>(
    `/courses/${courseId}/schedule/sessions/${sessionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export function createScheduleSession(
  courseId: string,
  body: {
    date: string
    items: Array<{
      title: string
      activityType: ClassActivityType
      isMandatory?: boolean
    }>
    isMandatory?: boolean
  },
) {
  return requestJson<ScheduleSession>(
    `/courses/${courseId}/schedule/sessions`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function deleteScheduleSession(courseId: string, sessionId: string) {
  return requestJson<{ ok: boolean }>(
    `/courses/${courseId}/schedule/sessions/${sessionId}`,
    { method: 'DELETE' },
  )
}

export function createScheduleItem(
  courseId: string,
  sessionId: string,
  body: {
    title: string
    activityType: ClassActivityType
    isMandatory?: boolean
    sortOrder?: number
  },
) {
  return requestJson<ScheduleSession>(
    `/courses/${courseId}/schedule/sessions/${sessionId}/items`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function patchScheduleItem(
  courseId: string,
  sessionId: string,
  itemId: string,
  body: {
    title?: string
    activityType?: ClassActivityType
    isMandatory?: boolean
    sortOrder?: number
  },
) {
  return requestJson<ScheduleSession>(
    `/courses/${courseId}/schedule/sessions/${sessionId}/items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export function deleteScheduleItem(
  courseId: string,
  sessionId: string,
  itemId: string,
) {
  return requestJson<ScheduleSession>(
    `/courses/${courseId}/schedule/sessions/${sessionId}/items/${itemId}`,
    { method: 'DELETE' },
  )
}

export function patchSchedulePolicy(
  courseId: string,
  body: {
    maxAbsencesAllowed?: number
    activityTypeDefaults?: ActivityTypeDefault[]
  },
) {
  return requestJson<{
    courseId: string
    maxAbsencesAllowed: number
    activityTypeDefaults: ActivityTypeDefault[]
  }>(`/courses/${courseId}/schedule/policy`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export type DuplicateCourseResult = {
  course: Course & { maxAbsencesAllowed?: number }
  meta: {
    sourceCourseId: string
    sessionsCopied: number
    groupsCopied: number
    dayOffset: number
    firstSessionDate: string
  }
}

export function duplicateCourse(
  courseId: string,
  body: {
    name: string
    code: string
    firstSessionDate: string
    setAsCurrent?: boolean
    copyEmptyGroups?: boolean
  },
) {
  return requestJson<DuplicateCourseResult>(
    `/courses/${courseId}/duplicate`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function registerUser(body: {
  token: string
  password: string
  displayName?: string
}) {
  return requestJson<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function loginUser(body: { email: string; password: string }) {
  return requestJson<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type InvitePreview = {
  email: string
  role: 'teacher' | 'student'
  expiresAt: string
  courseName: string | null
}

export function fetchInvitePreview(token: string) {
  return requestJson<InvitePreview>(
    `/auth/invites/${encodeURIComponent(token)}`,
  )
}

export type InviteCandidate = {
  studentId: string
  fullName: string
  email: string
  legajo: string | null
  group: { id: string; number: number; name: string | null }
  alreadyRegistered: boolean
  invitePending: boolean
}

export function fetchInviteCandidates(courseId: string) {
  return requestJson<InviteCandidate[]>(
    `/courses/${courseId}/invite-candidates`,
  )
}

export type CreateInviteResult = {
  inviteId: string
  email: string
  role: 'teacher' | 'student'
  inviteUrl: string
  emailed: boolean
  expiresAt: string
}

export function createInvite(
  courseId: string,
  body: { email: string; role: 'teacher' | 'student' },
) {
  return requestJson<CreateInviteResult>(`/courses/${courseId}/invites`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type EmailAudience = 'all' | 'group' | 'student'

export type EmailRecipient = {
  studentId: string | null
  email: string
  fullName: string
  groupNumber: number | null
}

export function fetchEmailRecipients(
  courseId: string,
  params: {
    audience: EmailAudience
    groupId?: string
    studentId?: string
  },
) {
  const q = new URLSearchParams({ audience: params.audience })
  if (params.groupId) q.set('groupId', params.groupId)
  if (params.studentId) q.set('studentId', params.studentId)
  return requestJson<{ total: number; recipients: EmailRecipient[] }>(
    `/courses/${courseId}/email-recipients?${q.toString()}`,
  )
}

export type BroadcastEmailResult = {
  total: number
  sent: number
  failed: number
  emailed: boolean
  reason: string | null
  recipientsPreview: string[]
}

export function sendCourseEmail(
  courseId: string,
  body: {
    subject: string
    body: string
    audience: EmailAudience
    groupId?: string
    studentId?: string
  },
) {
  return requestJson<BroadcastEmailResult>(
    `/courses/${courseId}/emails/broadcast`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function patchGroupEnrollment(courseId: string, open: boolean) {
  return requestJson<{ id: string; groupEnrollmentOpen: boolean }>(
    `/courses/${courseId}/group-enrollment`,
    {
      method: 'PATCH',
      body: JSON.stringify({ open }),
    },
  )
}

export type GroupStructureBatch = { count: number; capacity: number }

export function createGroupStructure(
  courseId: string,
  batches: GroupStructureBatch[],
) {
  return requestJson<{
    groups: { id: string; number: number; capacity: number }[]
    meta: { groupCount: number; totalSpots: number }
  }>(`/courses/${courseId}/groups/structure`, {
    method: 'POST',
    body: JSON.stringify({ batches }),
  })
}

export function fetchUnassignedStudents(courseId: string) {
  return requestJson<UnassignedStudent[]>(
    `/courses/${courseId}/unassigned-students`,
  )
}

export function addGroupMember(groupId: string, studentId: string) {
  return requestJson<GroupDetail>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  })
}

export function removeGroupMember(groupId: string, studentId: string) {
  return requestJson<GroupDetail>(
    `/groups/${groupId}/members/${studentId}`,
    { method: 'DELETE' },
  )
}

export function fetchMyCourseGroups(courseId: string) {
  return requestJson<StudentGroupEnrollment>(
    `/me/courses/${courseId}/groups`,
  )
}

export function joinGroupAsStudent(groupId: string) {
  return requestJson<StudentGroupEnrollment>(`/me/groups/${groupId}/join`, {
    method: 'POST',
  })
}

export function leaveGroupAsStudent(groupId: string, reason: string) {
  return requestJson<StudentGroupEnrollment>(`/me/groups/${groupId}/leave`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// ── Sprint sheets (CT-046) ─────────────────────────────────

export function fetchMyGroup(courseId?: string) {
  const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''
  return requestJson<StudentMyGroup>(`/me/my-group${q}`)
}

export function fetchStudentSprintOverview(groupId: string) {
  return requestJson<SprintSheetOverview>(
    `/me/groups/${groupId}/sprint-sheets`,
  )
}

export function fetchStudentSprintSheets(
  groupId: string,
  sprintNumber: number,
) {
  return requestJson<{
    group: {
      id: string
      number: number
      name: string | null
      courseId: string
    }
    sprintNumber: number
    start: SprintSheet | null
    end: SprintSheet | null
  }>(`/me/groups/${groupId}/sprints/${sprintNumber}/sheets`)
}

export function createStartSheet(groupId: string, sprintNumber: number) {
  return requestJson<{ group: unknown; sheet: SprintSheet }>(
    `/me/groups/${groupId}/sprints/${sprintNumber}/sheets/start`,
    { method: 'POST' },
  )
}

export function createEndSheet(groupId: string, sprintNumber: number) {
  return requestJson<{ group: unknown; sheet: SprintSheet }>(
    `/me/groups/${groupId}/sprints/${sprintNumber}/sheets/end`,
    { method: 'POST' },
  )
}

export function saveSheetTasks(
  sheetId: string,
  tasks: Array<{
    category: TaskCategory
    title: string
    description?: string | null
    completed?: boolean | null
    incompleteReason?: string | null
    isExtra?: boolean
    extraReason?: string | null
    sourceTaskId?: string | null
    sortOrder?: number
  }>,
) {
  return requestJson<{ group: unknown; sheet: SprintSheet }>(
    `/me/sheets/${sheetId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ tasks }),
    },
  )
}

export function submitSheet(sheetId: string) {
  return requestJson<SprintSheet>(`/me/sheets/${sheetId}/submit`, {
    method: 'POST',
  })
}

export function fetchCourseSprintSheets(
  courseId: string,
  params?: { sprint?: number; status?: string },
) {
  const q = new URLSearchParams()
  if (params?.sprint != null) q.set('sprint', String(params.sprint))
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return requestJson<CourseSprintSheetSummary[]>(
    `/courses/${courseId}/sprint-sheets${qs ? `?${qs}` : ''}`,
  )
}

export function fetchSheetById(sheetId: string) {
  return requestJson<{
    group: {
      id: string
      number: number
      name: string | null
      courseId: string
    }
    sheet: SprintSheet
  }>(`/sheets/${sheetId}`)
}

export function fetchGroupSprintSheets(
  groupId: string,
  sprintNumber: number,
) {
  return requestJson<{
    group: {
      id: string
      number: number
      name: string | null
      courseId: string
    }
    sprintNumber: number
    start: SprintSheet | null
    end: SprintSheet | null
  }>(`/groups/${groupId}/sprints/${sprintNumber}/sheets`)
}

export function approveSheet(sheetId: string) {
  return requestJson<SprintSheet>(`/sheets/${sheetId}/approve`, {
    method: 'POST',
  })
}

export function requestSheetChanges(sheetId: string, comment: string) {
  return requestJson<SprintSheet>(`/sheets/${sheetId}/request-changes`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  })
}

// ── Grades (CT-047 / CT-048) ───────────────────────────────

export type GradeStudentRow = {
  id: string
  fullName: string
  legajo: string | null
  email: string | null
  score: number | null
  isAbsent: boolean
  comment?: string | null
  hasMark: boolean
}

export type GradesRoster = {
  courseId: string
  kind: 'preliminary' | 'final'
  groups: {
    id: string
    number: number
    name: string | null
    preliminaryGroupComment?: string | null
    students: GradeStudentRow[]
  }[]
}

export function fetchPreliminaryGrades(courseId: string) {
  return requestJson<GradesRoster>(
    `/courses/${courseId}/grades/preliminary`,
  )
}

export function fetchFinalGrades(courseId: string) {
  return requestJson<GradesRoster>(`/courses/${courseId}/grades/final`)
}

export function putPreliminaryGrade(
  courseId: string,
  studentId: string,
  body: {
    score?: number | null
    isAbsent?: boolean
    clear?: boolean
    comment?: string | null
  },
) {
  return requestJson<GradeStudentRow>(
    `/courses/${courseId}/grades/preliminary/${studentId}`,
    { method: 'PUT', body: JSON.stringify(body) },
  )
}

export function putFinalGrade(
  courseId: string,
  studentId: string,
  body: {
    score?: number | null
    isAbsent?: boolean
    clear?: boolean
  },
) {
  return requestJson<GradeStudentRow>(
    `/courses/${courseId}/grades/final/${studentId}`,
    { method: 'PUT', body: JSON.stringify(body) },
  )
}

export function patchGroupPreliminaryComment(
  groupId: string,
  comment: string | null,
) {
  return requestJson<{
    groupId: string
    preliminaryGroupComment: string | null
  }>(`/groups/${groupId}/preliminary-comment`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  })
}
