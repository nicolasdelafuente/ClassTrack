/**
 * Observability contracts.
 * Application logging → Pino (nestjs-pino).
 * Audit events → AuditLogger (business semantics; sink is still Pino).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/** Semantic channel — do not overload a single “log everything” stream. */
export type LogChannel = 'app' | 'audit' | 'error'

export type AppEnvironment = 'develop' | 'testing' | 'production'

export type AuditOutcome = 'success' | 'failure'

export type ExternalCallStatus = 'success' | 'failure' | 'skipped'

export type LogExternalMeta = {
  service: string
  operation: string
  status: ExternalCallStatus
  durationMs?: number
  retryCount?: number
  providerStatusCode?: number
}

export type LogDbMeta = {
  operation: string
  model?: string
  durationMs?: number
  /** Prisma error code e.g. P2002 — never raw SQL with user data. */
  code?: string
}

export type SerializedError = {
  name: string
  message: string
  stack?: string
}

export type AuditLogInput = {
  action: string
  outcome: AuditOutcome
  actorUserId?: string | null
  resourceType?: string
  resourceId?: string | null
  module?: string
  message?: string
  metadata?: Record<string, unknown>
}

export type AuditLoggerPort = {
  record(input: AuditLogInput): void
}
