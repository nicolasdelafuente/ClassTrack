import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import {
  CourseIdParamDto,
  CreateItemDto,
  CreateSessionDto,
  ItemIdParamDto,
  SessionIdParamDto,
  UpdateItemDto,
  UpdatePolicyDto,
  UpdateSessionDto,
} from './dto/schedule.dto'
import { ScheduleService } from './schedule.service'

@Controller('courses/:courseId/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  getSchedule(@Param() params: CourseIdParamDto) {
    return this.scheduleService.getSchedule(params.courseId)
  }

  @Get('policy')
  getPolicy(@Param() params: CourseIdParamDto) {
    return this.scheduleService.getPolicy(params.courseId)
  }

  @Patch('policy')
  updatePolicy(
    @Param() params: CourseIdParamDto,
    @Body() body: UpdatePolicyDto,
  ) {
    return this.scheduleService.updatePolicy(params.courseId, body)
  }

  @Post('sessions')
  createSession(
    @Param() params: CourseIdParamDto,
    @Body() body: CreateSessionDto,
  ) {
    return this.scheduleService.createSession(params.courseId, body)
  }

  @Patch('sessions/:sessionId')
  updateSession(
    @Param() params: SessionIdParamDto,
    @Body() body: UpdateSessionDto,
  ) {
    return this.scheduleService.updateSession(
      params.courseId,
      params.sessionId,
      body,
    )
  }

  @Delete('sessions/:sessionId')
  deleteSession(@Param() params: SessionIdParamDto) {
    return this.scheduleService.deleteSession(
      params.courseId,
      params.sessionId,
    )
  }

  @Post('sessions/:sessionId/items')
  createItem(
    @Param() params: SessionIdParamDto,
    @Body() body: CreateItemDto,
  ) {
    return this.scheduleService.createItem(
      params.courseId,
      params.sessionId,
      body,
    )
  }

  @Patch('sessions/:sessionId/items/:itemId')
  updateItem(
    @Param() params: ItemIdParamDto,
    @Body() body: UpdateItemDto,
  ) {
    return this.scheduleService.updateItem(
      params.courseId,
      params.sessionId,
      params.itemId,
      body,
    )
  }

  @Delete('sessions/:sessionId/items/:itemId')
  deleteItem(@Param() params: ItemIdParamDto) {
    return this.scheduleService.deleteItem(
      params.courseId,
      params.sessionId,
      params.itemId,
    )
  }
}
