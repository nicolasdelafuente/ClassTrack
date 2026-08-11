import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { SprintStatusValue, UserRole } from '@prisma/client';
import {
  parseDateOnly,
  toDateOnlyString,
} from '../attendance/attendance.service';
import { normalizeEmail } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto, DuplicateCourseDto, BroadcastEmailDto, CreateGroupStructureDto } from './dto/courses.dto';
import {
  plainTextToHtml,
  renderEmailLayout,
} from '../mail/email-layout';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

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
        memberships: {
          include: { student: true },
          orderBy: { student: { fullName: 'asc' } },
        },
        _count: { select: { memberships: true } },
      },
    });

    return groups.map((g) => ({
      id: g.id,
      number: g.number,
      name: g.name,
      projectTopic: g.projectTopic,
      teacherName: g.teacherName,
      capacity: g.capacity,
      memberCount: g._count.memberships,
      spotsLeft: Math.max(0, g.capacity - g._count.memberships),
      members: g.memberships.map((m) => ({
        id: m.student.id,
        fullName: m.student.fullName,
        legajo: m.student.legajo,
        email: m.student.email,
      })),
      sprints: g.sprintStatuses.map((s) => ({
        sprintNumber: s.sprintNumber,
        status: s.status,
      })),
      links: g.links
        ? {
            githubWorkspaceUrl: g.links.githubWorkspaceUrl,
            githubRepos: Array.isArray(g.links.githubRepos)
              ? g.links.githubRepos
              : [],
            trelloUrl: g.links.trelloUrl,
            driveUrl: g.links.driveUrl,
          }
        : null,
    }));
  }

  async setGroupEnrollment(courseId: string, open: boolean) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { groupEnrollmentOpen: open },
    });

    return {
      id: updated.id,
      groupEnrollmentOpen: updated.groupEnrollmentOpen,
    };
  }

  /**
   * Create empty group shells from batches (e.g. 10×3 + 2×4).
   * Allowed only when the course has no groups, or all groups are empty.
   */
  async createGroupStructure(courseId: string, dto: CreateGroupStructureDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        groups: {
          include: { _count: { select: { memberships: true } } },
          orderBy: { number: 'asc' },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const hasMembers = course.groups.some((g) => g._count.memberships > 0);
    if (hasMembers) {
      throw new BadRequestException(
        'No se puede armar la estructura: hay grupos con integrantes. Sacá a todos o usá una cursada vacía.',
      );
    }

    const totalNew = dto.batches.reduce((sum, b) => sum + b.count, 0);
    if (totalNew < 1) {
      throw new BadRequestException('Indicá al menos un grupo');
    }
    if (totalNew > 40) {
      throw new BadRequestException('Máximo 40 grupos por estructura');
    }

    if (course.groups.length > 0) {
      await this.prisma.group.deleteMany({ where: { courseId } });
    }

    const created: { id: string; number: number; capacity: number }[] = [];
    let nextNumber = 1;

    await this.prisma.$transaction(async (tx) => {
      for (const batch of dto.batches) {
        for (let i = 0; i < batch.count; i++) {
          const group = await tx.group.create({
            data: {
              courseId,
              number: nextNumber,
              name: `Grupo ${nextNumber}`,
              capacity: batch.capacity,
              sprintStatuses: {
                create: [1, 2, 3, 4, 5].map((sprintNumber) => ({
                  sprintNumber,
                  status: SprintStatusValue.unknown,
                })),
              },
              links: { create: {} },
            },
          });
          created.push({
            id: group.id,
            number: group.number,
            capacity: group.capacity,
          });
          nextNumber += 1;
        }
      }
    });

    const totalSpots = created.reduce((sum, g) => sum + g.capacity, 0);
    return {
      groups: created,
      meta: {
        groupCount: created.length,
        totalSpots,
      },
    };
  }

  /** Students known to the course who are not in a group yet (teacher override). */
  async listUnassignedStudents(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const assigned = await this.prisma.membership.findMany({
      where: { group: { courseId } },
      select: { studentId: true },
    });
    const assignedIds = new Set(assigned.map((m) => m.studentId));

    const [leaveLogs, invites, linkedUsers] = await Promise.all([
      this.prisma.groupLeaveLog.findMany({
        where: { group: { courseId } },
        select: { studentId: true },
      }),
      this.prisma.invite.findMany({
        where: { courseId, studentId: { not: null } },
        select: { studentId: true },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.student, studentId: { not: null } },
        select: { studentId: true },
      }),
    ]);

    const candidateIds = new Set<string>();
    for (const row of leaveLogs) candidateIds.add(row.studentId);
    for (const row of invites) {
      if (row.studentId) candidateIds.add(row.studentId);
    }
    for (const row of linkedUsers) {
      if (row.studentId) candidateIds.add(row.studentId);
    }

    if (candidateIds.size === 0) {
      return [];
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: [...candidateIds] } },
      orderBy: { fullName: 'asc' },
    });

    return students
      .filter((s) => !assignedIds.has(s.id))
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        legajo: s.legajo,
        email: s.email,
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
          groupEnrollmentOpen: false,
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
              capacity: group.capacity,
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

  /** Students in the course with email, ready to invite (CT-042). */
  async listInviteCandidates(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const memberships = await this.prisma.membership.findMany({
      where: { group: { courseId } },
      include: {
        student: true,
        group: { select: { id: true, number: true, name: true } },
      },
      orderBy: [{ group: { number: 'asc' } }, { student: { fullName: 'asc' } }],
    });

    const withEmail = memberships.filter((m) => m.student.email?.trim());
    const emails = [
      ...new Set(
        withEmail.map((m) => normalizeEmail(m.student.email!)),
      ),
    ];

    const [users, pendingInvites] = await Promise.all([
      emails.length
        ? this.prisma.user.findMany({
            where: { email: { in: emails } },
            select: { email: true },
          })
        : Promise.resolve([]),
      emails.length
        ? this.prisma.invite.findMany({
            where: {
              courseId,
              email: { in: emails },
              usedAt: null,
              expiresAt: { gt: new Date() },
            },
            select: { email: true },
          })
        : Promise.resolve([]),
    ]);

    const registered = new Set(users.map((u) => u.email));
    const pending = new Set(pendingInvites.map((i) => i.email));

    return withEmail.map((m) => {
      const email = normalizeEmail(m.student.email!);
      return {
        studentId: m.student.id,
        fullName: m.student.fullName,
        email,
        legajo: m.student.legajo,
        group: {
          id: m.group.id,
          number: m.group.number,
          name: m.group.name,
        },
        alreadyRegistered: registered.has(email),
        invitePending: pending.has(email),
      };
    });
  }

  async createInvite(courseId: string, dto: CreateInviteDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const email = normalizeEmail(dto.email);
    const role = dto.role as UserRole;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Ese email ya tiene una cuenta');
    }

    let studentId: string | null = null;
    let studentName: string | null = null;

    if (role === UserRole.student) {
      const membership = await this.prisma.membership.findFirst({
        where: {
          group: { courseId },
          student: {
            email: { equals: email },
          },
        },
        include: { student: true },
      });
      // SQLite may be case-sensitive — also try scan
      let matched = membership;
      if (!matched) {
        const all = await this.prisma.membership.findMany({
          where: { group: { courseId }, student: { email: { not: null } } },
          include: { student: true },
        });
        matched =
          all.find(
            (m) => m.student.email && normalizeEmail(m.student.email) === email,
          ) ?? null;
      }
      if (!matched) {
        throw new BadRequestException(
          'Ese email no está en el roster de la cursada',
        );
      }
      studentId = matched.student.id;
      studentName = matched.student.fullName;
    }

    // Invalidate previous unused invites for same email+course
    await this.prisma.invite.updateMany({
      where: {
        courseId,
        email,
        usedAt: null,
      },
      data: { expiresAt: new Date() },
    });

    const token = randomBytes(24).toString('hex');
    const invite = await this.prisma.invite.create({
      data: {
        token,
        email,
        role,
        courseId,
        studentId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    const webBase = (
      process.env.WEB_APP_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const inviteUrl = `${webBase}/register?token=${token}`;
    const roleLabel = role === UserRole.teacher ? 'docente' : 'alumno';

    const mailResult = await this.mail.sendInviteEmail({
      toEmail: email,
      toName: studentName,
      roleLabel,
      inviteUrl,
      courseName: course.name,
    });

    return {
      inviteId: invite.id,
      email: invite.email,
      role: invite.role,
      inviteUrl,
      emailed: mailResult.emailed,
      redirected: mailResult.redirected ?? false,
      appEnv: mailResult.appEnv ?? null,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  /** Recipients with email for compose UI preview (CT-043). */
  async listEmailRecipients(
    courseId: string,
    audience: 'all' | 'group' | 'student',
    groupId?: string,
    studentId?: string,
  ) {
    const recipients = await this.resolveEmailRecipients(
      courseId,
      audience,
      groupId,
      studentId,
    );
    return {
      total: recipients.length,
      recipients: recipients.map((r) => ({
        studentId: r.studentId ?? null,
        email: r.email,
        fullName: r.name,
        groupNumber: r.groupNumber ?? null,
      })),
    };
  }

  /** Teacher broadcast email to all / group / student (CT-043). */
  async broadcastEmail(courseId: string, dto: BroadcastEmailDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    const subject = dto.subject.trim();
    const body = dto.body.trim();
    if (!subject || !body) {
      throw new BadRequestException('Asunto y mensaje son obligatorios');
    }

    const recipients = await this.resolveEmailRecipients(
      courseId,
      dto.audience,
      dto.groupId,
      dto.studentId,
    );
    if (recipients.length === 0) {
      throw new BadRequestException(
        'No hay destinatarios con email para esa audiencia',
      );
    }

    const bodyHtml = plainTextToHtml(body);
    const html = renderEmailLayout({
      title: subject,
      preheader: body.slice(0, 120),
      bodyHtml,
      footerNote: `${course.name} (${course.code}) · Enviado desde ClassTrack`,
    });

    const mailResult = await this.mail.sendHtmlEmail({
      to: recipients.map((r) => ({ email: r.email, name: r.name })),
      subject: `[ClassTrack] ${subject}`,
      html,
      text: `${subject}\n\n${body}\n\n— ${course.name}`,
    });

    return {
      total: recipients.length,
      sent: mailResult.emailed
        ? mailResult.redirected
          ? 1
          : recipients.length
        : 0,
      failed: mailResult.emailed ? 0 : recipients.length,
      emailed: mailResult.emailed,
      reason: mailResult.reason ?? null,
      appEnv: mailResult.appEnv ?? null,
      redirected: mailResult.redirected ?? false,
      intendedRecipients: mailResult.intendedRecipients ?? recipients.map((r) => r.email),
      recipientsPreview: (
        mailResult.intendedRecipients ?? recipients.map((r) => r.email)
      ).slice(0, 8),
    };
  }

  private async resolveEmailRecipients(
    courseId: string,
    audience: 'all' | 'group' | 'student',
    groupId?: string,
    studentId?: string,
  ): Promise<
    {
      email: string
      name: string
      studentId?: string
      groupNumber?: number
    }[]
  > {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Cursada no encontrada');
    }

    if (audience === 'student') {
      if (!studentId?.trim()) {
        throw new BadRequestException('studentId es obligatorio');
      }
      const membership = await this.prisma.membership.findFirst({
        where: {
          studentId,
          group: { courseId },
        },
        include: {
          student: true,
          group: { select: { number: true } },
        },
      });
      if (!membership) {
        throw new BadRequestException(
          'Ese alumno no pertenece a la cursada',
        );
      }
      const email = membership.student.email?.trim();
      if (!email) {
        throw new BadRequestException('Ese alumno no tiene email');
      }
      return [
        {
          email: normalizeEmail(email),
          name: membership.student.fullName,
          studentId: membership.student.id,
          groupNumber: membership.group.number,
        },
      ];
    }

    if (audience === 'group') {
      if (!groupId?.trim()) {
        throw new BadRequestException('groupId es obligatorio');
      }
      const group = await this.prisma.group.findFirst({
        where: { id: groupId, courseId },
      });
      if (!group) {
        throw new BadRequestException('Ese grupo no pertenece a la cursada');
      }
    }

    const memberships = await this.prisma.membership.findMany({
      where: {
        group: {
          courseId,
          ...(audience === 'group' && groupId ? { id: groupId } : {}),
        },
        student: { email: { not: null } },
      },
      include: {
        student: true,
        group: { select: { number: true } },
      },
      orderBy: [
        { group: { number: 'asc' } },
        { student: { fullName: 'asc' } },
      ],
    });

    const byEmail = new Map<
      string,
      {
        email: string
        name: string
        studentId?: string
        groupNumber?: number
      }
    >();
    for (const m of memberships) {
      const raw = m.student.email?.trim();
      if (!raw) continue;
      const email = normalizeEmail(raw);
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          email,
          name: m.student.fullName,
          studentId: m.student.id,
          groupNumber: m.group.number,
        });
      }
    }
    return [...byEmail.values()];
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
