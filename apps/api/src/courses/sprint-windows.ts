/**
 * Derive sprint calendar windows from cronograma sessions (CT-073 / CT-E09).
 * Sprint N: planning date → review date (inclusive). Not the teacher semáforo.
 */

export type SessionForSprintWindow = {
  date: Date
  items: { activityType: string; title?: string | null }[]
}

export type SprintWindow = {
  sprintNumber: number
  /** YYYY-MM-DD (UTC calendar day) */
  startsOn: string
  /** YYYY-MM-DD or null if review not scheduled yet */
  endsOn: string | null
}

const ORDINAL_TO_N: Record<string, number> = {
  '1er': 1,
  '1ro': 1,
  '1º': 1,
  primer: 1,
  '2do': 2,
  '2º': 2,
  segundo: 2,
  '3er': 3,
  '3ro': 3,
  '3º': 3,
  tercer: 3,
  '4to': 4,
  '4º': 4,
  cuarto: 4,
  '5to': 5,
  '5º': 5,
  quinto: 5,
}

/** Calendar day YYYY-MM-DD in UTC (matches seed / attendance noon dates). */
export function toDateKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

/** Extract sprint number from titles like "1er Sprint - planning". */
export function sprintNumberFromTitle(title: string): number | null {
  const t = title.trim().toLowerCase()
  for (const [ord, n] of Object.entries(ORDINAL_TO_N)) {
    if (t.startsWith(ord) || t.includes(`${ord} sprint`)) return n
  }
  const m = t.match(/\bsprint\s*(\d+)\b/)
  if (m) {
    const n = Number(m[1])
    if (n >= 1 && n <= 5) return n
  }
  return null
}

/**
 * Build windows from class sessions ordered by date.
 * Sequential fallback: N-th planning seen → sprint N if title has no number.
 */
export function buildSprintWindows(
  sessions: SessionForSprintWindow[],
): SprintWindow[] {
  const ordered = [...sessions].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )

  const starts = new Map<number, string>()
  const ends = new Map<number, string>()
  let planningSeq = 0

  for (const session of ordered) {
    const day = toDateKey(session.date)
    for (const item of session.items) {
      const type = item.activityType
      if (type !== 'sprint_planning' && type !== 'sprint_review') continue

      let n = item.title ? sprintNumberFromTitle(item.title) : null
      if (n == null && type === 'sprint_planning') {
        planningSeq += 1
        n = planningSeq
      }
      if (n == null || n < 1 || n > 5) continue

      if (type === 'sprint_planning') {
        if (!starts.has(n)) starts.set(n, day)
      } else if (!ends.has(n)) {
        ends.set(n, day)
      }
    }
  }

  const numbers = [...new Set([...starts.keys(), ...ends.keys()])].sort(
    (a, b) => a - b,
  )

  return numbers
    .filter((n) => starts.has(n))
    .map((n) => ({
      sprintNumber: n,
      startsOn: starts.get(n)!,
      endsOn: ends.get(n) ?? null,
    }))
}

/**
 * Highest sprint N where startsOn ≤ today ≤ endsOn (or open-ended).
 * Same-day review N + planning N+1 → N+1 wins.
 */
export function resolveCurrentSprintNumber(
  windows: SprintWindow[],
  today: Date = new Date(),
): number | null {
  const todayKey = toDateKey(today)
  let current: number | null = null
  for (const w of windows) {
    if (w.startsOn > todayKey) continue
    if (w.endsOn != null && w.endsOn < todayKey) continue
    if (current == null || w.sprintNumber > current) current = w.sprintNumber
  }
  return current
}

export type SprintCalendarDto = {
  today: string
  currentSprintNumber: number | null
  sprints: SprintWindow[]
}

export function toSprintCalendarDto(
  windows: SprintWindow[],
  today: Date = new Date(),
): SprintCalendarDto {
  return {
    today: toDateKey(today),
    currentSprintNumber: resolveCurrentSprintNumber(windows, today),
    sprints: windows,
  }
}
