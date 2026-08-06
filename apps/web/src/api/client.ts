import type { Course, GroupSummary } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Error ${res.status} al pedir ${path}`)
  }
  return res.json() as Promise<T>
}

export function fetchCurrentCourse() {
  return getJson<Course>('/courses/current')
}

export function fetchCourseGroups(courseId: string) {
  return getJson<GroupSummary[]>(`/courses/${courseId}/groups`)
}
