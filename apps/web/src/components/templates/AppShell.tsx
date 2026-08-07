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
    <div className="mx-auto max-w-[1120px] px-4 pb-12">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/90 py-2.5 backdrop-blur-md">
        <div>
          {showBack ? (
            <Link
              className="text-[13px] font-medium text-fg-muted no-underline hover:text-fg"
              to="/"
            >
              ← Tablero
            </Link>
          ) : (
            <span className="text-sm font-semibold tracking-tight text-fg" translate="no">
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
                className="rounded-full border border-border px-2 py-0.5 text-xs tabular-nums text-fg-faint"
                translate="no"
              >
                {courseCode}
              </span>
            ) : null}
          </p>
        )}
      </header>
      <main id="main-content" className="scroll-mt-16 pt-5" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
