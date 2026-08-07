import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ClassMandatoryRulesService } from './class-mandatory-rules.service'
import { ScheduleController } from './schedule.controller'
import { ScheduleService } from './schedule.service'

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleController],
  providers: [ClassMandatoryRulesService, ScheduleService],
  exports: [ClassMandatoryRulesService, ScheduleService],
})
export class ScheduleModule {}
