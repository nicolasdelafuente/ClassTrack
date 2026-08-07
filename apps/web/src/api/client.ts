import type {
  AttendanceMark,
  AttendanceRoster,
  Course,
  GroupDetail,
  GroupLinks,
  GroupSprint,
  GroupSummary,
  SprintStatus,
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
