import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  GroupIdParamDto,
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
}
