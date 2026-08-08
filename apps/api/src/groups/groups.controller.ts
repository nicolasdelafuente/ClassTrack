import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  AddGroupMemberDto,
  GroupIdParamDto,
  GroupMemberParamsDto,
  UpdateLinksDto,
  UpdateSprintDto,
  UpdateSprintParamsDto,
  UpdateTutorDto,
} from './dto/groups.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':groupId')
  getById(@Param() params: GroupIdParamDto) {
    return this.groupsService.getById(params.groupId);
  }

  @Patch(':groupId/sprints/:sprintNumber')
  updateSprint(
    @Param() params: UpdateSprintParamsDto,
    @Body() body: UpdateSprintDto,
  ) {
    return this.groupsService.updateSprint(
      params.groupId,
      params.sprintNumber,
      body.status,
    );
  }

  @Patch(':groupId/links')
  updateLinks(
    @Param() params: GroupIdParamDto,
    @Body() body: UpdateLinksDto,
  ) {
    return this.groupsService.updateLinks(params.groupId, body);
  }

  @Patch(':groupId/tutor')
  updateTutor(
    @Param() params: GroupIdParamDto,
    @Body() body: UpdateTutorDto,
  ) {
    return this.groupsService.updateTutor(
      params.groupId,
      body.tutorUserId === undefined ? null : body.tutorUserId,
    );
  }

  @Post(':groupId/members')
  addMember(
    @Param() params: GroupIdParamDto,
    @Body() body: AddGroupMemberDto,
  ) {
    return this.groupsService.addMember(params.groupId, body.studentId);
  }

  @Delete(':groupId/members/:studentId')
  removeMember(@Param() params: GroupMemberParamsDto) {
    return this.groupsService.removeMember(params.groupId, params.studentId);
  }
}
