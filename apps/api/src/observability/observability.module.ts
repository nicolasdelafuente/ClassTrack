import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { AllExceptionsFilter } from './all-exceptions.filter'
import { AuditLogger } from './audit-logger'
import { buildPinoParams } from './pino.config'

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => buildPinoParams(),
    }),
  ],
  providers: [
    AuditLogger,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [LoggerModule, AuditLogger],
})
export class ObservabilityModule {}
