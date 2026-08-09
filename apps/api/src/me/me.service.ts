import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  buildSprintWindows,
  toSprintCalendarDto,
} from '../courses/sprint-windows';
import { PrismaService } from '../prisma/prisma.service';

const MIN_LEAVE_REASON = 5;

/**
 * Student self-service: enrollment (CT-045) + profile / sprint calendar (CT-E09).
 * Identity comes from X-User-Id (MVP; same as client-side auth).
 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Own roster fields from the Excel/padrón (CT-074). */
  async getProfile(userId: string) {
    const { user, studentId } = await this.requireStudentUser(userId);
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    const membership = await this.prisma.membership.findFirst({
      where: { studentId },
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

    return {
      student: {
        id: student.id,
        legajo: student.legajo,
        fullName: student.fullName,
        email: student.email,
      },
      account: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      group: membership
        ? {
            id: membership.group.id,
            number: membership.group.number,
            name: membership.group.name,
            courseId: membership.group.courseId,
            course: membership.group.course,
          }
        : null,
    };
  }

  /** Sprint windows from cronograma (CT-073). */
  async getSprintCalendar(userId: string, courseId: string) {
    await this.requireStudentUser(userId);
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const sessions = await this.prisma.classSession.findMany({
      where: { courseId },
      orderBy: { date: 'asc' },
      include: {
        items: {
          select: { activityType: true, title: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const windows = buildSprintWindows(
      sessions.map((s) => ({
        date: s.date,
        items: s.items.map((i) => ({
          activityType: i.activityType,
          title: i.title,
        })),
      })),
    );

    return {
      course: { id: course.id, name: course.name, code: course.code },
      ...toSprintCalendarDto(windows),
    };
  }

  /** Group roster + teacher sprint evals (read-only) — CT-076 / CT-077. */
  async getMyGroupDetail(userId: string, groupId: string) {
    const { studentId } = await this.requireStudentUser(userId);
    const membership = await this.prisma.membership.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (!membership) {
      throw new ForbiddenException('No sos integrante de este grupo');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: { select: { id: true, name: true, code: true } },
        memberships: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                legajo: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        sprintStatuses: { orderBy: { sprintNumber: 'asc' } },
      },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    return {
      group: {
        id: group.id,
        number: group.number,
        name: group.name,
        projectTopic: group.projectTopic,
        capacity: group.capacity,
        courseId: group.courseId,
        course: group.course,
      },
      members: group.memberships.map((m) => ({
        id: m.student.id,
        fullName: m.student.fullName,
        legajo: m.student.legajo,
        email: m.student.email,
        isMe: m.studentId === studentId,
      })),
      sprints: group.sprintStatuses.map((s) => ({
        sprintNumber: s.sprintNumber,
        status: s.status,
      })),
    };
  }

  async listCourseGroups(userId: string, courseId: string) {
    const { studentId } = await this.requireStudentUser(userId);

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const groups = await this.prisma.group.findMany({
      where: { courseId },
      orderBy: { number: 'asc' },
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          where: { studentId },
          select: { id: true },
        },
      },
    });

    const myMembership = await this.prisma.membership.findFirst({
      where: {
        studentId,
        group: { courseId },
      },
      include: {
        group: { select: { id: true, number: true, name: true } },
      },
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        groupEnrollmentOpen: course.groupEnrollmentOpen,
      },
      myGroup: myMembership
        ? {
            id: myMembership.group.id,
            number: myMembership.group.number,
            name: myMembership.group.name,
          }
        : null,
      groups: groups.map((g) => {
        const memberCount = g._count.memberships;
        return {
          id: g.id,
          number: g.number,
          name: g.name,
          capacity: g.capacity,
          memberCount,
          spotsLeft: Math.max(0, g.capacity - memberCount),
          isMine: g.memberships.length > 0,
        };
      }),
    };
  }

  async joinGroup(userId: string, groupId: string) {
    const { studentId } = await this.requireStudentUser(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: true,
        _count: { select: { memberships: true } },
      },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    if (!group.course.groupEnrollmentOpen) {
      throw new BadRequestException(
        'La inscripción a grupos está cerrada. Pedile al docente que la abra.',
      );
    }

    const alreadyInCourse = await this.prisma.membership.findFirst({
      where: {
        studentId,
        group: { courseId: group.courseId },
      },
      include: { group: { select: { number: true } } },
    });
    if (alreadyInCourse) {
      throw new BadRequestException(
        alreadyInCourse.groupId === groupId
          ? 'Ya estás en este grupo'
          : `Ya estás en el grupo ${alreadyInCourse.group.number}. Salí primero si querés cambiar.`,
      );
    }

    if (group._count.memberships >= group.capacity) {
      throw new BadRequestException('Ese grupo ya no tiene cupo');
    }

    await this.prisma.membership.create({
      data: { groupId, studentId },
    });

    return this.listCourseGroups(userId, group.courseId);
  }

  async leaveGroup(userId: string, groupId: string, reason: string) {
    const { studentId } = await this.requireStudentUser(userId);
    const trimmed = reason.trim();
    if (trimmed.length < MIN_LEAVE_REASON) {
      throw new BadRequestException(
        `La justificación debe tener al menos ${MIN_LEAVE_REASON} caracteres`,
      );
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { course: true },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }
    if (!group.course.groupEnrollmentOpen) {
      throw new BadRequestException(
        'La inscripción a grupos está cerrada. Pedile al docente que la abra.',
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        groupId_studentId: { groupId, studentId },
      },
    });
    if (!membership) {
      throw new BadRequestException('No estás en este grupo');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.groupLeaveLog.create({
        data: {
          studentId,
          groupId,
          reason: trimmed,
        },
      });
      await tx.membership.delete({ where: { id: membership.id } });
    });

    return this.listCourseGroups(userId, group.courseId);
  }

  private async requireStudentUser(userId: string) {
    const trimmed = userId?.trim();
    if (!trimmed) {
      throw new UnauthorizedException('Falta X-User-Id');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: trimmed },
    });
    if (!user || user.role !== UserRole.student) {
      throw new UnauthorizedException('Solo alumnos pueden usar este endpoint');
    }
    if (!user.studentId) {
      throw new BadRequestException(
        'Tu cuenta no está vinculada a un alumno del roster. Pedile al docente una invitación.',
      );
    }

    return { user, studentId: user.studentId };
  }
}
