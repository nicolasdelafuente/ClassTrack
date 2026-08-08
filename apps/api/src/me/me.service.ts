import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MIN_LEAVE_REASON = 5;

/**
 * Student self-service for group enrollment (CT-045).
 * Identity comes from X-User-Id (MVP; same as client-side auth).
 */
@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

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
