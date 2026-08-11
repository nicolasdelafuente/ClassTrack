import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { PinoLogger } from 'nestjs-pino'
import { getAppEnv, isProductionEnv } from '../config/app-env'
import type { ErrorCode } from './catalog'
import { readRequestIdFromRequest } from './request-id'

export type ClientErrorBody = {
  statusCode: number
  errorCode: ErrorCode
  message: string
  requestId?: string
  /** Only when APP_ENV=develop — never in production/testing. */
  error?: string
}

function mapHttpStatusToCode(status: number): ErrorCode {
  if (status === 400) return 'CT_BUSINESS'
  if (status === 401) return 'CT_AUTH'
  if (status === 403) return 'CT_FORBIDDEN'
  if (status === 404) return 'CT_NOT_FOUND'
  if (status === 409) return 'CT_CONFLICT'
  if (status === 429) return 'CT_BUSINESS'
  if (status >= 500) return 'CT_UNEXPECTED'
  return 'CT_BUSINESS'
}

function messageFromHttpException(exception: HttpException): string {
  const res = exception.getResponse()
  if (typeof res === 'string') return res
  if (res && typeof res === 'object') {
    const body = res as { message?: string | string[]; error?: string }
    if (Array.isArray(body.message)) return body.message.join(' · ')
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message
    }
    if (typeof body.error === 'string') return body.error
  }
  return exception.message || 'Error'
}

function isValidationException(exception: HttpException): boolean {
  const res = exception.getResponse()
  if (!res || typeof res !== 'object') return false
  const body = res as { message?: unknown }
  return Array.isArray(body.message)
}

type MappedError = {
  statusCode: number
  errorCode: ErrorCode
  message: string
  errorType: string
  logAsError: boolean
  db?: { operation: string; code?: string }
}

function mapPrismaError(exception: unknown): MappedError | null {
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: 'CT_DB_UNIQUE',
        message: 'El recurso ya existe o viola una restricción única',
        errorType: 'PrismaClientKnownRequestError',
        logAsError: false,
        db: { operation: 'query', code: exception.code },
      }
    }
    if (exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'CT_NOT_FOUND',
        message: 'Recurso no encontrado',
        errorType: 'PrismaClientKnownRequestError',
        logAsError: false,
        db: { operation: 'query', code: exception.code },
      }
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'CT_DB',
      message: isProductionEnv()
        ? 'Error de base de datos'
        : `Error de base de datos (${exception.code})`,
      errorType: 'PrismaClientKnownRequestError',
      logAsError: true,
      db: { operation: 'query', code: exception.code },
    }
  }

  if (exception instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'CT_VALIDATION',
      message: isProductionEnv()
        ? 'Solicitud inválida'
        : 'Error de validación de Prisma',
      errorType: 'PrismaClientValidationError',
      logAsError: false,
      db: { operation: 'validate' },
    }
  }

  if (exception instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      errorCode: 'CT_DB',
      message: 'Base de datos no disponible',
      errorType: 'PrismaClientInitializationError',
      logAsError: true,
      db: {
        operation: 'init',
        code: exception.errorCode || undefined,
      },
    }
  }

  if (exception instanceof Prisma.PrismaClientRustPanicError) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'CT_DB',
      message: 'Error interno de base de datos',
      errorType: 'PrismaClientRustPanicError',
      logAsError: true,
      db: { operation: 'engine' },
    }
  }

  if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'CT_DB',
      message: 'Error de base de datos',
      errorType: 'PrismaClientUnknownRequestError',
      logAsError: true,
      db: { operation: 'query' },
    }
  }

  return null
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    // Source of truth: pino-http `req.id` (set by genReqId).
    const requestId = readRequestIdFromRequest(request)

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let errorCode: ErrorCode = 'CT_UNEXPECTED'
    let message = 'Error interno del servidor'
    let errorType = 'Error'
    let logAsError = true
    let db: MappedError['db']

    const prismaMapped = mapPrismaError(exception)
    if (prismaMapped) {
      statusCode = prismaMapped.statusCode
      errorCode = prismaMapped.errorCode
      message = prismaMapped.message
      errorType = prismaMapped.errorType
      logAsError = prismaMapped.logAsError
      db = prismaMapped.db
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      errorType = exception.name
      message = messageFromHttpException(exception)
      errorCode = isValidationException(exception)
        ? 'CT_VALIDATION'
        : mapHttpStatusToCode(statusCode)
      logAsError = statusCode >= 500
    } else if (exception instanceof Error) {
      errorType = exception.name
      message = isProductionEnv()
        ? 'Error interno del servidor'
        : exception.message || message
    }

    const endpoint = request.originalUrl?.split('?')[0] || request.url
    const httpMethod = request.method

    const logFields = {
      channel: logAsError ? 'error' : 'app',
      requestId,
      endpoint,
      httpMethod,
      statusCode,
      errorCode,
      errorType,
      ...(db ? { db } : {}),
      err: exception,
    }

    if (logAsError) {
      this.logger.error(logFields, message)
    } else if (statusCode >= 400) {
      this.logger.warn(logFields, message)
    }

    const body: ClientErrorBody = {
      statusCode,
      errorCode,
      message,
      ...(requestId ? { requestId } : {}),
    }

    if (getAppEnv() === 'develop' && exception instanceof Error) {
      body.error = exception.name
    }

    response.status(statusCode).json(body)
  }
}
