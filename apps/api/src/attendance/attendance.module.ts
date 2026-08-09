import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { CourseStudentsController } from './course-students.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController, CourseStudentsController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
