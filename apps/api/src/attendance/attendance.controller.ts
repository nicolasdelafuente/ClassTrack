import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  AttendanceQueryDto,
  CourseIdParamDto,
  UpsertAttendanceDto,
} from './dto/attendance.dto';

@Controller('courses/:courseId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getRoster(
    @Param() params: CourseIdParamDto,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.getRoster(
      params.courseId,
      query.date,
      query.groupId,
    );
  }

  @Patch()
  upsertMark(
    @Param() params: CourseIdParamDto,
    @Body() body: UpsertAttendanceDto,
  ) {
    return this.attendanceService.upsertMark(params.courseId, body);
  }
}
