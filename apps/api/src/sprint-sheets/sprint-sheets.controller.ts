import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RequestChangesDto,
  SheetIdParamDto,
  SprintParamDto,
  UpdateSheetTasksDto,
} from './dto/sprint-sheets.dto';
import { SprintSheetsService } from './sprint-sheets.service';

@Controller()
export class SprintSheetsController {
  constructor(private readonly sheets: SprintSheetsService) {}

  // ── Teacher ────────────────────────────────────────────────

  @Get('courses/:courseId/sprint-sheets')
  listCourseSheets(
    @Param('courseId') courseId: string,
    @Query('sprint') sprint?: string,
    @Query('status') status?: string,
  ) {
    const sprintNum = sprint ? Number(sprint) : undefined;
    return this.sheets.listCourseSheets(courseId, {
      sprint:
        sprintNum != null && Number.isFinite(sprintNum)
          ? sprintNum
          : undefined,
      status,
    });
  }

  @Get('groups/:groupId/sprints/:sprintNumber/sheets')
  getGroupSprintSheets(@Param() params: SprintParamDto) {
    return this.sheets.getGroupSprintSheets(
      params.groupId,
      params.sprintNumber,
    );
  }

  @Get('sheets/:sheetId')
  getSheet(@Param() params: SheetIdParamDto) {
    return this.sheets.getSheetById(params.sheetId);
  }

  @Post('sheets/:sheetId/approve')
  approve(
    @Param() params: SheetIdParamDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.sheets.approveSheet(params.sheetId, userId);
  }

  @Post('sheets/:sheetId/request-changes')
  requestChanges(
    @Param() params: SheetIdParamDto,
    @Body() body: RequestChangesDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId?.trim()) {
      throw new UnauthorizedException('Falta X-User-Id');
    }
    return this.sheets.requestChanges(
      params.sheetId,
      body.comment,
      userId,
    );
  }

  // ── Student (/me) ──────────────────────────────────────────

  @Get('me/my-group')
  myGroup(
    @Headers('x-user-id') userId: string | undefined,
    @Query('courseId') courseId?: string,
  ) {
    return this.sheets.studentMyGroup(requireUserId(userId), courseId);
  }

  @Get('me/groups/:groupId/sprint-sheets')
  studentOverview(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
  ) {
    return this.sheets.studentSprintOverview(requireUserId(userId), groupId);
  }

  @Get('me/groups/:groupId/sprints/:sprintNumber/sheets')
  studentGetSheets(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
    @Param('sprintNumber', ParseIntPipe) sprintNumber: number,
  ) {
    return this.sheets.studentGetSheets(
      requireUserId(userId),
      groupId,
      sprintNumber,
    );
  }

  @Post('me/groups/:groupId/sprints/:sprintNumber/sheets/start')
  createStart(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
    @Param('sprintNumber', ParseIntPipe) sprintNumber: number,
  ) {
    return this.sheets.createStartSheet(
      requireUserId(userId),
      groupId,
      sprintNumber,
    );
  }

  @Post('me/groups/:groupId/sprints/:sprintNumber/sheets/end')
  createEnd(
    @Headers('x-user-id') userId: string | undefined,
    @Param('groupId') groupId: string,
    @Param('sprintNumber', ParseIntPipe) sprintNumber: number,
  ) {
    return this.sheets.createEndSheet(
      requireUserId(userId),
      groupId,
      sprintNumber,
    );
  }

  @Patch('me/sheets/:sheetId')
  updateTasks(
    @Headers('x-user-id') userId: string | undefined,
    @Param() params: SheetIdParamDto,
    @Body() body: UpdateSheetTasksDto,
  ) {
    return this.sheets.updateSheetTasks(
      requireUserId(userId),
      params.sheetId,
      body.tasks,
    );
  }

  @Post('me/sheets/:sheetId/submit')
  submit(
    @Headers('x-user-id') userId: string | undefined,
    @Param() params: SheetIdParamDto,
  ) {
    return this.sheets.submitSheet(requireUserId(userId), params.sheetId);
  }
}

function requireUserId(userId: string | undefined): string {
  if (!userId?.trim()) {
    throw new UnauthorizedException('Falta el header X-User-Id');
  }
  return userId.trim();
}
