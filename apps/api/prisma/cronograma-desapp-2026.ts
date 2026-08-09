import { ClassActivityType } from '@prisma/client'

export type CronogramaSeedItem = {
  title: string
  activityType: ClassActivityType
}

export type CronogramaSeedDay = {
  /** YYYY-MM-DD (DesApp 2026) */
  date: string
  items: CronogramaSeedItem[]
}

/** Official DesApp schedule — year 2026 (CT-025). */
export const CRONOGRAMA_DESAPP_2026: CronogramaSeedDay[] = [
  {
    date: '2026-04-02',
    items: [{ title: 'Feriado', activityType: ClassActivityType.feriado }],
  },
  {
    date: '2026-04-09',
    items: [
      {
        title:
          'Presentación / objetivos / armado de equipos / selección de trabajos / Herramientas basadas en IA',
        activityType: ClassActivityType.teorica,
      },
    ],
  },
  {
    date: '2026-04-16',
    items: [
      {
        title: '1er Sprint - planning',
        activityType: ClassActivityType.sprint_planning,
      },
    ],
  },
  {
    date: '2026-04-23',
    items: [
      {
        title:
          'React y BE - trabajo con herramientas basadas en IA - 1',
        activityType: ClassActivityType.teorica,
      },
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-04-30',
    items: [
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-05-07',
    items: [
      {
        title: '1er Sprint - review',
        activityType: ClassActivityType.sprint_review,
      },
      {
        title: '2do Sprint - planning',
        activityType: ClassActivityType.sprint_planning,
      },
    ],
  },
  {
    date: '2026-05-14',
    items: [
      {
        title:
          'React y BE - trabajo con herramientas basadas en IA - 2',
        activityType: ClassActivityType.teorica,
      },
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-05-21',
    items: [
      {
        title: '2do Sprint - review',
        activityType: ClassActivityType.sprint_review,
      },
      {
        title: '3er Sprint - planning',
        activityType: ClassActivityType.sprint_planning,
      },
    ],
  },
  {
    date: '2026-05-28',
    items: [
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-06-04',
    items: [
      {
        title: '3er Sprint - review',
        activityType: ClassActivityType.sprint_review,
      },
      {
        title: '4to Sprint - planning',
        activityType: ClassActivityType.sprint_planning,
      },
    ],
  },
  {
    date: '2026-06-11',
    items: [
      {
        title: 'Presentación medio término',
        activityType: ClassActivityType.presentacion_medio,
      },
    ],
  },
  {
    date: '2026-06-18',
    items: [
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-06-25',
    items: [
      {
        title: '4to Sprint - review',
        activityType: ClassActivityType.sprint_review,
      },
      {
        title: '5to Sprint - planning',
        activityType: ClassActivityType.sprint_planning,
      },
    ],
  },
  {
    date: '2026-07-02',
    items: [
      {
        title: 'Seguimiento',
        activityType: ClassActivityType.seguimiento,
      },
    ],
  },
  {
    date: '2026-07-09',
    items: [{ title: 'Feriado', activityType: ClassActivityType.feriado }],
  },
  {
    date: '2026-07-16',
    items: [
      {
        title: '5to Sprint - review',
        activityType: ClassActivityType.sprint_review,
      },
    ],
  },
  {
    date: '2026-07-23',
    items: [
      {
        title: 'Presentación final',
        activityType: ClassActivityType.presentacion_final,
      },
    ],
  },
]

/** Parse YYYY-MM-DD as UTC noon (same as attendance dates). */
export function parseSeedDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

function addUtcDays(isoDate: string, deltaDays: number): string {
  const d = parseSeedDate(isoDate)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Shift DesApp cronograma so "today" falls inside a sprint (CT-079).
 * Default: land ~7 days after the chosen sprint's planning.
 */
export function shiftCronogramaSoTodayInSprint(
  days: CronogramaSeedDay[],
  options?: {
    today?: Date
    sprintNumber?: number
    daysAfterPlanning?: number
  },
): CronogramaSeedDay[] {
  const sprintNumber = options?.sprintNumber ?? 2
  const daysAfterPlanning = options?.daysAfterPlanning ?? 7
  const today = options?.today ?? new Date()
  const todayKey = [
    today.getUTCFullYear(),
    String(today.getUTCMonth() + 1).padStart(2, '0'),
    String(today.getUTCDate()).padStart(2, '0'),
  ].join('-')

  const ordinalHints: Record<number, string[]> = {
    1: ['1er', '1ro', 'primer'],
    2: ['2do', 'segundo'],
    3: ['3er', '3ro', 'tercer'],
    4: ['4to', 'cuarto'],
    5: ['5to', 'quinto'],
  }
  const hints = ordinalHints[sprintNumber] ?? [`${sprintNumber}`]

  let planningDate: string | null = null
  for (const day of days) {
    for (const item of day.items) {
      if (item.activityType !== ClassActivityType.sprint_planning) continue
      const title = item.title.toLowerCase()
      if (hints.some((h) => title.includes(h))) {
        planningDate = day.date
        break
      }
    }
    if (planningDate) break
  }
  if (!planningDate) return days

  const desiredPlanning = addUtcDays(todayKey, -daysAfterPlanning)
  const origin = parseSeedDate(planningDate).getTime()
  const target = parseSeedDate(desiredPlanning).getTime()
  const deltaDays = Math.round((target - origin) / (24 * 60 * 60 * 1000))

  if (deltaDays === 0) return days

  return days.map((day) => ({
    ...day,
    date: addUtcDays(day.date, deltaDays),
  }))
}
