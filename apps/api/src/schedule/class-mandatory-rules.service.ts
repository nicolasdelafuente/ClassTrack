import { Injectable } from '@nestjs/common'
import {
  ClassActivityType,
  MandatorySource,
} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  ALL_ACTIVITY_TYPES,
  DEFAULT_ACTIVITY_TYPE_RULES,
} from './course-policy-defaults'
import {
  ActivityRulesMap,
  defaultItemMandatory,
  deriveAllowsAttendance,
  deriveClassMandatory,
  deriveSessionFromItems,
  resolveClassMandatory,
} from './mandatory-rules'

@Injectable()
export class ClassMandatoryRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Load course type defaults; fill gaps from global defaults. */
  async getRulesForCourse(courseId: string): Promise<ActivityRulesMap> {
    const rows = await this.prisma.courseActivityTypeDefault.findMany({
      where: { courseId },
    })
    const rules: ActivityRulesMap = { ...DEFAULT_ACTIVITY_TYPE_RULES }
    for (const row of rows) {
      rules[row.activityType] = {
        isMandatoryByDefault: row.isMandatoryByDefault,
        allowsAttendance: row.allowsAttendance,
      }
    }
    for (const type of ALL_ACTIVITY_TYPES) {
      if (!rules[type]) {
        rules[type] = DEFAULT_ACTIVITY_TYPE_RULES[type]
      }
    }
    return rules
  }

  defaultItemMandatory(
    activityType: ClassActivityType,
    rules?: ActivityRulesMap,
  ): boolean {
    return defaultItemMandatory(activityType, rules)
  }

  deriveClassMandatory(items: { isMandatory: boolean }[]): boolean {
    return deriveClassMandatory(items)
  }

  deriveAllowsAttendance(
    items: { activityType: ClassActivityType }[],
    rules?: ActivityRulesMap,
  ): boolean {
    return deriveAllowsAttendance(items, rules)
  }

  resolveClassMandatory(input: {
    mandatorySource: MandatorySource
    currentIsMandatory: boolean
    items: { isMandatory: boolean }[]
  }): boolean {
    return resolveClassMandatory(input)
  }

  deriveSessionFromItems(
    items: { activityType: ClassActivityType }[],
    rules?: ActivityRulesMap,
  ) {
    return deriveSessionFromItems(items, rules)
  }
}
