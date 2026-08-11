import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SprintStatusValue, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SPRINT_VALUES = new Set<string>(Object.values(SprintStatusValue));

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: true,
        tutor: true,
        sprintStatuses: { orderBy: { sprintNumber: 'asc' } },
        links: true,
        memberships: {
          include: { student: true },
          orderBy: { student: { fullName: 'asc' } },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    return this.toDetail(group);
  }

  async updateSprint(
    groupId: string,
    sprintNumber: number,
    status: string,
  ) {
    if (!Number.isInteger(sprintNumber) || sprintNumber < 1 || sprintNumber > 5) {
      throw new BadRequestException('sprintNumber debe ser 1…5');
    }
    if (!SPRINT_VALUES.has(status)) {
      throw new BadRequestException(
        `status inválido. Usá: ${[...SPRINT_VALUES].join(', ')}`,
      );
    }

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const sprint = await this.prisma.sprintStatus.upsert({
      where: {
        groupId_sprintNumber: { groupId, sprintNumber },
      },
      create: {
        groupId,
        sprintNumber,
        status: status as SprintStatusValue,
      },
      update: {
        status: status as SprintStatusValue,
      },
    });

    return {
      sprintNumber: sprint.sprintNumber,
      status: sprint.status,
    };
  }

  async updateLinks(
    groupId: string,
    body: {
      githubWorkspaceUrl?: string | null;
      githubRepos?: Array<{ url?: string; branch?: string | null; branches?: string[] }> | null;
      trelloUrl?: string | null;
      driveUrl?: string | null;
    },
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const data = {
      githubWorkspaceUrl: normalizeUrl(body.githubWorkspaceUrl),
      githubRepos: normalizeRepos(body.githubRepos),
      trelloUrl: normalizeUrl(body.trelloUrl),
      driveUrl: normalizeUrl(body.driveUrl),
    };

    const links = await this.prisma.groupLinks.upsert({
      where: { groupId },
      create: { groupId, ...data },
      update: data,
    });

    return toLinksDto(links);
  }

  /** Assign tutor (teacher User) or clear tutoría (CT-044). */
  async updateTutor(groupId: string, tutorUserId: string | null) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    let teacherName: string | null = null;
    let tutorId: string | null = null;

    if (tutorUserId) {
      const tutor = await this.prisma.user.findUnique({
        where: { id: tutorUserId },
      });
      if (!tutor || tutor.role !== UserRole.teacher) {
        throw new BadRequestException(
          'El tutor debe ser un usuario con rol docente',
        );
      }
      tutorId = tutor.id;
      teacherName = tutor.displayName?.trim() || tutor.email;
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        tutorUserId: tutorId,
        teacherName,
      },
      include: { tutor: true },
    });

    return {
      tutorUserId: updated.tutorUserId,
      teacherName: updated.teacherName,
      tutor: updated.tutor
        ? {
            id: updated.tutor.id,
            email: updated.tutor.email,
            displayName: updated.tutor.displayName,
          }
        : null,
    };
  }

  /** Teacher override: add student ignoring capacity / enrollment (CT-045). */
  async addMember(groupId: string, studentId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    const existingInCourse = await this.prisma.membership.findFirst({
      where: {
        studentId,
        group: { courseId: group.courseId },
      },
      include: { group: { select: { number: true } } },
    });
    if (existingInCourse) {
      throw new BadRequestException(
        `El alumno ya está en el grupo ${existingInCourse.group.number}`,
      );
    }

    await this.prisma.membership.create({
      data: { groupId, studentId },
    });

    return this.getById(groupId);
  }

  /** Teacher override: remove student from group (CT-045). */
  async removeMember(groupId: string, studentId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        groupId_studentId: { groupId, studentId },
      },
    });
    if (!membership) {
      throw new NotFoundException('El alumno no está en este grupo');
    }

    await this.prisma.membership.delete({
      where: { id: membership.id },
    });

    return this.getById(groupId);
  }

  private toDetail(
    group: Prisma.GroupGetPayload<{
      include: {
        course: true;
        tutor: true;
        sprintStatuses: true;
        links: true;
        memberships: { include: { student: true } };
      };
    }>,
  ) {
    return {
      id: group.id,
      courseId: group.courseId,
      course: {
        id: group.course.id,
        name: group.course.name,
        code: group.course.code,
      },
      number: group.number,
      name: group.name,
      projectTopic: group.projectTopic,
      capacity: group.capacity,
      teacherName: group.teacherName,
      tutorUserId: group.tutorUserId,
      tutor: group.tutor
        ? {
            id: group.tutor.id,
            email: group.tutor.email,
            displayName: group.tutor.displayName,
          }
        : null,
      sprints: group.sprintStatuses.map((s) => ({
        sprintNumber: s.sprintNumber,
        status: s.status,
      })),
      members: group.memberships.map((m) => ({
        id: m.student.id,
        fullName: m.student.fullName,
        legajo: m.student.legajo,
        email: m.student.email,
      })),
      links: group.links
        ? toLinksDto(group.links)
        : {
            githubWorkspaceUrl: null,
            githubRepos: [],
            trelloUrl: null,
            driveUrl: null,
          },
    };
  }
}

function toLinksDto(links: {
  githubWorkspaceUrl: string | null;
  githubRepos: unknown;
  trelloUrl: string | null;
  driveUrl: string | null;
}) {
  return {
    githubWorkspaceUrl: links.githubWorkspaceUrl,
    githubRepos: normalizeRepos(links.githubRepos),
    trelloUrl: links.trelloUrl,
    driveUrl: links.driveUrl,
  };
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeBranch(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  // Legacy: first entry from branches[]
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function normalizeRepos(
  value: unknown,
): Array<{ url: string; branch: string | null }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ url: string; branch: string | null }> = [];
  const seenUrls = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as {
      url?: unknown;
      branch?: unknown;
      branches?: unknown;
    };
    const url = typeof raw.url === 'string' ? raw.url.trim() : '';
    if (!url || seenUrls.has(url.toLowerCase())) continue;
    seenUrls.add(url.toLowerCase());
    out.push({
      url,
      branch: normalizeBranch(
        raw.branch !== undefined ? raw.branch : raw.branches,
      ),
    });
  }
  return out;
}
