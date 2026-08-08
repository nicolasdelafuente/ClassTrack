import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertStudentGradeDto } from './dto/grades.dto';

/**
 * Preliminary (CT-047) and final (CT-048) grades: 1–10 or A (absent).
 */
@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreliminaryRoster(courseId: string) {
    await this.requireCourse(courseId);
    const groups = await this.loadGroups(courseId);
    const grades = await this.prisma.preliminaryGrade.findMany({
      where: { courseId },
    });
    const byStudent = new Map(grades.map((g) => [g.studentId, g]));

    return {
      courseId,
      kind: 'preliminary' as const,
      groups: groups.map((g) => ({
        id: g.id,
        number: g.number,
        name: g.name,
        preliminaryGroupComment: g.preliminaryGroupComment,
        students: g.memberships.map((m) => {
          const grade = byStudent.get(m.studentId);
          return {
            id: m.student.id,
            fullName: m.student.fullName,
            legajo: m.student.legajo,
            email: m.student.email,
            score: grade?.score ?? null,
            isAbsent: grade?.isAbsent ?? false,
            comment: grade?.comment ?? null,
            hasMark: Boolean(grade && (grade.isAbsent || grade.score != null)),
          };
        }),
      })),
    };
  }

  async getFinalRoster(courseId: string) {
    await this.requireCourse(courseId);
    const groups = await this.loadGroups(courseId);
    const grades = await this.prisma.finalGrade.findMany({
      where: { courseId },
    });
    const byStudent = new Map(grades.map((g) => [g.studentId, g]));

    return {
      courseId,
      kind: 'final' as const,
      groups: groups.map((g) => ({
        id: g.id,
        number: g.number,
        name: g.name,
        students: g.memberships.map((m) => {
          const grade = byStudent.get(m.studentId);
          return {
            id: m.student.id,
            fullName: m.student.fullName,
            legajo: m.student.legajo,
            email: m.student.email,
            score: grade?.score ?? null,
            isAbsent: grade?.isAbsent ?? false,
            hasMark: Boolean(grade && (grade.isAbsent || grade.score != null)),
          };
        }),
      })),
    };
  }

  async upsertPreliminary(
    courseId: string,
    studentId: string,
    dto: UpsertStudentGradeDto,
  ) {
    await this.requireStudentInCourse(courseId, studentId);

    if (dto.clear) {
      await this.prisma.preliminaryGrade.deleteMany({
        where: { courseId, studentId },
      });
      return {
        studentId,
        score: null,
        isAbsent: false,
        comment: null,
        hasMark: false,
      };
    }

    const existing = await this.prisma.preliminaryGrade.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });

    const comment =
      dto.comment === undefined
        ? existing?.comment ?? null
        : dto.comment?.trim() || null;

    let score: number | null;
    let isAbsent: boolean;

    if (dto.isAbsent) {
      score = null;
      isAbsent = true;
    } else if (dto.score != null) {
      const parsed = this.parseScore(dto.score);
      score = parsed;
      isAbsent = false;
    } else if (existing) {
      // Comment-only update (or no mark change)
      score = existing.score;
      isAbsent = existing.isAbsent;
    } else if (dto.comment !== undefined) {
      // Comment without mark yet
      score = null;
      isAbsent = false;
    } else {
      throw new BadRequestException(
        'Indicá score (1–10), isAbsent: true, clear: true, o un comment',
      );
    }

    const grade = await this.prisma.preliminaryGrade.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      create: {
        courseId,
        studentId,
        score,
        isAbsent,
        comment,
      },
      update: {
        score,
        isAbsent,
        comment,
      },
    });

    return {
      studentId,
      score: grade.score,
      isAbsent: grade.isAbsent,
      comment: grade.comment,
      hasMark: grade.isAbsent || grade.score != null,
    };
  }

  async upsertFinal(
    courseId: string,
    studentId: string,
    dto: UpsertStudentGradeDto,
  ) {
    await this.requireStudentInCourse(courseId, studentId);

    if (dto.clear) {
      await this.prisma.finalGrade.deleteMany({
        where: { courseId, studentId },
      });
      return {
        studentId,
        score: null,
        isAbsent: false,
        hasMark: false,
      };
    }

    const data = this.parseMarkRequired(dto);

    const grade = await this.prisma.finalGrade.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      create: {
        courseId,
        studentId,
        score: data.score,
        isAbsent: data.isAbsent,
      },
      update: {
        score: data.score,
        isAbsent: data.isAbsent,
      },
    });

    return {
      studentId,
      score: grade.score,
      isAbsent: grade.isAbsent,
      hasMark: grade.isAbsent || grade.score != null,
    };
  }

  async updateGroupPreliminaryComment(groupId: string, comment: string | null) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { preliminaryGroupComment: comment?.trim() || null },
    });

    return {
      groupId: updated.id,
      preliminaryGroupComment: updated.preliminaryGroupComment,
    };
  }

  private parseScore(score: number): number {
    const n = Number(score);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      throw new BadRequestException('La nota debe ser un entero de 1 a 10');
    }
    return n;
  }

  private parseMarkRequired(dto: UpsertStudentGradeDto): {
    score: number | null;
    isAbsent: boolean;
  } {
    if (dto.isAbsent) {
      return { score: null, isAbsent: true };
    }
    if (dto.score == null) {
      throw new BadRequestException(
        'Indicá score (1–10), isAbsent: true, o clear: true',
      );
    }
    return { score: this.parseScore(dto.score), isAbsent: false };
  }

  private async requireCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Cursada no encontrada');
    return course;
  }

  private async loadGroups(courseId: string) {
    return this.prisma.group.findMany({
      where: { courseId },
      orderBy: { number: 'asc' },
      include: {
        memberships: {
          include: { student: true },
          orderBy: { student: { fullName: 'asc' } },
        },
      },
    });
  }

  private async requireStudentInCourse(courseId: string, studentId: string) {
    await this.requireCourse(courseId);
    const membership = await this.prisma.membership.findFirst({
      where: { studentId, group: { courseId } },
    });
    if (!membership) {
      throw new BadRequestException(
        'El alumno no pertenece a un grupo de esta cursada',
      );
    }
  }
}
