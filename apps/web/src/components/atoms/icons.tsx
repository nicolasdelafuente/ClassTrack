/** Small line icons — no emoji clusters (classtrack-ui). */
export function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.75 13.25c.4-2.2 2-3.5 4.25-3.5s3.85 1.3 4.25 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="11.25" cy="5.5" r="1.75" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10.5 9.75c1.35.2 2.4 1.05 2.75 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSignal({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
    </svg>
  )
}

export function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.5 9.5 9.5 6.5M7 11.5l-.8.8a2.6 2.6 0 0 1-3.7-3.7l.8-.8M9 4.5l.8-.8a2.6 2.6 0 0 1 3.7 3.7l-.8.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function IconTrello({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2.5 1.5A1.5 1.5 0 0 0 1 3v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 15 13V3a1.5 1.5 0 0 0-1.5-1.5h-11zM4 4.75h3.25v6A.75.75 0 0 1 6.5 11.5H4.75A.75.75 0 0 1 4 10.75v-6zm5 0h3.25v3.5a.75.75 0 0 1-.75.75H9.75A.75.75 0 0 1 9 8.25v-3.5z" />
    </svg>
  )
}

export function IconDrive({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6.2 2.5h3.6L14 11.2H10.4L6.2 2.5z" fill="currentColor" opacity="0.9" />
      <path d="M2 11.2 5.1 5.2l2.3 4H2.9L2 11.2z" fill="currentColor" opacity="0.55" />
      <path d="M6.5 13.5h7.2L12.1 11.2H4.9l1.6 2.3z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2"
        y="3.5"
        width="12"
        height="10.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.25 2.25v2.5M10.75 2.25v2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Quiet note / document mark for follow-up notes panel. */
export function IconNote({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 2.5h5.2L12.5 5.3V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9.5 2.5V5.5H12.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M5.5 8.5h5M5.5 11h3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 3.5 5.5 8 10 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
