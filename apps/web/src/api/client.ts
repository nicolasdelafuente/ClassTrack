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
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

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
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
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

export function registerUser(body: {
  email: string
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
