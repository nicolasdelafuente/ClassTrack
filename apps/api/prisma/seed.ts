import { PrismaClient, SheetKind, SheetStatus, SprintStatusValue, TaskCategory } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ALL_ACTIVITY_TYPES,
  DEFAULT_ACTIVITY_TYPE_RULES,
  DEFAULT_MAX_ABSENCES_ALLOWED,
} from '../src/schedule/course-policy-defaults';
import { deriveSessionFromItems } from '../src/schedule/mandatory-rules';
import {
  CRONOGRAMA_DESAPP_2026,
  parseSeedDate,
  shiftCronogramaSoTodayInSprint,
} from './cronograma-desapp-2026';
import {
  DEMO_S1_END_OUTCOMES,
  DEMO_S1_START_TASKS,
  DEMO_S2_START_TASKS,
} from './data/demo-sprint-sheets';

type SeedStudent = {
  fullName: string;
  email?: string | null;
  legajo?: string | null;
};

type SeedGroup = {
  number: number;
  name?: string | null;
  projectTopic?: string | null;
  teacherName?: string | null;
  students: SeedStudent[];
  links?: {
    githubUrl?: string | null;
    githubWorkspaceUrl?: string | null;
    githubRepos?: Array<{ url: string; branch?: string | null }> | null;
    trelloUrl?: string | null;
    driveUrl?: string | null;
  };
};

type SeedAttendance = {
  email: string;
  /** YYYY-MM-DD */
  date: string;
  present: boolean;
  participated?: boolean;
};

type SeedPayload = {
  course: {
    name: string;
    code: string;
    isCurrent: boolean;
  };
  groups: SeedGroup[];
  attendance?: SeedAttendance[];
};

const prisma = new PrismaClient();

/** Shared plain-text password for all seeded accounts (local MVP only). */
const SEED_PASSWORD = 'demo123';

/**
 * Workspace = org/team link. Repo = org/repo (+ one branch).
 * Legacy `githubUrl` alone: org-only → workspace; org/repo → workspace + repo@main.
 */
function seedGithubLinks(links?: SeedGroup['links']): {
  githubWorkspaceUrl: string | null;
  githubRepos: Array<{ url: string; branch: string | null }>;
} {
  if (links?.githubWorkspaceUrl || links?.githubRepos?.length) {
    return {
      githubWorkspaceUrl: links.githubWorkspaceUrl?.trim() || null,
      githubRepos: (links.githubRepos ?? [])
        .map((r) => ({
          url: r.url.trim(),
          branch: r.branch?.trim() || null,
        }))
        .filter((r) => r.url),
    };
  }

  const raw = links?.githubUrl?.trim() || null;
  if (!raw) {
    return { githubWorkspaceUrl: null, githubRepos: [] };
  }

  try {
    const u = new URL(raw);
    const parts = u.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        githubWorkspaceUrl: `${u.origin}/${parts[0]}`,
        githubRepos: [{ url: raw, branch: 'main' }],
      };
    }
    return { githubWorkspaceUrl: raw, githubRepos: [] };
  } catch {
    return { githubWorkspaceUrl: raw, githubRepos: [] };
  }
}

function teacherEmailFromName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug || 'docente'}@classtrack.local`;
}

/** Demo variety so the board is readable (not all gray). */
function demoSprintStatus(
  groupNumber: number,
  sprintNumber: number,
): SprintStatusValue {
  const roll = (groupNumber * 3 + sprintNumber * 5) % 7;
  if (sprintNumber >= 4 && groupNumber % 3 === 0) {
    return SprintStatusValue.unknown;
  }
  if (roll === 0) return SprintStatusValue.critical;
  if (roll === 1 || roll === 2) return SprintStatusValue.attention;
  if (roll === 3) return SprintStatusValue.unknown;
  return SprintStatusValue.ok;
}

function loadPayload(): {
  payload: SeedPayload;
  source: string;
  fromExcel: boolean;
} {
  const dataDir = path.join(__dirname, 'data');
  const fromExcelPath = path.join(dataDir, 'from-excel.json');
  const demo = path.join(dataDir, 'demo.json');

  const preferExcel =
    process.env.SEED_FROM_EXCEL === '1' ||
    process.env.SEED_FROM_EXCEL === 'true';
  const chosen =
    preferExcel && fs.existsSync(fromExcelPath)
      ? fromExcelPath
      : fs.existsSync(demo)
        ? demo
        : fromExcelPath;

  if (!fs.existsSync(chosen)) {
    throw new Error(
      `No seed file found. Run: python prisma/scripts/extract-excel.py\nLooked for: ${demo} or ${fromExcelPath}`,
    );
  }

  const payload = JSON.parse(fs.readFileSync(chosen, 'utf8')) as SeedPayload;
  const fromExcel = path.basename(chosen) === 'from-excel.json';
  return { payload, source: chosen, fromExcel };
}

async function main() {
  const { payload, source, fromExcel } = loadPayload();
  console.log(`Seeding from ${source}`);

  // Clean demo tables (order matters for FKs)
  await prisma.sprintSheetComment.deleteMany();
  await prisma.sprintSheetTask.deleteMany();
  await prisma.sprintSheet.deleteMany();
  await prisma.groupNoteAttachment.deleteMany();
  await prisma.groupNote.deleteMany();
  await prisma.preliminaryGrade.deleteMany();
  await prisma.finalGrade.deleteMany();
  await prisma.groupLeaveLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSessionItem.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.courseActivityTypeDefault.deleteMany();
  await prisma.sprintStatus.deleteMany();
  await prisma.groupLinks.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.course.deleteMany();

  // DEMO ONLY: plain-text passwords for local MVP (CT-038 / CT-039)
  const teacherByKey = new Map<
    string,
    { id: string; email: string; displayName: string }
  >();

  const teacherNames = [
    ...new Set(
      payload.groups
        .map((g) => g.teacherName?.trim())
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  for (const name of teacherNames) {
    const email = teacherEmailFromName(name);
    const user = await prisma.user.create({
      data: {
        email,
        password: SEED_PASSWORD,
        displayName: name,
        role: 'teacher',
      },
    });
    teacherByKey.set(name.toLowerCase(), {
      id: user.id,
      email: user.email,
      displayName: name,
    });
  }

  // Fallback teacher if Excel has no names
  if (teacherByKey.size === 0) {
    const user = await prisma.user.create({
      data: {
        email: 'docente@classtrack.local',
        password: SEED_PASSWORD,
        displayName: 'Docente',
        role: 'teacher',
      },
    });
    teacherByKey.set('docente', {
      id: user.id,
      email: user.email,
      displayName: 'Docente',
    });
  }

  const defaultTeacher = [...teacherByKey.values()][0];
  const studentIdByEmail = new Map<string, string>();

  const course = await prisma.course.create({
    data: {
      name: payload.course.name,
      code: payload.course.code,
      isCurrent: payload.course.isCurrent,
      maxAbsencesAllowed: DEFAULT_MAX_ABSENCES_ALLOWED,
      groupEnrollmentOpen: true,
      activityTypeDefaults: {
        create: ALL_ACTIVITY_TYPES.map((activityType) => {
          const rule = DEFAULT_ACTIVITY_TYPE_RULES[activityType];
          return {
            activityType,
            isMandatoryByDefault: rule.isMandatoryByDefault,
            allowsAttendance: rule.allowsAttendance,
          };
        }),
      },
    },
  });

  for (const g of payload.groups) {
    const memberCount = g.students.length;
    const capacity = Math.max(4, memberCount);
    const tutorKey = g.teacherName?.trim().toLowerCase() ?? '';
    const tutor = teacherByKey.get(tutorKey) ?? defaultTeacher;

    const group = await prisma.group.create({
      data: {
        courseId: course.id,
        number: g.number,
        name: g.name ?? `Grupo ${g.number}`,
        projectTopic: g.projectTopic ?? null,
        teacherName: g.teacherName ?? tutor.displayName,
        tutorUserId: tutor.id,
        capacity,
        sprintStatuses: {
          create: [1, 2, 3, 4, 5].map((sprintNumber) => ({
            sprintNumber,
            status: demoSprintStatus(g.number, sprintNumber),
          })),
        },
        links: {
          create: (() => {
            const github = seedGithubLinks(g.links);
            return {
              githubWorkspaceUrl: github.githubWorkspaceUrl,
              githubRepos: github.githubRepos,
              trelloUrl: g.links?.trelloUrl ?? null,
              driveUrl: g.links?.driveUrl ?? null,
            };
          })(),
        },
      },
    });

    for (const s of g.students) {
      const student = await prisma.student.create({
        data: {
          fullName: s.fullName,
          email: s.email ?? null,
          legajo: s.legajo ?? null,
        },
      });
      await prisma.membership.create({
        data: {
          groupId: group.id,
          studentId: student.id,
        },
      });

      const email = s.email?.trim().toLowerCase();
      if (email && email.includes('@')) {
        studentIdByEmail.set(email, student.id);
        await prisma.user.create({
          data: {
            email,
            password: SEED_PASSWORD,
            displayName: s.fullName,
            role: 'student',
            studentId: student.id,
          },
        });
      }
    }

    // Sample fichas for group 1 (CT-056 + CT-058):
    // S1 start approved · S1 end approved · S2 start in review
    if (g.number === 1) {
      const sheetAuthorId = tutor.id;

      const startSheet = await prisma.sprintSheet.create({
        data: {
          groupId: group.id,
          sprintNumber: 1,
          kind: SheetKind.start,
          status: SheetStatus.approved,
          submittedAt: new Date('2026-03-10T18:30:00.000Z'),
          approvedAt: new Date('2026-03-12T21:05:00.000Z'),
          tasks: {
            create: DEMO_S1_START_TASKS.map((task, sortOrder) => ({
              categories: task.categories,
              title: task.title,
              description: task.description,
              trelloLinks: task.trelloLinks ?? [],
              sortOrder,
            })),
          },
          comments: {
            create: [
              {
                authorUserId: sheetAuthorId,
                body: 'Bien el nivel de detalle. Acuerden el endpoint de perfil para el próximo sprint y no dejen el Trello a medias.',
                createdAt: new Date('2026-03-12T21:05:00.000Z'),
              },
            ],
          },
        },
        include: { tasks: true },
      });

      const startByOrder = [...startSheet.tasks].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const endTaskCreates: Array<{
        categories: TaskCategory[];
        title: string;
        description: string | null;
        completed: boolean;
        incompleteReason: string | null;
        isExtra: boolean;
        extraReason: string | null;
        sourceTaskId: string | null;
        trelloLinks: string[];
        sortOrder: number;
      }> = [];

      let startIndex = 0;
      let sortOrder = 0;
      for (const outcome of DEMO_S1_END_OUTCOMES) {
        if (outcome.kind === 'extra') {
          endTaskCreates.push({
            categories: outcome.categories,
            title: outcome.title,
            description: outcome.description,
            completed: outcome.completed,
            incompleteReason: null,
            isExtra: true,
            extraReason: outcome.reason,
            sourceTaskId: null,
            trelloLinks: [],
            sortOrder: sortOrder++,
          });
          continue;
        }

        const source = startByOrder[startIndex++];
        if (!source) {
          throw new Error(
            `Demo S1 end outcome missing start task at index ${startIndex - 1}`,
          );
        }

        const links = Array.isArray(source.trelloLinks)
          ? (source.trelloLinks as string[])
          : [];
        const categories = Array.isArray(source.categories)
          ? (source.categories as TaskCategory[])
          : [];

        if (outcome.kind === 'done') {
          endTaskCreates.push({
            categories,
            title: source.title,
            description: source.description,
            completed: true,
            incompleteReason: null,
            isExtra: false,
            extraReason: null,
            sourceTaskId: source.id,
            trelloLinks: links,
            sortOrder: sortOrder++,
          });
        } else {
          endTaskCreates.push({
            categories,
            title: source.title,
            description: source.description,
            completed: false,
            incompleteReason: outcome.reason,
            isExtra: false,
            extraReason: null,
            sourceTaskId: source.id,
            trelloLinks: links,
            sortOrder: sortOrder++,
          });
        }
      }

      await prisma.sprintSheet.create({
        data: {
          groupId: group.id,
          sprintNumber: 1,
          kind: SheetKind.end,
          status: SheetStatus.approved,
          submittedAt: new Date('2026-03-17T19:10:00.000Z'),
          approvedAt: new Date('2026-03-19T20:40:00.000Z'),
          tasks: { create: endTaskCreates },
          comments: {
            create: [
              {
                authorUserId: sheetAuthorId,
                body: 'Ok el cierre: se entiende qué quedó pendiente y por qué. Las extras suman. Aprobado.',
                createdAt: new Date('2026-03-19T20:40:00.000Z'),
              },
            ],
          },
        },
      });

      await prisma.sprintSheet.create({
        data: {
          groupId: group.id,
          sprintNumber: 2,
          kind: SheetKind.start,
          status: SheetStatus.in_review,
          submittedAt: new Date('2026-03-24T18:55:00.000Z'),
          tasks: {
            create: DEMO_S2_START_TASKS.map((task, order) => ({
              categories: task.categories,
              title: task.title,
              description: task.description,
              trelloLinks: task.trelloLinks ?? [],
              sortOrder: order,
            })),
          },
        },
      });

      await prisma.sprintStatus.updateMany({
        where: { groupId: group.id, sprintNumber: 1 },
        data: { status: SprintStatusValue.ok },
      });
      await prisma.sprintStatus.updateMany({
        where: { groupId: group.id, sprintNumber: 2 },
        data: { status: SprintStatusValue.attention },
      });
    }
  }

  // Real Excel presentismo uses official DesApp dates — do not shift.
  // Demo seed still shifts so "today" lands mid-sprint (CT-079).
  const cronograma = fromExcel
    ? CRONOGRAMA_DESAPP_2026
    : shiftCronogramaSoTodayInSprint(CRONOGRAMA_DESAPP_2026, {
        sprintNumber: 2,
        daysAfterPlanning: 7,
      });
  for (const day of cronograma) {
    const derived = deriveSessionFromItems(day.items);
    await prisma.classSession.create({
      data: {
        courseId: course.id,
        date: parseSeedDate(day.date),
        isMandatory: derived.isMandatory,
        mandatorySource: derived.mandatorySource,
        allowsAttendance: derived.allowsAttendance,
        items: {
          create: day.items.map((item, index) => ({
            title: item.title,
            sortOrder: index,
            activityType: item.activityType,
            isMandatory: derived.items[index].isMandatory,
          })),
        },
      },
    });
  }

  const attendanceDays = await prisma.classSession.findMany({
    where: { courseId: course.id, allowsAttendance: true },
    select: { date: true },
  });
  const attendanceDateKeys = new Set(
    attendanceDays.map((s) => s.date.toISOString().slice(0, 10)),
  );

  let attendanceCreated = 0;
  let attendanceSkipped = 0;
  for (const mark of payload.attendance ?? []) {
    const email = mark.email.trim().toLowerCase();
    const studentId = studentIdByEmail.get(email);
    if (!studentId) {
      attendanceSkipped += 1;
      continue;
    }
    if (!attendanceDateKeys.has(mark.date)) {
      attendanceSkipped += 1;
      continue;
    }
    await prisma.attendanceRecord.create({
      data: {
        courseId: course.id,
        studentId,
        date: parseSeedDate(mark.date),
        present: Boolean(mark.present),
        participated: Boolean(mark.participated),
      },
    });
    attendanceCreated += 1;
  }

  const teachers = [...teacherByKey.values()];
  const counts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    groups: await prisma.group.count(),
    students: await prisma.student.count(),
    memberships: await prisma.membership.count(),
    sprints: await prisma.sprintStatus.count(),
    sprintSheets: await prisma.sprintSheet.count(),
    attendanceRecords: await prisma.attendanceRecord.count(),
    activityTypeDefaults: await prisma.courseActivityTypeDefault.count(),
    classSessions: await prisma.classSession.count(),
    classSessionItems: await prisma.classSessionItem.count(),
  };
  console.log('Seed OK', counts);
  console.log(`Password for all seeded accounts: ${SEED_PASSWORD}`);
  console.log(
    'Teachers:',
    teachers.map((t) => t.email).join(', '),
  );
  console.log(
    `Attendance seeded: ${attendanceCreated} (skipped ${attendanceSkipped})`,
  );
  console.log(
    'Sample fichas: G1 · S1 inicio+fin (aprobadas) · S2 inicio (en revisión)',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
