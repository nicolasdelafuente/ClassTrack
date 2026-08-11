import { Panel } from '../atoms/Panel'
import { ListRow } from '../molecules/ListRow'
import { Skeleton, SkeletonCircle, SkeletonText } from '../atoms/Skeleton'
import { GroupCardSkeleton } from '../molecules/GroupCardSkeleton'
import { PageHeroSkeleton } from '../molecules/PageHeroSkeleton'

/** Full board loading layout — hero + card grid. */
export function BoardPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <section
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando tablero"
    >
      <PageHeroSkeleton stats={2} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

/** Group detail: hero + panels for sprints / members / links. */
export function GroupDetailPageSkeleton() {
  return (
    <article
      className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start"
      aria-busy="true"
      aria-label="Cargando grupo"
    >
      <PageHeroSkeleton className="lg:col-span-2" stats={4} />

      <Panel as="section" tone="default" className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="flex justify-between gap-2 pt-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <SkeletonCircle size={28} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        as="section"
        tone="default"
        className="p-4 sm:p-5 lg:row-span-2"
      >
        <Skeleton className="mb-3 h-4 w-32" />
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3">
              <SkeletonCircle size={36} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-[70%]" />
                <Skeleton className="h-3 w-[40%]" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel as="section" tone="soft" className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-4 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </Panel>
    </article>
  )
}

/** Student “Mi grupo”: hero + semáforo + recursos + compañeros (columna única). */
export function StudentGroupPageSkeleton() {
  return (
    <article
      className="flex flex-col gap-4 pb-10"
      aria-busy="true"
      aria-label="Cargando grupo"
    >
      <PageHeroSkeleton compact stats={0} />

      <Panel as="section" tone="default" className="p-4">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="flex justify-between gap-2 pt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <SkeletonCircle size={28} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="soft" className="p-4">
        <Skeleton className="mb-3 h-4 w-44" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface-1 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <SkeletonCircle size={36} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-[55%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="soft" className="p-4">
        <Skeleton className="mb-3 h-4 w-28" />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-2 py-1.5">
              <SkeletonCircle size={32} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-[60%]" />
                <Skeleton className="h-3 w-[35%]" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </article>
  )
}

/** Student profile: hero + attendance summary + session rows. */
export function StudentProfilePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <section
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando perfil del alumno"
    >
      <PageHeroSkeleton compact stats={4} />
      <Panel as="section" tone="default" className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </Panel>
      <Panel as="section" tone="soft" className="p-4 sm:p-5">
        <Skeleton className="mb-3 h-4 w-36" />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-14 w-full" rounded="xl" />
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  )
}

/** Attendance: hero + group blocks with student rows. */
export function AttendancePageSkeleton({ groups = 3 }: { groups?: number }) {
  return (
    <section
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando asistencia"
    >
      <PageHeroSkeleton stats={4} />
      {Array.from({ length: groups }, (_, g) => (
        <Panel key={g} as="section" tone="default" className="overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2/80 px-3.5 py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-1 w-40" rounded="full" />
            </div>
            <Skeleton className="h-9 w-24" />
          </header>
          <ul className="m-0 list-none p-0">
            {Array.from({ length: 4 }, (_, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonCircle size={36} />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </section>
  )
}

/** Cronograma: compact hero + class list rows. */
export function SchedulePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <section
      className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-4"
      aria-busy="true"
      aria-label="Cargando cronograma"
    >
      <PageHeroSkeleton compact stats={4} />
      <Panel tone="default" className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-surface-2/80 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        <ul className="m-0 list-none p-0">
          {Array.from({ length: rows }, (_, i) => (
            <li
              key={i}
              className="border-b border-border px-3 py-3 last:border-b-0 sm:px-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-[7.5rem]" />
              </div>
              <div className="mt-2 space-y-1.5 pl-0">
                <Skeleton className="h-3 w-[55%]" />
                <Skeleton className="h-3 w-[40%]" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  )
}

/** Edit/create class: hero + form panel (calendar + fields). */
export function ScheduleSessionPageSkeleton() {
  return (
    <section
      className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-4"
      aria-busy="true"
      aria-label="Cargando clase"
    >
      <PageHeroSkeleton compact stats={0} showActions={false} />
      <Panel
        tone="default"
        className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-5"
      >
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="aspect-square w-full max-w-sm" rounded="xl" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <SkeletonText lines={3} />
          <div className="space-y-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" rounded="lg" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </Panel>
    </section>
  )
}

/** Student sprint sheet editor / teacher sheet detail. */
export function SprintSheetPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section
      className="flex flex-col gap-4 pb-10"
      aria-busy="true"
      aria-label="Cargando ficha"
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-28" rounded="md" />
        <Skeleton className="h-10 w-24" rounded="md" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <Panel key={i} tone="default" className="space-y-3 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={2} />
          <Skeleton className="h-8 w-40" />
        </Panel>
      ))}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-28" rounded="md" />
        <Skeleton className="h-11 w-36" rounded="md" />
      </div>
    </section>
  )
}

/** Teacher list of sprint sheets pending review. */
export function SprintSheetsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul
      className="m-0 flex list-none flex-col gap-2 p-0"
      aria-busy="true"
      aria-label="Cargando fichas"
    >
      {Array.from({ length: rows }, (_, i) => (
        <ListRow key={i} as="li" className="px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-3 w-[45%]" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        </ListRow>
      ))}
    </ul>
  )
}

/** Groups setup / capacity page. */
export function GroupsSetupPageSkeleton() {
  return (
    <section
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando grupos"
    >
      <PageHeroSkeleton compact stats={2} showActions={false} />
      <Panel tone="default" className="space-y-3 p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-48" />
      </Panel>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {Array.from({ length: 4 }, (_, i) => (
          <ListRow key={i} as="li" className="px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-20" />
            </div>
          </ListRow>
        ))}
      </ul>
    </section>
  )
}

/** Grades page: group blocks with student rows. */
export function GradesPageSkeleton({ groups = 3 }: { groups?: number }) {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando notas"
    >
      {Array.from({ length: groups }, (_, g) => (
        <Panel key={g} as="section" className="p-4">
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="mb-3 h-16 w-full" rounded="md" />
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonCircle size={32} />
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <Skeleton className="h-9 w-16" />
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  )
}

/** Student home: sprint + attendance panels (identity lives in PageHero). */
export function StudentHomeSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Cargando inicio alumno"
    >
      <Panel tone="elevated" className="space-y-3 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-[55%]" />
        <Skeleton className="h-3 w-40" />
        <div className="rounded-xl border border-border bg-surface-1 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-14 shrink-0" />
          </div>
          <Skeleton className="mt-2 h-3 w-[50%]" />
        </div>
        <Skeleton className="h-11 w-32" rounded="md" />
      </Panel>
      <Panel tone="default" className="space-y-3 p-4">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="mt-1 h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-border/80 pt-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-16" rounded="md" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/** Inline notes list inside group detail. */
export function GroupNotesListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul
      className="m-0 mt-4 flex list-none flex-col gap-3 p-0"
      aria-busy="true"
      aria-label="Cargando notas"
    >
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="rounded-md border border-border bg-surface-1 px-3 py-3"
        >
          <Skeleton className="h-3.5 w-[55%]" />
          <SkeletonText lines={2} className="mt-2" />
          <Skeleton className="mt-2 h-3 w-24" />
        </li>
      ))}
    </ul>
  )
}

/** Auth/register invite validation. */
export function AuthFormSkeleton() {
  return (
    <Panel
      className="flex flex-col gap-4 p-5"
      aria-busy="true"
      aria-label="Cargando formulario"
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-11 w-full" rounded="md" />
    </Panel>
  )
}
