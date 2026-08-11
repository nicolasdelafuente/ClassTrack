import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Params } from 'nestjs-pino'
import type { Options } from 'pino-http'
import { getAppEnv } from '../config/app-env'
import { OBSERVABILITY_SERVICE_API } from './catalog'
import { createRequestId } from './request-id'

function logLevel(): string {
  const raw = (process.env.LOG_LEVEL || '').trim().toLowerCase()
  if (['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(raw)) {
    return raw
  }
  return getAppEnv() === 'develop' ? 'debug' : 'info'
}

function usePrettyConsole(): boolean {
  const format = (process.env.LOG_FORMAT || '').trim().toLowerCase()
  if (format === 'json') return false
  if (format === 'pretty') return true
  return getAppEnv() === 'develop'
}

function logToFileEnabled(): boolean {
  const raw = (process.env.LOG_TO_FILE || '1').trim().toLowerCase()
  return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no'
}

function logDir(): string {
  const fromEnv = process.env.LOG_DIR?.trim()
  if (fromEnv) return fromEnv
  return join(process.cwd(), 'logs')
}

function logFileBase(): string {
  const name = process.env.LOG_FILE_NAME?.trim() || 'classtrack-api.jsonl'
  const base = name.replace(/\.jsonl$/i, '').replace(/\.log$/i, '')
  return join(logDir(), base || 'classtrack-api')
}

function logFileMaxSize(): string {
  return process.env.LOG_FILE_MAX_SIZE?.trim() || '5m'
}

function logFileMaxFiles(): number {
  const n = Number(process.env.LOG_FILE_MAX_FILES || 3)
  return Number.isFinite(n) && n >= 1 && n <= 20 ? Math.floor(n) : 3
}

type HeaderCarrier = {
  headers: IncomingMessage['headers']
}

function headerValue(
  req: HeaderCarrier,
  name: string,
): string | undefined {
  const raw = req.headers[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  const trimmed = value?.trim()
  if (!trimmed || trimmed.length > 128) return undefined
  return trimmed
}

type TransportTarget = {
  target: string
  level: string
  options: Record<string, unknown>
}

/**
 * nestjs-pino / pino-http config.
 * Request id source of truth: `genReqId` → `req.id` (+ customProps.requestId).
 */
export function buildPinoParams(): Params {
  const level = logLevel()
  const targets: TransportTarget[] = []

  if (usePrettyConsole()) {
    targets.push({
      target: 'pino-pretty',
      level,
      options: {
        colorize: true,
        singleLine: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    })
  } else {
    targets.push({
      target: 'pino/file',
      level,
      options: { destination: 1 },
    })
  }

  if (logToFileEnabled()) {
    targets.push({
      target: 'pino-roll',
      level,
      options: {
        file: logFileBase(),
        size: logFileMaxSize(),
        mkdir: true,
        extension: '.jsonl',
        limit: { count: logFileMaxFiles() },
      },
    })
  }

  const pinoHttp = {
    level,
    quietReqLogger: true,
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const existing =
        headerValue(req, 'x-request-id') ||
        headerValue(req, 'x-correlation-id')
      const requestId = existing || createRequestId()
      if (!res.headersSent) {
        res.setHeader('X-Request-Id', requestId)
      }
      return requestId
    },
    customProps: (req: IncomingMessage & { id?: unknown }) => {
      const correlationId =
        headerValue(req, 'x-correlation-id') || String(req.id)
      const userId = headerValue(req, 'x-user-id')
      return {
        service: OBSERVABILITY_SERVICE_API,
        environment: getAppEnv(),
        requestId: String(req.id),
        correlationId,
        ...(userId ? { userId } : {}),
      }
    },
    serializers: {
      req: (req: { id?: unknown; method?: string; url?: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode?: number }) => ({
        statusCode: res.statusCode,
      }),
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordConfirmation',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'api_key',
        'secret',
        'MAILJET_API_KEY',
        'MAILJET_API_SECRET',
        'mailjetApiKey',
        'mailjetApiSecret',
        '*.password',
        '*.passwordConfirmation',
        '*.token',
        '*.apiKey',
        '*.api_key',
        '*.secret',
        '*.authorization',
      ],
      censor: '[REDACTED]',
    },
    transport: { targets },
  } as Options

  return { pinoHttp }
}

export function resolveLogDirForDocs(): string {
  return logDir()
}
