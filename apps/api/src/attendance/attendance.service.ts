import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoster(courseId: string, dateStr: string, groupId?: string) {
    const course = await this.requireCourse(courseId);
    const date = parseDateOnly(dateStr);
    const session = await this.requireAttendanceSession(courseId, dateStr);

    if (groupId) {
      const group = await this.prisma.group.findFirst({
        where: { id: groupId, courseId },
      });
      if (!group) {
        throw new NotFoundException('Grupo no encontrado en esta cursada');
      }
    }

    const groups = await this.prisma.group.findMany({
      where: {
        courseId,
        ...(groupId ? { id: groupId } : {}),
      },
      orderBy: { number: 'asc' },
      include: {
        memberships: {
          include: { student: true },
          orderBy: { student: { fullName: 'asc' } },
        },
      },
    });

    const studentIds = groups.flatMap((g) =>
      g.memberships.map((m) => m.studentId),
    );

    const records = studentIds.length
      ? await this.prisma.attendanceRecord.findMany({
          where: {
            courseId,
            date,
            studentId: { in: studentIds },
          },
        })
      : [];

    const byStudent = new Map(
      records.map((r) => [
        r.studentId,
        { present: r.present, participated: r.participated },
      ]),
    );

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      date: toDateOnlyString(date),
      groupId: groupId ?? null,
      session: {
        id: session.id,
        date: toDateOnlyString(session.date),
        isMandatory: session.isMandatory,
        allowsAttendance: session.allowsAttendance,
        mandatorySource: session.mandatorySource,
      },
      groups: groups.map((g) => ({
        id: g.id,
        number: g.number,
        name: g.name,
        students: g.memberships.map((m) => {
          const mark = byStudent.get(m.studentId);
          return {
            id: m.student.id,
            fullName: m.student.fullName,
            legajo: m.student.legajo,
            email: m.student.email,
            present: mark?.present ?? false,
            participated: mark?.participated ?? false,
          };
        }),
      })),
    };
  }

  async upsertMark(
    courseId: string,
    body: {
      date?: string;
      studentId?: string;
      present?: boolean;
      participated?: boolean;
    },
  ) {
    await this.requireCourse(courseId);

    if (!body?.date || !body?.studentId) {
      throw new BadRequestException('date y studentId son obligatorios');
    }

    const date = parseDateOnly(body.date);
    await this.requireAttendanceSession(courseId, body.date);
    const studentId = body.studentId;

    const membership = await this.prisma.membership.findFirst({
      where: {
        studentId,
        group: { courseId },
      },
    });
    if (!membership) {
      throw new BadRequestException(
        'El alumno no pertenece a un grupo de esta cursada',
      );
    }

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        courseId_studentId_date: { courseId, studentId, date },
      },
    });

    const present =
      body.present !== undefined ? Boolean(body.present) : (existing?.present ?? false);
    const participated =
      body.participated !== undefined
        ? Boolean(body.participated)
        : (existing?.participated ?? false);

    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        courseId_studentId_date: { courseId, studentId, date },
      },
      create: {
        courseId,
        studentId,
        date,
        present,
        participated,
      },
      update: {
        present,
        participated,
      },
    });

    return {
      studentId: record.studentId,
      date: toDateOnlyString(record.date),
      present: record.present,
      participated: record.participated,
    };
  }

  private async requireAttendanceSession(courseId: string, dateStr: string) {
    const dayStart = parseDateOnly(dateStr);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const session = await this.prisma.classSession.findFirst({
      where: {
        courseId,
        date: { gte: dayStart, lt: dayEnd },
      },
    });

    if (!session) {
      throw new BadRequestException(
        'La fecha no está en el cronograma de la cursada',
      );
    }
    if (!session.allowsAttendance) {
      throw new BadRequestException(
        'Ese día es feriado / sin asistencia: no se toma lista',
      );
    }
    return session;
  }

  private async requireCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }
    return course;
  }
}

/** Store dates at UTC noon so timezone shifts don't change the calendar day. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new BadRequestException('date debe ser YYYY-MM-DD');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException('date inválida');
  }
  return date;
}

export function toDateOnlyString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateOnlyString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
