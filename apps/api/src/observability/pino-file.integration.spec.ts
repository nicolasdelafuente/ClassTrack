import { INestApplication, Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino'
import { buildPinoParams } from './pino.config'

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => buildPinoParams(),
    }),
  ],
})
class PinoFileProbeModule {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('Pino file sink (integration)', () => {
  const previous = {
    LOG_TO_FILE: process.env.LOG_TO_FILE,
    LOG_DIR: process.env.LOG_DIR,
    LOG_FILE_NAME: process.env.LOG_FILE_NAME,
    LOG_FORMAT: process.env.LOG_FORMAT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    APP_ENV: process.env.APP_ENV,
  }

  let dir: string
  let app: INestApplication | undefined

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ct-pino-'))
    process.env.LOG_TO_FILE = '1'
    process.env.LOG_DIR = dir
    process.env.LOG_FILE_NAME = 'classtrack-api.jsonl'
    process.env.LOG_FORMAT = 'json'
    process.env.LOG_LEVEL = 'info'
    process.env.APP_ENV = 'testing'
  })

  afterEach(async () => {
    if (app) {
      await app.close()
      app = undefined
    }
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('boots Nest, writes a Pino JSON line to the rolling file sink', async () => {
    app = await NestFactory.create(PinoFileProbeModule, {
      bufferLogs: true,
      logger: false,
    })
    app.useLogger(app.get(Logger))
    await app.init()

    const logger = await app.resolve(PinoLogger)
    logger.setContext('PinoFileIntegration')
    logger.info(
      { channel: 'app', integrationTest: true },
      'pino file sink integration probe',
    )

    // Worker transports flush asynchronously.
    await sleep(800)
    await app.close()
    app = undefined
    await sleep(400)

    const files = readdirSync(dir).filter((name) =>
      name.includes('classtrack-api'),
    )
    expect(files.length).toBeGreaterThan(0)

    const contents = files
      .map((name) => readFileSync(join(dir, name), 'utf8'))
      .join('\n')
    expect(contents).toContain('pino file sink integration probe')

    const lines = contents
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    expect(lines.length).toBeGreaterThan(0)

    const parsed = lines.map(
      (line) => JSON.parse(line) as Record<string, unknown>,
    )
    const hit = parsed.find(
      (row) =>
        row.msg === 'pino file sink integration probe' ||
        row.message === 'pino file sink integration probe',
    )
    expect(hit).toBeDefined()
    expect(
      typeof hit!.time === 'number' || typeof hit!.time === 'string',
    ).toBe(true)
    expect(hit!.level === 30 || hit!.level === 'info').toBe(true)
  }, 20_000)
})
