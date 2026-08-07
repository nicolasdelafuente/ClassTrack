import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SprintStatusValue } from '@prisma/client';
import {
  parseDateOnly,
  toDateOnlyString,
} from '../attendance/attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { DuplicateCourseDto } from './dto/courses.dto';

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

  /**
   * Clone a course into a new quarter:
   * - policy + cronograma (dates shifted so first class = firstSessionDate)
   * - optional empty groups (no students, no links, sprints unknown)
   * - never copies attendance or memberships
   */
  async duplicate(sourceCourseId: string, dto: DuplicateCourseDto) {
    const source = await this.prisma.course.findUnique({
      where: { id: sourceCourseId },
      include: {
        activityTypeDefaults: true,
        classSessions: {
          orderBy: { date: 'asc' },
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        },
        groups: { orderBy: { number: 'asc' } },
      },
    });
    if (!source) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const name = dto.name.trim();
    const code = dto.code.trim();
    if (!name || !code) {
      throw new BadRequestException('name y code son obligatorios');
    }

    const codeTaken = await this.prisma.course.findUnique({ where: { code } });
    if (codeTaken) {
      throw new ConflictException(`Ya existe una cursada con código ${code}`);
    }

    const setAsCurrent = dto.setAsCurrent !== false;
    const copyEmptyGroups = dto.copyEmptyGroups !== false;
    const newFirst = parseDateOnly(dto.firstSessionDate);

    let dayOffset = 0;
    if (source.classSessions.length > 0) {
      const sourceFirst = source.classSessions[0].date;
      dayOffset = diffUtcCalendarDays(newFirst, sourceFirst);
    }

    const newCourse = await this.prisma.$transaction(async (tx) => {
      if (setAsCurrent) {
        await tx.course.updateMany({
          where: { isCurrent: true },
          data: { isCurrent: false },
        });
      }

      const course = await tx.course.create({
        data: {
          name,
          code,
          isCurrent: setAsCurrent,
          maxAbsencesAllowed: source.maxAbsencesAllowed,
          activityTypeDefaults: {
            create: source.activityTypeDefaults.map((d) => ({
              activityType: d.activityType,
              isMandatoryByDefault: d.isMandatoryByDefault,
              allowsAttendance: d.allowsAttendance,
            })),
          },
        },
      });

      for (const session of source.classSessions) {
        const shifted = addUtcDays(session.date, dayOffset);
        await tx.classSession.create({
          data: {
            courseId: course.id,
            date: shifted,
            isMandatory: session.isMandatory,
            mandatorySource: session.mandatorySource,
            allowsAttendance: session.allowsAttendance,
            items: {
              create: session.items.map((item) => ({
                title: item.title,
                sortOrder: item.sortOrder,
                activityType: item.activityType,
                isMandatory: item.isMandatory,
              })),
            },
          },
        });
      }

      if (copyEmptyGroups) {
        for (const group of source.groups) {
          await tx.group.create({
            data: {
              courseId: course.id,
              number: group.number,
              name: group.name,
              // Fresh quarter: keep teacher label, clear topic (new projects)
              teacherName: group.teacherName,
              projectTopic: null,
              sprintStatuses: {
                create: [1, 2, 3, 4, 5].map((sprintNumber) => ({
                  sprintNumber,
                  status: SprintStatusValue.unknown,
                })),
              },
            },
          });
        }
      }

      return course;
    });

    return {
      course: {
        id: newCourse.id,
        name: newCourse.name,
        code: newCourse.code,
        isCurrent: newCourse.isCurrent,
        maxAbsencesAllowed: newCourse.maxAbsencesAllowed,
      },
      meta: {
        sourceCourseId: source.id,
        sessionsCopied: source.classSessions.length,
        groupsCopied: copyEmptyGroups ? source.groups.length : 0,
        dayOffset,
        firstSessionDate:
          source.classSessions.length > 0
            ? toDateOnlyString(addUtcDays(source.classSessions[0].date, dayOffset))
            : dto.firstSessionDate,
      },
    };
  }
}

/** Whole UTC calendar days between two date-only values (b → a). */
function diffUtcCalendarDays(a: Date, b: Date): number {
  const aDay = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bDay = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((aDay - bDay) / 86_400_000);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
