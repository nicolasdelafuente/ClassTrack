import { PrismaClient, SprintStatusValue } from '@prisma/client';
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
    const memberCount = g.students.length;
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
    activityTypeDefaults: await prisma.courseActivityTypeDefault.count(),
    classSessions: await prisma.classSession.count(),
    classSessionItems: await prisma.classSessionItem.count(),
  };
  console.log('Seed OK', counts);
  console.log('Demo docente: docente@classtrack.local / demo123');
  console.log('Demo alumno:  alumno@classtrack.local / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
