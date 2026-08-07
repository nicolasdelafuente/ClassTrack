import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AppShellProps = {
  courseName?: string
  courseCode?: string
  children: ReactNode
  showBack?: boolean
}

/** Template: chrome de producto (header + main). */
export function AppShell({
  courseName,
  courseCode,
  children,
  showBack = false,
}: AppShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1120px] min-w-0 px-4 pb-12">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 flex min-h-[56px] flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-surface/80 py-2.5 backdrop-blur-md transition-[background-color,border-color] duration-200">
        <div>
          {showBack ? (
            <Link
              className="text-[13px] font-medium text-fg-muted no-underline transition-colors duration-200 hover:text-fg"
              to="/"
            >
              ← Tablero
            </Link>
          ) : (
            <span
              className="text-[15px] font-semibold tracking-tight text-fg"
              translate="no"
            >
              ClassTrack
            </span>
          )}
        </div>
        {(courseName || courseCode) && (
          <p className="m-0 flex flex-wrap items-center gap-2 text-[13px]">
            {courseName ? (
              <span className="font-medium text-fg">{courseName}</span>
            ) : null}
            {courseCode ? (
              <span
                className="rounded-full border border-border bg-surface-1 px-2.5 py-0.5 text-xs tabular-nums text-fg-faint shadow-panel"
                translate="no"
              >
                {courseCode}
              </span>
            ) : null}
          </p>
        )}
      </header>
      <main
        id="main-content"
        className="scroll-mt-16 pt-6 motion-safe:animate-fade-up"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  )
}
