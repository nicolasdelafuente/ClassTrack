import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { getAppEnv } from '../config/app-env'
import { OBSERVABILITY_SERVICE_API } from './catalog'
import { redactSensitive } from './redact'
import type { AuditLogInput, AuditLoggerPort } from './types'

/**
 * Business audit events (who did what to which resource).
 * Sink = Pino. requestId/correlationId come from nestjs-pino bindings
 * (pino-http genReqId → customProps), not a parallel ALS.
 */
@Injectable()
export class AuditLogger implements AuditLoggerPort {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AuditLogger.name)
  }

  record(input: AuditLogInput): void {
    const message =
      input.message ||
      `${input.action} ${input.outcome}${input.resourceType ? ` ${input.resourceType}` : ''}`

    this.logger.info(
      {
        channel: 'audit',
        service: OBSERVABILITY_SERVICE_API,
        environment: getAppEnv(),
        action: input.action,
        outcome: input.outcome,
        actorUserId: input.actorUserId?.trim() || undefined,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? undefined,
        module: input.module,
        metadata: input.metadata
          ? (redactSensitive(input.metadata) as Record<string, unknown>)
          : undefined,
      },
      message,
    )
  }
}
