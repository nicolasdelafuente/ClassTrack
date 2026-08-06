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

export type GroupSummary = {
  id: string
  number: number
  name: string | null
  projectTopic: string | null
  teacherName: string | null
  memberCount: number
  sprints: GroupSprint[]
  links: {
    githubUrl: string | null
    trelloUrl: string | null
    driveUrl: string | null
  } | null
}
