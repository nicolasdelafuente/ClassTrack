import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import {
  BroadcastEmailDto,
  CreateInviteDto,
  DuplicateCourseDto,
} from './dto/courses.dto';

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

  @Get(':courseId/invite-candidates')
  inviteCandidates(@Param('courseId') courseId: string) {
    return this.coursesService.listInviteCandidates(courseId);
  }

  @Post(':courseId/invites')
  createInvite(
    @Param('courseId') courseId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.coursesService.createInvite(courseId, dto);
  }

  @Get(':courseId/email-recipients')
  emailRecipients(
    @Param('courseId') courseId: string,
    @Query('audience') audience: 'all' | 'group' | 'student' = 'all',
    @Query('groupId') groupId?: string,
    @Query('studentId') studentId?: string,
  ) {
    const safeAudience =
      audience === 'group' || audience === 'student' ? audience : 'all';
    return this.coursesService.listEmailRecipients(
      courseId,
      safeAudience,
      groupId,
      studentId,
    );
  }

  @Post(':courseId/emails/broadcast')
  broadcastEmail(
    @Param('courseId') courseId: string,
    @Body() dto: BroadcastEmailDto,
  ) {
    return this.coursesService.broadcastEmail(courseId, dto);
  }

  @Get(':courseId/groups')
  getGroups(@Param('courseId') courseId: string) {
    return this.coursesService.getGroups(courseId);
  }
}
