import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SprintStatusValue } from '@prisma/client';
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
      githubUrl?: string | null;
      trelloUrl?: string | null;
      driveUrl?: string | null;
    },
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const data = {
      githubUrl: normalizeUrl(body.githubUrl),
      trelloUrl: normalizeUrl(body.trelloUrl),
      driveUrl: normalizeUrl(body.driveUrl),
    };

    const links = await this.prisma.groupLinks.upsert({
      where: { groupId },
      create: { groupId, ...data },
      update: data,
    });

    return {
      githubUrl: links.githubUrl,
      trelloUrl: links.trelloUrl,
      driveUrl: links.driveUrl,
    };
  }

  private toDetail(
    group: Prisma.GroupGetPayload<{
      include: {
        course: true;
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
      teacherName: group.teacherName,
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
        ? {
            githubUrl: group.links.githubUrl,
            trelloUrl: group.links.trelloUrl,
            driveUrl: group.links.driveUrl,
          }
        : { githubUrl: null, trelloUrl: null, driveUrl: null },
    };
  }
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
