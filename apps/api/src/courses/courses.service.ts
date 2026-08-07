import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent() {
    const course = await this.prisma.course.findFirst({
      where: { isCurrent: true },
    });
    if (!course) {
      throw new NotFoundException(
        'No hay cursada actual. Ejecutá el seed (npm run seed -w api).',
      );
    }
    return course;
  }

  /** Board payload in one round-trip (avoids client waterfall). */
  async getCurrentBoard() {
    const course = await this.getCurrent();
    const groups = await this.getGroups(course.id);
    return { course, groups };
  }

  async getGroups(courseId: string) {
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
        sprintStatuses: { orderBy: { sprintNumber: 'asc' } },
        links: true,
        _count: { select: { memberships: true } },
      },
    });

    return groups.map((g) => ({
      id: g.id,
      number: g.number,
      name: g.name,
      projectTopic: g.projectTopic,
      teacherName: g.teacherName,
      memberCount: g._count.memberships,
      sprints: g.sprintStatuses.map((s) => ({
        sprintNumber: s.sprintNumber,
        status: s.status,
      })),
      links: g.links
        ? {
            githubUrl: g.links.githubUrl,
            trelloUrl: g.links.trelloUrl,
            driveUrl: g.links.driveUrl,
          }
        : null,
    }));
  }
}
