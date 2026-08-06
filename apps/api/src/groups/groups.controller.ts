import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':groupId')
  getById(@Param('groupId') groupId: string) {
    return this.groupsService.getById(groupId);
  }

  @Patch(':groupId/sprints/:sprintNumber')
  updateSprint(
    @Param('groupId') groupId: string,
    @Param('sprintNumber') sprintNumber: string,
    @Body() body: { status?: string },
  ) {
    return this.groupsService.updateSprint(
      groupId,
      Number(sprintNumber),
      body?.status ?? '',
    );
  }

  @Patch(':groupId/links')
  updateLinks(
    @Param('groupId') groupId: string,
    @Body()
    body: {
      githubUrl?: string | null;
      trelloUrl?: string | null;
      driveUrl?: string | null;
    },
  ) {
    return this.groupsService.updateLinks(groupId, body ?? {});
  }
}
