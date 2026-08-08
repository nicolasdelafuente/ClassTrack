import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  IconBoard,
  IconCalendar,
  IconGrades,
  IconNote,
  IconSettings,
} from '../atoms/icons'
import { cn } from '../../lib/cn'

type CourseSidebarProps = {
  courseId: string
  /** Desktop rail expands on hover; mobile uses expanded drawer layout. */
  mode: 'rail' | 'drawer'
  onNavigate?: () => void
}

type NavItem = {
  id: string
  label: string
  to: string
  icon: ReactNode
  match: (pathname: string) => boolean
}

function isActivePath(pathname: string, courseId: string, kind: string) {
  switch (kind) {
    case 'board':
      return pathname === '/' || pathname === ''
    case 'schedule':
      return pathname.includes(`/courses/${courseId}/schedule`)
    case 'sheets':
      return pathname.includes('/sprint-sheets')
    case 'grades':
      return pathname.includes('/grades/')
    case 'invites':
      return pathname.includes('/invites')
    case 'duplicate':
      return pathname.includes('/duplicate')
    default:
      return false
  }
}

/**
 * Global teacher navigation — modules only, not page actions (CT-053).
 * Rail: collapsed icons, expands labels on hover.
 */
export function CourseSidebar({ courseId, mode, onNavigate }: CourseSidebarProps) {
  const { pathname } = useLocation()
  const configOpenDefault =
    isActivePath(pathname, courseId, 'invites') ||
    isActivePath(pathname, courseId, 'duplicate')
  const [configOpen, setConfigOpen] = useState(configOpenDefault)

  useEffect(() => {
    if (configOpenDefault) setConfigOpen(true)
  }, [configOpenDefault])

  const items: NavItem[] = [
    {
      id: 'schedule',
      label: 'Cronograma',
      to: `/courses/${courseId}/schedule`,
      icon: <IconCalendar className="shrink-0" />,
      match: (p) => isActivePath(p, courseId, 'schedule'),
    },
    {
      id: 'board',
      label: 'Tablero de grupos',
      to: '/',
      icon: <IconBoard className="shrink-0" />,
      match: (p) => isActivePath(p, courseId, 'board'),
    },
    {
      id: 'sheets',
      label: 'Fichas de sprint',
      to: `/courses/${courseId}/sprint-sheets?status=in_review`,
      icon: <IconNote className="shrink-0" />,
      match: (p) => isActivePath(p, courseId, 'sheets'),
    },
    {
      id: 'grades',
      label: 'Notas y calificaciones',
      to: `/courses/${courseId}/grades/preliminary`,
      icon: <IconGrades className="shrink-0" />,
      match: (p) => isActivePath(p, courseId, 'grades'),
    },
  ]

  const linkClass = (active: boolean) =>
    cn(
      'group/item flex min-h-11 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium no-underline transition-[background-color,color,box-shadow] duration-200',
      active
        ? 'bg-accent-soft text-accent'
        : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
    )

  const labelClass =
    mode === 'rail'
      ? 'overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100'
      : 'whitespace-nowrap'

  const configActive =
    isActivePath(pathname, courseId, 'invites') ||
    isActivePath(pathname, courseId, 'duplicate')

  return (
    <nav
      aria-label="Navegación de la cursada"
      className={cn(
        'group/sidebar flex h-full flex-col border-r border-border/80 bg-surface-1',
        mode === 'rail' &&
          'w-14 overflow-hidden transition-[width] duration-200 ease-out hover:w-56',
        mode === 'drawer' && 'w-full',
      )}
    >
      <div className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {items.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.id}
              to={item.to}
              className={linkClass(active)}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              onClick={onNavigate}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center">
                {item.icon}
              </span>
              <span className={labelClass}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto border-t border-border/80 p-2 pb-3">
        <button
          type="button"
          className={cn(
            linkClass(configActive),
            'w-full cursor-pointer border-0 bg-transparent text-left',
          )}
          aria-expanded={configOpen}
          title="Configuración"
          onClick={() => setConfigOpen((v) => !v)}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <IconSettings className="shrink-0" />
          </span>
          <span className={cn(labelClass, 'flex-1')}>Configuración</span>
          <span
            className={cn(
              'text-[10px] text-fg-faint',
              mode === 'rail' &&
                'opacity-0 transition-opacity group-hover/sidebar:opacity-100',
            )}
            aria-hidden
          >
            {configOpen ? '▴' : '▾'}
          </span>
        </button>

        {configOpen ? (
          <div
            className={cn(
              'mt-1 flex flex-col gap-0.5',
              mode === 'rail' &&
                'opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100',
            )}
          >
            <Link
              to={`/courses/${courseId}/invites`}
              className={cn(
                linkClass(isActivePath(pathname, courseId, 'invites')),
                'min-h-10 pl-10',
              )}
              onClick={onNavigate}
            >
              <span className={mode === 'rail' ? labelClass : undefined}>
                Invitar
              </span>
            </Link>
            <Link
              to={`/courses/${courseId}/duplicate`}
              className={cn(
                linkClass(isActivePath(pathname, courseId, 'duplicate')),
                'min-h-10 pl-10',
              )}
              onClick={onNavigate}
            >
              <span className={mode === 'rail' ? labelClass : undefined}>
                Duplicar cursada
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
