import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AppShellProps = {
  courseName?: string
  courseCode?: string
  children: ReactNode
  showBack?: boolean
}

export function AppShell({
  courseName,
  courseCode,
  children,
  showBack = false,
}: AppShellProps) {
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          {showBack ? (
            <Link className="shell__back" to="/">
              ← Tablero
            </Link>
          ) : (
            <span className="shell__product">ClassTrack</span>
          )}
        </div>
        {(courseName || courseCode) && (
          <p className="shell__course">
            <span className="shell__course-name">{courseName}</span>
            {courseCode ? <span className="shell__course-code">{courseCode}</span> : null}
          </p>
        )}
      </header>
      <main className="shell__main">{children}</main>
    </div>
  )
}
