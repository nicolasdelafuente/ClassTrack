import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { LeaveGroupDto } from './dto/me.dto';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('courses/:courseId/groups')
  listCourseGroups(
    @Headers('x-user-id') userId: string | undefined,
    @Param('courseId') courseId: string,
  ) {
    return this.meService.listCourseGroups(requireUserId(userId), courseId);
  }

  @Post('groups/:groupId/join')
  joinGroup(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
  ) {
    return this.meService.joinGroup(requireUserId(userId), groupId);
  }

  @Post('groups/:groupId/leave')
  leaveGroup(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
    @Body() body: LeaveGroupDto,
  ) {
    return this.meService.leaveGroup(
      requireUserId(userId),
      groupId,
      body.reason,
    );
  }
}

function requireUserId(userId: string | undefined): string {
  if (!userId?.trim()) {
    throw new UnauthorizedException('Falta el header X-User-Id');
  }
  return userId.trim();
}
