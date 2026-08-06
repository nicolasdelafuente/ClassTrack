import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('courses/:courseId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getRoster(
    @Param('courseId') courseId: string,
    @Query('date') date: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.attendanceService.getRoster(courseId, date, groupId);
  }

  @Patch()
  upsertMark(
    @Param('courseId') courseId: string,
    @Body()
    body: {
      date?: string;
      studentId?: string;
      present?: boolean;
      participated?: boolean;
    },
  ) {
    return this.attendanceService.upsertMark(courseId, body ?? {});
  }
}
