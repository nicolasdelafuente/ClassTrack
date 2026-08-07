import {
  ClassActivityType,
  MandatorySource,
} from '@prisma/client'
import {
  ActivityTypeRule,
  DEFAULT_ACTIVITY_TYPE_RULES,
} from './course-policy-defaults'

export type ActivityRulesMap = Record<ClassActivityType, ActivityTypeRule>

export type SessionItemFlags = {
  activityType: ClassActivityType
  isMandatory: boolean
}

/** Item mandatory default from course (or global) type rules. */
export function defaultItemMandatory(
  activityType: ClassActivityType,
  rules: ActivityRulesMap = DEFAULT_ACTIVITY_TYPE_RULES,
): boolean {
  return rules[activityType].isMandatoryByDefault
}

/** Class allows attendance unless any item type forbids it (feriado). */
export function deriveAllowsAttendance(
  items: { activityType: ClassActivityType }[],
  rules: ActivityRulesMap = DEFAULT_ACTIVITY_TYPE_RULES,
): boolean {
  if (items.length === 0) return true
  return items.every((item) => rules[item.activityType].allowsAttendance)
}

/** Derived class mandatory: true if any item is mandatory. */
export function deriveClassMandatory(
  items: { isMandatory: boolean }[],
): boolean {
  if (items.length === 0) return false
  return items.some((item) => item.isMandatory)
}

/**
 * Effective class.isMandatory.
 * Respects teacher manual override — never overwritten by derivation.
 */
export function resolveClassMandatory(input: {
  mandatorySource: MandatorySource
  currentIsMandatory: boolean
  items: { isMandatory: boolean }[]
}): boolean {
  if (input.mandatorySource === MandatorySource.manual) {
    return input.currentIsMandatory
  }
  return deriveClassMandatory(input.items)
}

/** Build item flags from types using rules (seed / create helpers). */
export function buildItemFlags(
  items: { activityType: ClassActivityType; title?: string }[],
  rules: ActivityRulesMap = DEFAULT_ACTIVITY_TYPE_RULES,
): SessionItemFlags[] {
  return items.map((item) => ({
    activityType: item.activityType,
    isMandatory: defaultItemMandatory(item.activityType, rules),
  }))
}

export function deriveSessionFromItems(
  items: { activityType: ClassActivityType }[],
  rules: ActivityRulesMap = DEFAULT_ACTIVITY_TYPE_RULES,
): {
  items: SessionItemFlags[]
  isMandatory: boolean
  allowsAttendance: boolean
  mandatorySource: typeof MandatorySource.derived
} {
  const flagged = buildItemFlags(items, rules)
  return {
    items: flagged,
    isMandatory: deriveClassMandatory(flagged),
    allowsAttendance: deriveAllowsAttendance(items, rules),
    mandatorySource: MandatorySource.derived,
  }
}
