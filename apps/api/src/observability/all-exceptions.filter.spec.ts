import {
  BadRequestException,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PinoLogger } from 'nestjs-pino'
import { AllExceptionsFilter } from './all-exceptions.filter'

function mockHost(
  statusSpy: jest.Mock,
  jsonSpy: jest.Mock,
  requestId = 'req_test',
): ArgumentsHost {
  const response = {
    status: statusSpy.mockReturnValue({ json: jsonSpy }),
  }
  const request = {
    method: 'GET',
    url: '/api/groups/x',
    originalUrl: '/api/groups/x',
    id: requestId,
  }
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost
}

function mockPinoLogger(): PinoLogger {
  return {
    setContext: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  } as unknown as PinoLogger
}

describe('AllExceptionsFilter', () => {
  const previousEnv = process.env.APP_ENV

  afterEach(() => {
    process.env.APP_ENV = previousEnv
  })

  it('returns CT_NOT_FOUND without stack in production body', () => {
    process.env.APP_ENV = 'production'
    const logger = mockPinoLogger()
    const filter = new AllExceptionsFilter(logger)
    const statusSpy = jest.fn()
    const jsonSpy = jest.fn()

    filter.catch(
      new NotFoundException('Grupo no encontrado'),
      mockHost(statusSpy, jsonSpy, 'req_not_found'),
    )

    expect(statusSpy).toHaveBeenCalledWith(404)
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        errorCode: 'CT_NOT_FOUND',
        message: 'Grupo no encontrado',
        requestId: 'req_not_found',
      }),
    )
    const body = jsonSpy.mock.calls[0][0] as Record<string, unknown>
    expect(body.stack).toBeUndefined()
    expect(body.error).toBeUndefined()
    expect(logger.warn).toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('maps validation-style BadRequest to CT_VALIDATION', () => {
    process.env.APP_ENV = 'testing'
    const logger = mockPinoLogger()
    const filter = new AllExceptionsFilter(logger)
    const statusSpy = jest.fn()
    const jsonSpy = jest.fn()

    filter.catch(
      new BadRequestException({
        message: ['title must be longer'],
        error: 'Bad Request',
      }),
      mockHost(statusSpy, jsonSpy),
    )

    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        errorCode: 'CT_VALIDATION',
        message: 'title must be longer',
      }),
    )
  })

  it('logs unexpected errors as error channel and hides message in production', () => {
    process.env.APP_ENV = 'production'
    const logger = mockPinoLogger()
    const filter = new AllExceptionsFilter(logger)
    const statusSpy = jest.fn()
    const jsonSpy = jest.fn()

    filter.catch(
      new Error('secret internal detail'),
      mockHost(statusSpy, jsonSpy),
    )

    expect(statusSpy).toHaveBeenCalledWith(500)
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        errorCode: 'CT_UNEXPECTED',
        message: 'Error interno del servidor',
      }),
    )
    const body = jsonSpy.mock.calls[0][0] as Record<string, unknown>
    expect(body.message).not.toContain('secret')
    expect(logger.error).toHaveBeenCalled()
    const [fields] = (logger.error as jest.Mock).mock.calls[0] as [
      Record<string, unknown>,
      string,
    ]
    expect(fields.channel).toBe('error')
    expect(fields.statusCode).toBe(500)
    expect(fields.httpMethod).toBe('GET')
    expect(fields.endpoint).toBe('/api/groups/x')
    expect(fields.err).toBeInstanceOf(Error)
  })

  it('logs Prisma KnownRequestError at error level with request context', () => {
    process.env.APP_ENV = 'production'
    const logger = mockPinoLogger()
    const filter = new AllExceptionsFilter(logger)
    const statusSpy = jest.fn()
    const jsonSpy = jest.fn()
    const prismaErr = new Prisma.PrismaClientKnownRequestError('boom', {
      code: 'P2010',
      clientVersion: 'test',
    })

    filter.catch(prismaErr, mockHost(statusSpy, jsonSpy, 'req_db'))

    expect(statusSpy).toHaveBeenCalledWith(500)
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        errorCode: 'CT_DB',
        requestId: 'req_db',
      }),
    )
    expect(logger.error).toHaveBeenCalled()
    const [fields, msg] = (logger.error as jest.Mock).mock.calls[0] as [
      Record<string, unknown>,
      string,
    ]
    expect(msg).toBe('Error de base de datos')
    expect(fields.channel).toBe('error')
    expect(fields.requestId).toBe('req_db')
    expect(fields.db).toEqual({ operation: 'query', code: 'P2010' })
  })

  it('maps Prisma initialization errors without leaking internals to the client', () => {
    process.env.APP_ENV = 'production'
    const logger = mockPinoLogger()
    const filter = new AllExceptionsFilter(logger)
    const statusSpy = jest.fn()
    const jsonSpy = jest.fn()
    const initErr = new Prisma.PrismaClientInitializationError(
      'Can’t reach database server at localhost',
      'test',
      'P1001',
    )

    filter.catch(initErr, mockHost(statusSpy, jsonSpy, 'req_init'))

    expect(statusSpy).toHaveBeenCalledWith(503)
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        errorCode: 'CT_DB',
        message: 'Base de datos no disponible',
        requestId: 'req_init',
      }),
    )
    const body = jsonSpy.mock.calls[0][0] as Record<string, unknown>
    expect(String(body.message)).not.toContain('localhost')
    expect(logger.error).toHaveBeenCalled()
    const [fields] = (logger.error as jest.Mock).mock.calls[0] as [
      Record<string, unknown>,
      string,
    ]
    expect(fields.db).toEqual({ operation: 'init', code: 'P1001' })
    expect(fields.err).toBe(initErr)
  })
})
