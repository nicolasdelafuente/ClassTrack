import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [AttendanceModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
