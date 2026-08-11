import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import {
  BroadcastEmailDto,
  CreateGroupStructureDto,
  CreateInviteDto,
  DuplicateCourseDto,
  UpdateGroupEnrollmentDto,
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
    @Headers('x-user-id') userId?: string,
  ) {
    return this.coursesService.createInvite(courseId, dto, userId);
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
    @Headers('x-user-id') userId?: string,
  ) {
    return this.coursesService.broadcastEmail(courseId, dto, userId);
  }

  @Get(':courseId/emails')
  listSentEmails(
    @Param('courseId') courseId: string,
    @Query('category') category?: string,
  ) {
    return this.coursesService.listSentEmails(courseId, category);
  }

  @Get(':courseId/emails/:emailId')
  getSentEmail(
    @Param('courseId') courseId: string,
    @Param('emailId') emailId: string,
  ) {
    return this.coursesService.getSentEmail(courseId, emailId);
  }

  @Get(':courseId/groups')
  getGroups(@Param('courseId') courseId: string) {
    return this.coursesService.getGroups(courseId);
  }

  @Post(':courseId/groups/structure')
  createGroupStructure(
    @Param('courseId') courseId: string,
    @Body() dto: CreateGroupStructureDto,
  ) {
    return this.coursesService.createGroupStructure(courseId, dto);
  }

  @Patch(':courseId/group-enrollment')
  setGroupEnrollment(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateGroupEnrollmentDto,
  ) {
    return this.coursesService.setGroupEnrollment(courseId, dto.open);
  }

  @Get(':courseId/unassigned-students')
  unassignedStudents(@Param('courseId') courseId: string) {
    return this.coursesService.listUnassignedStudents(courseId);
  }
}
