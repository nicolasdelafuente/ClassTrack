import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UpsertGroupNoteDto } from './dto/group-notes.dto';
import { GroupNotesService } from './group-notes.service';

@Controller()
export class GroupNotesController {
  constructor(private readonly notes: GroupNotesService) {}

  @Get('groups/:groupId/notes')
  list(@Param('groupId') groupId: string) {
    return this.notes.listForGroup(groupId);
  }

  @Post('groups/:groupId/notes')
  create(
    @Param('groupId') groupId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: UpsertGroupNoteDto,
  ) {
    return this.notes.create(groupId, userId, body);
  }

  @Patch('notes/:noteId')
  update(
    @Param('noteId') noteId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: UpsertGroupNoteDto,
  ) {
    return this.notes.update(noteId, userId, body);
  }

  @Delete('notes/:noteId')
  remove(
    @Param('noteId') noteId: string,
    @Headers('x-user-id') userId: string | undefined,
  ) {
    return this.notes.remove(noteId, userId);
  }
}
