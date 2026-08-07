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

/** Parse YYYY-MM-DD as UTC midnight for stable unique dates. */
export function parseSeedDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
