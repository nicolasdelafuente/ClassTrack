import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ClassActivityType,
  MandatorySource,
} from '@prisma/client'
import {
  parseDateOnly,
  toDateOnlyString,
} from '../attendance/attendance.service'
import { PrismaService } from '../prisma/prisma.service'
import { ClassMandatoryRulesService } from './class-mandatory-rules.service'
import { ALL_ACTIVITY_TYPES } from './course-policy-defaults'
import {
  CreateItemDto,
  CreateSessionDto,
  UpdateItemDto,
  UpdatePolicyDto,
  UpdateSessionDto,
} from './dto/schedule.dto'

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: ClassMandatoryRulesService,
  ) {}

  async getSchedule(courseId: string) {
    const course = await this.requireCourse(courseId)
    const [sessions, defaults] = await Promise.all([
      this.prisma.classSession.findMany({
        where: { courseId },
        orderBy: { date: 'asc' },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.courseActivityTypeDefault.findMany({
        where: { courseId },
        orderBy: { activityType: 'asc' },
      }),
    ])

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        maxAbsencesAllowed: course.maxAbsencesAllowed,
      },
      activityTypeDefaults: defaults.map((d) => ({
        activityType: d.activityType,
        isMandatoryByDefault: d.isMandatoryByDefault,
        allowsAttendance: d.allowsAttendance,
      })),
      sessions: sessions.map((s) => this.mapSession(s)),
    }
  }

  async getPolicy(courseId: string) {
    const course = await this.requireCourse(courseId)
    const defaults = await this.prisma.courseActivityTypeDefault.findMany({
      where: { courseId },
      orderBy: { activityType: 'asc' },
    })
    return {
      courseId: course.id,
      maxAbsencesAllowed: course.maxAbsencesAllowed,
      activityTypeDefaults: defaults.map((d) => ({
        activityType: d.activityType,
        isMandatoryByDefault: d.isMandatoryByDefault,
        allowsAttendance: d.allowsAttendance,
      })),
    }
  }

  async updatePolicy(courseId: string, body: UpdatePolicyDto) {
    await this.requireCourse(courseId)

    if (body.maxAbsencesAllowed !== undefined) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { maxAbsencesAllowed: body.maxAbsencesAllowed },
      })
    }

    if (body.activityTypeDefaults?.length) {
      for (const row of body.activityTypeDefaults) {
        await this.prisma.courseActivityTypeDefault.upsert({
          where: {
            courseId_activityType: {
              courseId,
              activityType: row.activityType,
            },
          },
          create: {
            courseId,
            activityType: row.activityType,
            isMandatoryByDefault: row.isMandatoryByDefault,
            allowsAttendance: row.allowsAttendance,
          },
          update: {
            isMandatoryByDefault: row.isMandatoryByDefault,
            allowsAttendance: row.allowsAttendance,
          },
        })
      }
    }

    return this.getPolicy(courseId)
  }

  async createSession(courseId: string, body: CreateSessionDto) {
    await this.requireCourse(courseId)
    const date = parseDateOnly(body.date)
    const existing = await this.prisma.classSession.findUnique({
      where: { courseId_date: { courseId, date } },
    })
    if (existing) {
      throw new ConflictException('Ya existe una clase en esa fecha')
    }

    const typeRules = await this.rules.getRulesForCourse(courseId)
    const items = body.items.map((item, index) => ({
      title: item.title.trim(),
      sortOrder: index,
      activityType: item.activityType,
      isMandatory:
        item.isMandatory ??
        this.rules.defaultItemMandatory(item.activityType, typeRules),
    }))

    const allowsAttendance = this.rules.deriveAllowsAttendance(
      items,
      typeRules,
    )
    const derivedMandatory = this.rules.deriveClassMandatory(items)
    const manual = body.isMandatory !== undefined
    const isMandatory = manual ? body.isMandatory! : derivedMandatory

    const created = await this.prisma.classSession.create({
      data: {
        courseId,
        date,
        isMandatory,
        mandatorySource: manual
          ? MandatorySource.manual
          : MandatorySource.derived,
        allowsAttendance,
        items: { create: items },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })

    return this.mapSession(created)
  }

  async updateSession(
    courseId: string,
    sessionId: string,
    body: UpdateSessionDto,
  ) {
    const session = await this.requireSession(courseId, sessionId)

    if (body.date) {
      const date = parseDateOnly(body.date)
      const clash = await this.prisma.classSession.findFirst({
        where: {
          courseId,
          date,
          NOT: { id: sessionId },
        },
      })
      if (clash) {
        throw new ConflictException('Ya existe una clase en esa fecha')
      }
      session.date = date
    }

    let mandatorySource = session.mandatorySource
    let isMandatory = session.isMandatory

    if (body.useDerivedMandatory) {
      mandatorySource = MandatorySource.derived
      isMandatory = this.rules.deriveClassMandatory(session.items)
    } else if (body.isMandatory !== undefined) {
      mandatorySource = MandatorySource.manual
      isMandatory = body.isMandatory
    }

    const typeRules = await this.rules.getRulesForCourse(courseId)
    const allowsAttendance = this.rules.deriveAllowsAttendance(
      session.items,
      typeRules,
    )

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        date: session.date,
        isMandatory,
        mandatorySource,
        allowsAttendance,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })

    return this.mapSession(updated)
  }

  async deleteSession(courseId: string, sessionId: string) {
    await this.requireSession(courseId, sessionId)
    await this.prisma.classSession.delete({ where: { id: sessionId } })
    return { ok: true }
  }

  async createItem(
    courseId: string,
    sessionId: string,
    body: CreateItemDto,
  ) {
    const session = await this.requireSession(courseId, sessionId)
    const typeRules = await this.rules.getRulesForCourse(courseId)
    const sortOrder =
      body.sortOrder ??
      (session.items.length === 0
        ? 0
        : Math.max(...session.items.map((i) => i.sortOrder)) + 1)

    await this.prisma.classSessionItem.create({
      data: {
        classSessionId: sessionId,
        title: body.title.trim(),
        activityType: body.activityType,
        sortOrder,
        isMandatory:
          body.isMandatory ??
          this.rules.defaultItemMandatory(body.activityType, typeRules),
      },
    })

    return this.recalcAndReturnSession(courseId, sessionId)
  }

  async updateItem(
    courseId: string,
    sessionId: string,
    itemId: string,
    body: UpdateItemDto,
  ) {
    await this.requireSession(courseId, sessionId)
    const item = await this.prisma.classSessionItem.findFirst({
      where: { id: itemId, classSessionId: sessionId },
    })
    if (!item) {
      throw new NotFoundException('Ítem no encontrado')
    }

    const typeRules = await this.rules.getRulesForCourse(courseId)
    const nextType = body.activityType ?? item.activityType
    let nextMandatory = item.isMandatory
    if (body.isMandatory !== undefined) {
      nextMandatory = body.isMandatory
    } else if (body.activityType && body.activityType !== item.activityType) {
      nextMandatory = this.rules.defaultItemMandatory(nextType, typeRules)
    }

    await this.prisma.classSessionItem.update({
      where: { id: itemId },
      data: {
        title: body.title?.trim() ?? item.title,
        activityType: nextType,
        isMandatory: nextMandatory,
        sortOrder: body.sortOrder ?? item.sortOrder,
      },
    })

    return this.recalcAndReturnSession(courseId, sessionId)
  }

  async deleteItem(courseId: string, sessionId: string, itemId: string) {
    const session = await this.requireSession(courseId, sessionId)
    const item = session.items.find((i) => i.id === itemId)
    if (!item) {
      throw new NotFoundException('Ítem no encontrado')
    }
    if (session.items.length <= 1) {
      throw new BadRequestException(
        'La clase debe tener al menos un ítem. Eliminá la clase entera si hace falta.',
      )
    }
    await this.prisma.classSessionItem.delete({ where: { id: itemId } })
    return this.recalcAndReturnSession(courseId, sessionId)
  }

  private async recalcAndReturnSession(courseId: string, sessionId: string) {
    const session = await this.requireSession(courseId, sessionId)
    const typeRules = await this.rules.getRulesForCourse(courseId)
    const allowsAttendance = this.rules.deriveAllowsAttendance(
      session.items,
      typeRules,
    )
    const isMandatory = this.rules.resolveClassMandatory({
      mandatorySource: session.mandatorySource,
      currentIsMandatory: session.isMandatory,
      items: session.items,
    })

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: { allowsAttendance, isMandatory },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    return this.mapSession(updated)
  }

  private mapSession(session: {
    id: string
    date: Date
    isMandatory: boolean
    mandatorySource: MandatorySource
    allowsAttendance: boolean
    items: {
      id: string
      title: string
      sortOrder: number
      activityType: ClassActivityType
      isMandatory: boolean
    }[]
  }) {
    return {
      id: session.id,
      date: toDateOnlyString(session.date),
      isMandatory: session.isMandatory,
      mandatorySource: session.mandatorySource,
      allowsAttendance: session.allowsAttendance,
      items: session.items.map((item) => ({
        id: item.id,
        title: item.title,
        sortOrder: item.sortOrder,
        activityType: item.activityType,
        isMandatory: item.isMandatory,
      })),
    }
  }

  private async requireCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    })
    if (!course) {
      throw new NotFoundException('Cursada no encontrada')
    }
    return course
  }

  private async requireSession(courseId: string, sessionId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, courseId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!session) {
      throw new NotFoundException('Clase no encontrada')
    }
    return session
  }
}

/** Ensure every activity type has a default row (used by seed/UI). */
export function assertKnownActivityTypes(types: ClassActivityType[]) {
  for (const t of types) {
    if (!ALL_ACTIVITY_TYPES.includes(t)) {
      throw new BadRequestException(`Tipo de actividad inválido: ${t}`)
    }
  }
}
