import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import {
  UpdateGroupPreliminaryCommentDto,
  UpsertStudentGradeDto,
} from './dto/grades.dto';
import { GradesService } from './grades.service';

@Controller()
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Get('courses/:courseId/grades/preliminary')
  preliminaryRoster(@Param('courseId') courseId: string) {
    return this.grades.getPreliminaryRoster(courseId);
  }

  @Get('courses/:courseId/grades/final')
  finalRoster(@Param('courseId') courseId: string) {
    return this.grades.getFinalRoster(courseId);
  }

  @Put('courses/:courseId/grades/preliminary/:studentId')
  upsertPreliminary(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Body() body: UpsertStudentGradeDto,
  ) {
    return this.grades.upsertPreliminary(courseId, studentId, body);
  }

  @Put('courses/:courseId/grades/final/:studentId')
  upsertFinal(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Body() body: UpsertStudentGradeDto,
  ) {
    return this.grades.upsertFinal(courseId, studentId, body);
  }

  @Patch('groups/:groupId/preliminary-comment')
  updateGroupComment(
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupPreliminaryCommentDto,
  ) {
    return this.grades.updateGroupPreliminaryComment(
      groupId,
      body.comment ?? null,
    );
  }
}
