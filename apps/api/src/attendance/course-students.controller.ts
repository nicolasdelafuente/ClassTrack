import { Controller, Get, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CourseStudentParamsDto } from './dto/attendance.dto';

@Controller('courses/:courseId/students')
export class CourseStudentsController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':studentId')
  getProfile(@Param() params: CourseStudentParamsDto) {
    return this.attendanceService.getStudentProfile(
      params.courseId,
      params.studentId,
    );
  }
}
