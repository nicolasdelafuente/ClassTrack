import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ClassMandatoryRulesService } from './class-mandatory-rules.service'

@Module({
  imports: [PrismaModule],
  providers: [ClassMandatoryRulesService],
  exports: [ClassMandatoryRulesService],
})
export class ScheduleModule {}
