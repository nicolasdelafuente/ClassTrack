import type { SprintStatus } from '../../types'
import { SprintTimeline } from './SprintTimeline'

type SprintLightsProps = {
  sprints: { sprintNumber: number; status: SprintStatus }[]
}

/** Read-only mini timeline for board cards — same language as SprintTimeline. */
export function SprintLights({ sprints }: SprintLightsProps) {
  return (
    <div className="mt-0.5 border-t border-border pt-2.5">
      <SprintTimeline sprints={sprints} compact />
    </div>
  )
}
