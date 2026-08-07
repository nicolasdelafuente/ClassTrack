import type { ReactNode } from 'react'
import { Heading, Text } from '../atoms/Text'
import { Panel } from '../atoms/Panel'

type StateBoxProps = {
  title: string
  message: string
  hint?: ReactNode
}

export function StateBox({ title, message, hint }: StateBoxProps) {
  return (
    <Panel className="max-w-lg p-4" role="alert">
      <Heading as="h1" className="mb-2 text-base">
        {title}
      </Heading>
      <Text>{message}</Text>
      {hint ? <div className="mt-3 text-xs text-fg-faint">{hint}</div> : null}
    </Panel>
  )
}

export function StateMessage({ children }: { children: ReactNode }) {
  return (
    <p className="text-fg-muted" aria-live="polite">
      {children}
    </p>
  )
}
