import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  SheetKind,
  SheetStatus,
  TaskCategory,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SheetTaskInputDto } from './dto/sprint-sheets.dto';

const MIN_REASON = 5;
const EDITABLE: SheetStatus[] = [SheetStatus.draft, SheetStatus.needs_changes];

/**
 * Sprint start/end sheets per group (CT-046).
 */
@Injectable()
export class SprintSheetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Teacher ───────────────────────────────────────────────

  async listCourseSheets(
    courseId: string,
    filters?: { sprint?: number; status?: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Cursada no encontrada');

    const statusFilter =
      filters?.status &&
      Object.values(SheetStatus).includes(filters.status as SheetStatus)
        ? (filters.status as SheetStatus)
        : undefined;

    const sheets = await this.prisma.sprintSheet.findMany({
      where: {
        group: { courseId },
        ...(filters?.sprint != null
          ? { sprintNumber: filters.sprint }
          : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        group: { select: { id: true, number: true, name: true } },
        _count: { select: { tasks: true, comments: true } },
      },
      orderBy: [
        { status: 'asc' },
        { sprintNumber: 'asc' },
        { group: { number: 'asc' } },
      ],
    });

    return sheets.map((s) => ({
      id: s.id,
      kind: s.kind,
      status: s.status,
      sprintNumber: s.sprintNumber,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      approvedAt: s.approvedAt?.toISOString() ?? null,
      taskCount: s._count.tasks,
      commentCount: s._count.comments,
      group: s.group,
    }));
  }

  async getGroupSprintSheets(groupId: string, sprintNumber: number) {
    this.assertSprint(sprintNumber);
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, number: true, name: true, courseId: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const sheets = await this.prisma.sprintSheet.findMany({
      where: { groupId, sprintNumber },
      include: this.sheetInclude(),
    });

    return {
      group,
      sprintNumber,
      start: this.toSheetDto(sheets.find((s) => s.kind === SheetKind.start)),
      end: this.toSheetDto(sheets.find((s) => s.kind === SheetKind.end)),
    };
  }

  async getSheetById(sheetId: string) {
    const sheet = await this.prisma.sprintSheet.findUnique({
      where: { id: sheetId },
      include: {
        ...this.sheetInclude(),
        group: {
          select: { id: true, number: true, name: true, courseId: true },
        },
      },
    });
    if (!sheet) throw new NotFoundException('Ficha no encontrada');
    return {
      group: sheet.group,
      sheet: this.toSheetDto(sheet),
    };
  }

  async approveSheet(sheetId: string, teacherUserId?: string) {
    await this.requireTeacher(teacherUserId);
    const sheet = await this.requireSheet(sheetId);
    if (sheet.status !== SheetStatus.in_review) {
      throw new BadRequestException(
        'Solo se pueden aprobar fichas en revisión',
      );
    }
    const updated = await this.prisma.sprintSheet.update({
      where: { id: sheetId },
      data: {
        status: SheetStatus.approved,
        approvedAt: new Date(),
      },
      include: this.sheetInclude(),
    });
    return this.toSheetDto(updated);
  }

  async requestChanges(
    sheetId: string,
    comment: string,
    teacherUserId: string,
  ) {
    if (!teacherUserId?.trim()) {
      throw new UnauthorizedException(
        'Falta X-User-Id del docente para comentar',
      );
    }
    const teacher = await this.requireTeacher(teacherUserId);
    const sheet = await this.requireSheet(sheetId);
    if (sheet.status !== SheetStatus.in_review) {
      throw new BadRequestException(
        'Solo se pueden pedir cambios a fichas en revisión',
      );
    }
    const body = comment.trim();
    if (body.length < MIN_REASON) {
      throw new BadRequestException(
        `El comentario debe tener al menos ${MIN_REASON} caracteres`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.sprintSheetComment.create({
        data: {
          sheetId,
          authorUserId: teacher.id,
          body,
        },
      });
      return tx.sprintSheet.update({
        where: { id: sheetId },
        data: {
          status: SheetStatus.needs_changes,
          submittedAt: null,
        },
        include: this.sheetInclude(),
      });
    });

    return this.toSheetDto(updated);
  }

  // ─── Student ───────────────────────────────────────────────

  async studentSprintOverview(userId: string, groupId: string) {
    await this.requireGroupMember(userId, groupId);
    const sheets = await this.prisma.sprintSheet.findMany({
      where: { groupId },
      select: {
        id: true,
        sprintNumber: true,
        kind: true,
        status: true,
      },
    });

    const bySprint = [1, 2, 3, 4, 5].map((n) => {
      const start = sheets.find(
        (s) => s.sprintNumber === n && s.kind === SheetKind.start,
      );
      const end = sheets.find(
        (s) => s.sprintNumber === n && s.kind === SheetKind.end,
      );
      return {
        sprintNumber: n,
        start: start
          ? { id: start.id, status: start.status }
          : null,
        end: end ? { id: end.id, status: end.status } : null,
      };
    });

    return { groupId, sprints: bySprint };
  }

  async studentGetSheets(
    userId: string,
    groupId: string,
    sprintNumber: number,
  ) {
    await this.requireGroupMember(userId, groupId);
    return this.getGroupSprintSheets(groupId, sprintNumber);
  }

  async createStartSheet(
    userId: string,
    groupId: string,
    sprintNumber: number,
  ) {
    await this.requireGroupMember(userId, groupId);
    this.assertSprint(sprintNumber);

    const existing = await this.prisma.sprintSheet.findUnique({
      where: {
        groupId_sprintNumber_kind: {
          groupId,
          sprintNumber,
          kind: SheetKind.start,
        },
      },
    });
    if (existing) {
      return this.getSheetById(existing.id);
    }

    const sheet = await this.prisma.sprintSheet.create({
      data: {
        groupId,
        sprintNumber,
        kind: SheetKind.start,
        status: SheetStatus.draft,
      },
      include: this.sheetInclude(),
    });

    return {
      group: (
        await this.prisma.group.findUniqueOrThrow({
          where: { id: groupId },
          select: { id: true, number: true, name: true, courseId: true },
        })
      ),
      sheet: this.toSheetDto(sheet),
    };
  }

  async createEndSheet(
    userId: string,
    groupId: string,
    sprintNumber: number,
  ) {
    await this.requireGroupMember(userId, groupId);
    this.assertSprint(sprintNumber);

    const start = await this.prisma.sprintSheet.findUnique({
      where: {
        groupId_sprintNumber_kind: {
          groupId,
          sprintNumber,
          kind: SheetKind.start,
        },
      },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!start || start.status !== SheetStatus.approved) {
      throw new BadRequestException(
        'La ficha de fin requiere que la de inicio esté aprobada',
      );
    }

    const existing = await this.prisma.sprintSheet.findUnique({
      where: {
        groupId_sprintNumber_kind: {
          groupId,
          sprintNumber,
          kind: SheetKind.end,
        },
      },
    });
    if (existing) {
      return this.getSheetById(existing.id);
    }

    const sheet = await this.prisma.sprintSheet.create({
      data: {
        groupId,
        sprintNumber,
        kind: SheetKind.end,
        status: SheetStatus.draft,
        tasks: {
          create: start.tasks.map((t, index) => ({
            category: t.category,
            title: t.title,
            description: t.description,
            completed: null,
            isExtra: false,
            sourceTaskId: t.id,
            sortOrder: index,
          })),
        },
      },
      include: this.sheetInclude(),
    });

    return {
      group: (
        await this.prisma.group.findUniqueOrThrow({
          where: { id: groupId },
          select: { id: true, number: true, name: true, courseId: true },
        })
      ),
      sheet: this.toSheetDto(sheet),
    };
  }

  async updateSheetTasks(
    userId: string,
    sheetId: string,
    tasks: SheetTaskInputDto[],
  ) {
    const sheet = await this.requireSheet(sheetId);
    await this.requireGroupMember(userId, sheet.groupId);

    if (!EDITABLE.includes(sheet.status)) {
      throw new BadRequestException(
        'Solo se puede editar en borrador o con cambios pedidos',
      );
    }

    if (sheet.kind === SheetKind.start) {
      for (const t of tasks) {
        if (!t.title?.trim()) {
          throw new BadRequestException('Cada tarea necesita título');
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.sprintSheetTask.deleteMany({ where: { sheetId } });
      if (tasks.length === 0) return;

      await tx.sprintSheetTask.createMany({
        data: tasks.map((t, index) => ({
          sheetId,
          category: t.category as TaskCategory,
          title: t.title.trim(),
          description: t.description?.trim() || null,
          completed:
            sheet.kind === SheetKind.end
              ? t.completed === undefined
                ? null
                : t.completed
              : null,
          incompleteReason:
            sheet.kind === SheetKind.end
              ? t.incompleteReason?.trim() || null
              : null,
          isExtra: sheet.kind === SheetKind.end ? Boolean(t.isExtra) : false,
          extraReason:
            sheet.kind === SheetKind.end
              ? t.extraReason?.trim() || null
              : null,
          sourceTaskId:
            sheet.kind === SheetKind.end ? t.sourceTaskId || null : null,
          sortOrder: t.sortOrder ?? index,
        })),
      });
    });

    return this.getSheetById(sheetId);
  }

  async submitSheet(userId: string, sheetId: string) {
    const sheet = await this.requireSheet(sheetId);
    await this.requireGroupMember(userId, sheet.groupId);

    if (!EDITABLE.includes(sheet.status)) {
      throw new BadRequestException(
        'Solo se puede enviar desde borrador o cambios pedidos',
      );
    }

    const full = await this.prisma.sprintSheet.findUniqueOrThrow({
      where: { id: sheetId },
      include: { tasks: true },
    });

    if (full.kind === SheetKind.start) {
      if (full.tasks.length === 0) {
        throw new BadRequestException(
          'Agregá al menos una tarea antes de enviar',
        );
      }
      for (const t of full.tasks) {
        if (!t.title.trim()) {
          throw new BadRequestException('Hay tareas sin título');
        }
      }
    } else {
      this.validateEndSubmit(full.tasks);
    }

    const updated = await this.prisma.sprintSheet.update({
      where: { id: sheetId },
      data: {
        status: SheetStatus.in_review,
        submittedAt: new Date(),
      },
      include: this.sheetInclude(),
    });

    return this.toSheetDto(updated);
  }

  async studentMyGroup(userId: string, courseId?: string) {
    const { studentId } = await this.requireStudentUser(userId);
    const membership = await this.prisma.membership.findFirst({
      where: {
        studentId,
        ...(courseId ? { group: { courseId } } : {}),
      },
      include: {
        group: {
          select: {
            id: true,
            number: true,
            name: true,
            courseId: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) {
      return { group: null };
    }
    return {
      group: {
        id: membership.group.id,
        number: membership.group.number,
        name: membership.group.name,
        courseId: membership.group.courseId,
        course: membership.group.course,
      },
    };
  }

  // ─── Helpers ───────────────────────────────────────────────

  private validateEndSubmit(
    tasks: {
      title: string;
      completed: boolean | null;
      incompleteReason: string | null;
      isExtra: boolean;
      extraReason: string | null;
    }[],
  ) {
    if (tasks.length === 0) {
      throw new BadRequestException('La ficha de fin no tiene tareas');
    }
    for (const t of tasks) {
      if (!t.title.trim()) {
        throw new BadRequestException('Hay tareas sin título');
      }
      if (t.isExtra) {
        if (!t.extraReason || t.extraReason.trim().length < MIN_REASON) {
          throw new BadRequestException(
            `Las tareas extra necesitan motivo (≥ ${MIN_REASON} caracteres)`,
          );
        }
        continue;
      }
      if (t.completed === null || t.completed === undefined) {
        throw new BadRequestException(
          'Marcá cada tarea del plan como hecha o no hecha',
        );
      }
      if (
        t.completed === false &&
        (!t.incompleteReason ||
          t.incompleteReason.trim().length < MIN_REASON)
      ) {
        throw new BadRequestException(
          `Si no terminaron una tarea, justifiquen (≥ ${MIN_REASON} caracteres)`,
        );
      }
    }
  }

  private assertSprint(n: number) {
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new BadRequestException('sprintNumber debe ser 1…5');
    }
  }

  private async requireSheet(sheetId: string) {
    const sheet = await this.prisma.sprintSheet.findUnique({
      where: { id: sheetId },
    });
    if (!sheet) throw new NotFoundException('Ficha no encontrada');
    return sheet;
  }

  private async requireStudentUser(userId: string) {
    const trimmed = userId?.trim();
    if (!trimmed) throw new UnauthorizedException('Falta X-User-Id');
    const user = await this.prisma.user.findUnique({ where: { id: trimmed } });
    if (!user || user.role !== UserRole.student) {
      throw new UnauthorizedException('Solo alumnos');
    }
    if (!user.studentId) {
      throw new BadRequestException(
        'Tu cuenta no está vinculada a un alumno del roster',
      );
    }
    return { user, studentId: user.studentId };
  }

  private async requireGroupMember(userId: string, groupId: string) {
    const { studentId, user } = await this.requireStudentUser(userId);
    const membership = await this.prisma.membership.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (!membership) {
      throw new BadRequestException('No sos integrante de este grupo');
    }
    return { studentId, user };
  }

  private async requireTeacher(userId?: string) {
    // MVP: teacher endpoints are not strictly gated yet; if header present, validate.
    if (!userId?.trim()) {
      return { id: 'anonymous-teacher', role: UserRole.teacher };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId.trim() },
    });
    if (!user || user.role !== UserRole.teacher) {
      throw new UnauthorizedException('Solo docentes');
    }
    return user;
  }

  private sheetInclude() {
    return {
      tasks: { orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }] },
      comments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    };
  }

  private toSheetDto(sheet: {
    id: string;
    groupId: string;
    sprintNumber: number;
    kind: SheetKind;
    status: SheetStatus;
    submittedAt: Date | null;
    approvedAt: Date | null;
    updatedAt: Date;
    tasks: {
      id: string;
      category: TaskCategory;
      title: string;
      description: string | null;
      completed: boolean | null;
      incompleteReason: string | null;
      isExtra: boolean;
      extraReason: string | null;
      sourceTaskId: string | null;
      sortOrder: number;
    }[];
    comments: {
      id: string;
      body: string;
      createdAt: Date;
      author: {
        id: string;
        displayName: string | null;
        email: string;
      };
    }[];
  } | null | undefined) {
    if (!sheet) return null;
    return {
      id: sheet.id,
      groupId: sheet.groupId,
      sprintNumber: sheet.sprintNumber,
      kind: sheet.kind,
      status: sheet.status,
      submittedAt: sheet.submittedAt?.toISOString() ?? null,
      approvedAt: sheet.approvedAt?.toISOString() ?? null,
      updatedAt: sheet.updatedAt.toISOString(),
      tasks: sheet.tasks.map((t) => ({
        id: t.id,
        category: t.category,
        title: t.title,
        description: t.description,
        completed: t.completed,
        incompleteReason: t.incompleteReason,
        isExtra: t.isExtra,
        extraReason: t.extraReason,
        sourceTaskId: t.sourceTaskId,
        sortOrder: t.sortOrder,
      })),
      comments: sheet.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          displayName: c.author.displayName,
          email: c.author.email,
        },
      })),
    };
  }
}
