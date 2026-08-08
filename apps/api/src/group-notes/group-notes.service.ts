import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGroupNoteDto } from './dto/group-notes.dto';

/**
 * Teacher follow-up notes per group (CT-049).
 * Author attribution is required — every note stores the teacher who wrote it.
 */
@Injectable()
export class GroupNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForGroup(groupId: string) {
    await this.requireGroup(groupId);
    const notes = await this.prisma.groupNote.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
      },
    });
    return notes.map((n) => this.toDto(n));
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
      include: {
        author: { select: { id: true, displayName: true, email: true } },
      },
    });
    return this.toDto(note);
  }

  async update(noteId: string, userId: string | undefined, dto: UpsertGroupNoteDto) {
    await this.requireTeacher(userId);
    await this.requireNote(noteId);
    const title = this.cleanTitle(dto.title);
    const body = this.cleanBody(dto.body);

    const note = await this.prisma.groupNote.update({
      where: { id: noteId },
      data: { title, body },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
      },
    });
    return this.toDto(note);
  }

  async remove(noteId: string, userId: string | undefined) {
    await this.requireTeacher(userId);
    await this.requireNote(noteId);
    await this.prisma.groupNote.delete({ where: { id: noteId } });
    return { ok: true };
  }

  private toDto(note: {
    id: string;
    groupId: string;
    title: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; displayName: string | null; email: string };
  }) {
    const authorLabel =
      note.author.displayName?.trim() || note.author.email;
    return {
      id: note.id,
      groupId: note.groupId,
      title: note.title,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      author: {
        id: note.author.id,
        displayName: note.author.displayName,
        email: note.author.email,
        label: authorLabel,
      },
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

  /** Notes always need a real teacher so we can show authorship. */
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
