import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { DuplicateCourseDto } from './dto/courses.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('current')
  getCurrent() {
    return this.coursesService.getCurrent();
  }

  @Get('current/board')
  getCurrentBoard() {
    return this.coursesService.getCurrentBoard();
  }

  @Post(':courseId/duplicate')
  duplicate(
    @Param('courseId') courseId: string,
    @Body() dto: DuplicateCourseDto,
  ) {
    return this.coursesService.duplicate(courseId, dto);
  }

  @Get(':courseId/groups')
  getGroups(@Param('courseId') courseId: string) {
    return this.coursesService.getGroups(courseId);
  }
}
