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
    trelloUrl?: string | null;
    driveUrl?: string | null;
  };
};

type SeedPayload = {
  course: {
    name: string;
    code: string;
    isCurrent: boolean;
  };
  groups: SeedGroup[];
};

const prisma = new PrismaClient();

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

function loadPayload(): { payload: SeedPayload; source: string } {
  const dataDir = path.join(__dirname, 'data');
  const fromExcel = path.join(dataDir, 'from-excel.json');
  const demo = path.join(dataDir, 'demo.json');

  const preferExcel = process.env.SEED_FROM_EXCEL === '1' || process.env.SEED_FROM_EXCEL === 'true';
  const chosen =
    preferExcel && fs.existsSync(fromExcel)
      ? fromExcel
      : fs.existsSync(demo)
        ? demo
        : fromExcel;

  if (!fs.existsSync(chosen)) {
    throw new Error(
      `No seed file found. Run: python prisma/scripts/extract-excel.py\nLooked for: ${demo} or ${fromExcel}`,
    );
  }

  const payload = JSON.parse(fs.readFileSync(chosen, 'utf8')) as SeedPayload;
  return { payload, source: chosen };
}

async function main() {
  const { payload, source } = loadPayload();
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
  const demoStudent = await prisma.student.create({
    data: {
      fullName: 'Alumno demo',
      email: 'alumno@classtrack.local',
      legajo: 'DEMO-001',
    },
  });

  await prisma.user.createMany({
    data: [
      {
        email: 'docente@classtrack.local',
        password: 'demo123',
        displayName: 'Docente demo',
        role: 'teacher',
      },
      {
        email: 'alumno@classtrack.local',
        password: 'demo123',
        displayName: 'Alumno demo',
        role: 'student',
        studentId: demoStudent.id,
      },
    ],
  });

  const teacher = await prisma.user.findUniqueOrThrow({
    where: { email: 'docente@classtrack.local' },
  });

  const course = await prisma.course.create({
    data: {
      name: payload.course.name,
      code: payload.course.code,
      isCurrent: payload.course.isCurrent,
      maxAbsencesAllowed: DEFAULT_MAX_ABSENCES_ALLOWED,
      // Open so demo alumno can practice join/leave (CT-045)
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
    const memberCount = g.students.length + (g.number === 1 ? 1 : 0);
    const capacity = Math.max(4, memberCount);
    const group = await prisma.group.create({
      data: {
        courseId: course.id,
        number: g.number,
        name: g.name ?? `Grupo ${g.number}`,
        projectTopic: g.projectTopic ?? null,
        teacherName: g.teacherName ?? null,
        capacity,
        sprintStatuses: {
          create: [1, 2, 3, 4, 5].map((sprintNumber) => ({
            sprintNumber,
            status: demoSprintStatus(g.number, sprintNumber),
          })),
        },
        links: {
          create: {
            githubUrl: g.links?.githubUrl ?? null,
            trelloUrl: g.links?.trelloUrl ?? null,
            driveUrl: g.links?.driveUrl ?? null,
          },
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
    }

    // Put demo alumno in group 1 so student login has a real workspace (CT-054).
    if (g.number === 1) {
      await prisma.membership.create({
        data: {
          groupId: group.id,
          studentId: demoStudent.id,
        },
      });

      // Demo fichas for group 1 (CT-056): extensive realistic sheets
      // S1 start approved · S1 end approved · S2 start in review
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
              category: task.category,
              title: task.title,
              description: task.description,
              sortOrder,
            })),
          },
          comments: {
            create: [
              {
                authorUserId: teacher.id,
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
        category: TaskCategory;
        title: string;
        description: string | null;
        completed: boolean;
        incompleteReason: string | null;
        isExtra: boolean;
        extraReason: string | null;
        sourceTaskId: string | null;
        sortOrder: number;
      }> = [];

      let startIndex = 0;
      let sortOrder = 0;
      for (const outcome of DEMO_S1_END_OUTCOMES) {
        if (outcome.kind === 'extra') {
          endTaskCreates.push({
            category: outcome.category,
            title: outcome.title,
            description: outcome.description,
            completed: outcome.completed,
            incompleteReason: null,
            isExtra: true,
            extraReason: outcome.reason,
            sourceTaskId: null,
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

        if (outcome.kind === 'done') {
          endTaskCreates.push({
            category: source.category,
            title: source.title,
            description: source.description,
            completed: true,
            incompleteReason: null,
            isExtra: false,
            extraReason: null,
            sourceTaskId: source.id,
            sortOrder: sortOrder++,
          });
        } else {
          endTaskCreates.push({
            category: source.category,
            title: source.title,
            description: source.description,
            completed: false,
            incompleteReason: outcome.reason,
            isExtra: false,
            extraReason: null,
            sourceTaskId: source.id,
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
                authorUserId: teacher.id,
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
              category: task.category,
              title: task.title,
              description: task.description,
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

  // Cronograma DesApp 2026 (CT-025) — flags via domain rules (CT-026)
  for (const day of CRONOGRAMA_DESAPP_2026) {
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

  const counts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    groups: await prisma.group.count(),
    students: await prisma.student.count(),
    memberships: await prisma.membership.count(),
    sprints: await prisma.sprintStatus.count(),
    sprintSheets: await prisma.sprintSheet.count(),
    activityTypeDefaults: await prisma.courseActivityTypeDefault.count(),
    classSessions: await prisma.classSession.count(),
    classSessionItems: await prisma.classSessionItem.count(),
  };
  console.log('Seed OK', counts);
  console.log('Demo docente: docente@classtrack.local / demo123');
  console.log('Demo alumno:  alumno@classtrack.local / demo123');
  console.log(
    'Demo fichas: G1 · S1 inicio+fin extensas (aprobadas) · S2 inicio extensa (en revisión)',
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
