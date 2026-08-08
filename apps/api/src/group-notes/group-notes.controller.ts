import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UpsertGroupNoteDto } from './dto/group-notes.dto';
import { GroupNotesService } from './group-notes.service';
import {
  ALLOWED_IMAGE_MIME,
  MAX_FILES_PER_UPLOAD,
  MAX_IMAGE_BYTES,
} from './upload-storage';

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

  /** Upload one or more images onto an existing note (CT-050). */
  @Post('notes/:noteId/attachments')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_UPLOAD, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_FILES_PER_UPLOAD },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
          cb(
            new Error(
              `Formato no permitido (${file.originalname}). Usá JPEG, PNG, WebP o GIF.`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  addAttachments(
    @Param('noteId') noteId: string,
    @Headers('x-user-id') userId: string | undefined,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.notes.addAttachments(noteId, userId, files ?? []);
  }

  @Delete('note-attachments/:attachmentId')
  removeAttachment(
    @Param('attachmentId') attachmentId: string,
    @Headers('x-user-id') userId: string | undefined,
  ) {
    return this.notes.removeAttachment(attachmentId, userId);
  }
}
