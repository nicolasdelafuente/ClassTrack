import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCurrentCourse } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { roleLabel } from '../../auth/roles'
import { Button } from '../atoms/Button'
import { IconMenu } from '../atoms/icons'
import { CourseSidebar } from '../organisms/CourseSidebar'
import { cn } from '../../lib/cn'
import { PageContainer, pageGutterClassName } from './PageContainer'

type AppShellProps = {
  courseId?: string
  courseName?: string
  courseCode?: string
  children: ReactNode
  /**
   * Contextual back only (child → parent), e.g. session → schedule, sheet → queue.
   * Do not use on sidebar top-level modules (CT-061).
   */
  showBack?: boolean
  /** Destination for the back link (default: board `/`). */
  backTo?: string
  backLabel?: string
}

/**
 * Product chrome: teacher course sidebar (nav) + header + main (actions live in pages).
 */
export function AppShell({
  courseId: courseIdProp,
  courseName: courseNameProp,
  courseCode: courseCodeProp,
  children,
  showBack = false,
  backTo = '/',
  backLabel = '← Tablero',
}: AppShellProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const isTeacher = user?.role === 'teacher'

  const [resolvedCourse, setResolvedCourse] = useState<{
    id: string
    name: string
    code: string
  } | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!isTeacher) return
    let cancelled = false
    void fetchCurrentCourse()
      .then((course) => {
        if (!cancelled) {
          setResolvedCourse({
            id: course.id,
            name: course.name,
            code: course.code,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setResolvedCourse(null)
      })
    return () => {
      cancelled = true
    }
  }, [isTeacher])

  const courseId = courseIdProp ?? resolvedCourse?.id
  const courseName = courseNameProp ?? resolvedCourse?.name
  const courseCode = courseCodeProp ?? resolvedCourse?.code
  const showSidebar = Boolean(isTeacher && courseId)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={cn('min-h-screen w-full', showSidebar && 'md:flex')}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Saltar al contenido
      </a>

      {showSidebar && courseId ? (
        <aside className="sticky top-0 z-30 hidden h-screen shrink-0 md:block">
          <CourseSidebar courseId={courseId} mode="rail" />
        </aside>
      ) : null}

      {showSidebar && courseId && mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 border-0 bg-fg/30"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-surface-1 shadow-lift">
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <span className="text-[14px] font-semibold text-fg">Menú</span>
              <Button
                type="button"
                variant="ghost"
                className="min-h-9 px-2.5 text-[12px]"
                onClick={() => setMobileNavOpen(false)}
              >
                Cerrar
              </Button>
            </div>
            <CourseSidebar
              courseId={courseId}
              mode="drawer"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className={cn('min-w-0 flex-1', pageGutterClassName)}>
        <PageContainer className="pb-12">
          <header className="sticky top-0 z-20 flex min-h-[56px] flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-border/80 bg-surface/80 py-2.5 backdrop-blur-md transition-[background-color,border-color] duration-200">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {showSidebar ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-9 shrink-0 px-2 md:hidden"
                  aria-label="Abrir navegación"
                  aria-expanded={mobileNavOpen}
                  onClick={() => setMobileNavOpen(true)}
                >
                  <IconMenu />
                </Button>
              ) : null}
              {showBack ? (
                <Link
                  className="shrink-0 text-[13px] font-medium text-fg-muted no-underline transition-colors duration-200 hover:text-fg"
                  to={backTo}
                >
                  {backLabel}
                </Link>
              ) : (
                <span
                  className="shrink-0 text-[15px] font-semibold tracking-tight text-fg"
                  translate="no"
                >
                  ClassTrack
                </span>
              )}
              {(courseName || courseCode) && (
                <>
                  <span
                    className="hidden h-4 w-px shrink-0 bg-border sm:block"
                    aria-hidden
                  />
                  <p className="m-0 flex min-w-0 items-center gap-2.5 text-[13px]">
                    {courseName ? (
                      <span className="min-w-0 truncate font-medium text-fg">
                        {courseName}
                      </span>
                    ) : null}
                    {courseCode ? (
                      <span
                        className="shrink-0 rounded-full border border-border bg-surface-1 px-2.5 py-0.5 text-xs tabular-nums text-fg-faint shadow-panel"
                        translate="no"
                      >
                        {courseCode}
                      </span>
                    ) : null}
                  </p>
                </>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
                <span className="hidden items-center gap-2 text-[12px] text-fg-faint sm:inline-flex">
                  <span className="rounded-full border border-border bg-surface-1 px-2.5 py-0.5 text-[11px] font-medium text-fg-muted">
                    {roleLabel(user.role)}
                  </span>
                  <span className="max-w-[10rem] truncate">
                    {user.displayName || user.email}
                  </span>
                </span>
                <span
                  className="hidden h-4 w-px shrink-0 bg-border sm:block"
                  aria-hidden
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-[12px]"
                  onClick={handleLogout}
                >
                  Salir
                </Button>
              </div>
            ) : null}
          </header>
          <main
            id="main-content"
            className="scroll-mt-16 pt-6 motion-safe:animate-fade-up"
            tabIndex={-1}
          >
            {children}
          </main>
        </PageContainer>
      </div>
    </div>
  )
}
