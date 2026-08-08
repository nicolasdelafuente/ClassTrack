import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGroupNoteDto } from './dto/group-notes.dto';
import {
  MAX_FILES_PER_UPLOAD,
  deleteImageFromDisk,
  publicUrlForStoredName,
  saveImageToDisk,
} from './upload-storage';

type AuthorSelect = { id: string; displayName: string | null; email: string };

type AttachmentRow = {
  id: string;
  noteId: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: AuthorSelect;
};

type NoteRow = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorSelect;
  attachments: AttachmentRow[];
};

/**
 * Teacher follow-up notes (CT-049) + image attachments (CT-050).
 */
@Injectable()
export class GroupNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForGroup(groupId: string) {
    await this.requireGroup(groupId);
    const notes = await this.prisma.groupNote.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: this.noteInclude(),
    });
    return notes.map((n) => this.toNoteDto(n));
  }

  async create(groupId: string, userId: string | undefined, dto: UpsertGroupNoteDto) {
    await this.requireGroup(groupId);
    const teacher = await this.requireTeacher(userId);
    const title = this.cleanTitle(dto.title);
    const body = this.cleanBody(dto.body);

    const note = await this.prisma.groupNote.create({
      data: {
        groupId,
        authorUserId: teacher.id,
        title,
        body,
      },
      include: this.noteInclude(),
    });
    return this.toNoteDto(note);
  }

  async update(noteId: string, userId: string | undefined, dto: UpsertGroupNoteDto) {
    await this.requireTeacher(userId);
    await this.requireNote(noteId);
    const title = this.cleanTitle(dto.title);
    const body = this.cleanBody(dto.body);

    const note = await this.prisma.groupNote.update({
      where: { id: noteId },
      data: { title, body },
      include: this.noteInclude(),
    });
    return this.toNoteDto(note);
  }

  async remove(noteId: string, userId: string | undefined) {
    await this.requireTeacher(userId);
    const note = await this.prisma.groupNote.findUnique({
      where: { id: noteId },
      include: { attachments: true },
    });
    if (!note) throw new NotFoundException('Nota no encontrada');

    for (const att of note.attachments) {
      deleteImageFromDisk(att.storedName);
    }
    await this.prisma.groupNote.delete({ where: { id: noteId } });
    return { ok: true };
  }

  async addAttachments(
    noteId: string,
    userId: string | undefined,
    files: Express.Multer.File[],
  ) {
    const teacher = await this.requireTeacher(userId);
    await this.requireNote(noteId);

    if (!files?.length) {
      throw new BadRequestException('Seleccioná al menos una imagen');
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      throw new BadRequestException(
        `Máximo ${MAX_FILES_PER_UPLOAD} imágenes por carga`,
      );
    }

    const created: AttachmentRow[] = [];
    for (const file of files) {
      const storedName = saveImageToDisk({
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      });
      try {
        const row = await this.prisma.groupNoteAttachment.create({
          data: {
            noteId,
            uploadedByUserId: teacher.id,
            storedName,
            originalName: file.originalname.slice(0, 200),
            mimeType: file.mimetype,
            sizeBytes: file.size,
          },
          include: {
            uploadedBy: {
              select: { id: true, displayName: true, email: true },
            },
          },
        });
        created.push(row);
      } catch (err) {
        deleteImageFromDisk(storedName);
        throw err;
      }
    }

    return created.map((a) => this.toAttachmentDto(a));
  }

  async removeAttachment(attachmentId: string, userId: string | undefined) {
    await this.requireTeacher(userId);
    const att = await this.prisma.groupNoteAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!att) throw new NotFoundException('Adjunto no encontrado');
    deleteImageFromDisk(att.storedName);
    await this.prisma.groupNoteAttachment.delete({ where: { id: attachmentId } });
    return { ok: true };
  }

  private noteInclude() {
    return {
      author: { select: { id: true, displayName: true, email: true } },
      attachments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          uploadedBy: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    };
  }

  private toNoteDto(note: NoteRow) {
    return {
      id: note.id,
      groupId: note.groupId,
      title: note.title,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      author: this.toAuthorDto(note.author),
      attachments: note.attachments.map((a) => this.toAttachmentDto(a)),
    };
  }

  private toAttachmentDto(att: AttachmentRow) {
    return {
      id: att.id,
      noteId: att.noteId,
      url: publicUrlForStoredName(att.storedName),
      originalName: att.originalName,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
      createdAt: att.createdAt.toISOString(),
      uploadedBy: this.toAuthorDto(att.uploadedBy),
    };
  }

  private toAuthorDto(user: AuthorSelect) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      label: user.displayName?.trim() || user.email,
    };
  }

  private cleanTitle(raw: string) {
    const title = raw?.trim() ?? '';
    if (!title) throw new BadRequestException('El título es obligatorio');
    if (title.length > 120) {
      throw new BadRequestException('El título no puede superar 120 caracteres');
    }
    return title;
  }

  private cleanBody(raw: string) {
    const body = raw?.trim() ?? '';
    if (!body) throw new BadRequestException('La nota no puede estar vacía');
    if (body.length > 5000) {
      throw new BadRequestException('La nota no puede superar 5000 caracteres');
    }
    return body;
  }

  private async requireGroup(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  private async requireNote(noteId: string) {
    const note = await this.prisma.groupNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  private async requireTeacher(userId?: string) {
    const trimmed = userId?.trim();
    if (!trimmed) {
      throw new UnauthorizedException(
        'Tenés que estar logueado como docente para escribir notas',
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id: trimmed } });
    if (!user || user.role !== UserRole.teacher) {
      throw new UnauthorizedException('Solo docentes pueden gestionar notas');
    }
    return user;
  }
}
