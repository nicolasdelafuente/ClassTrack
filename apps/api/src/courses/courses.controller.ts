import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('current')
  getCurrent() {
    return this.coursesService.getCurrent();
  }

  @Get(':courseId/groups')
  getGroups(@Param('courseId') courseId: string) {
    return this.coursesService.getGroups(courseId);
  }
}
