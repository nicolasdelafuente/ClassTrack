import { ClassActivityType } from '@prisma/client'

/** Default: 4 absences allowed on mandatory classes; 5th → libre. */
export const DEFAULT_MAX_ABSENCES_ALLOWED = 4

export type ActivityTypeRule = {
  isMandatoryByDefault: boolean
  /** If false, no attendance roster that day (feriado). */
  allowsAttendance: boolean
}

/**
 * Per-course defaults for activity types (CT-024).
 * Editable later via UI; seeded on every course.
 */
export const DEFAULT_ACTIVITY_TYPE_RULES: Record<
  ClassActivityType,
  ActivityTypeRule
> = {
  feriado: { isMandatoryByDefault: false, allowsAttendance: false },
  sprint_planning: { isMandatoryByDefault: true, allowsAttendance: true },
  sprint_review: { isMandatoryByDefault: true, allowsAttendance: true },
  teorica: { isMandatoryByDefault: true, allowsAttendance: true },
  presentacion_final: { isMandatoryByDefault: true, allowsAttendance: true },
  seguimiento: { isMandatoryByDefault: false, allowsAttendance: true },
  presentacion_medio: { isMandatoryByDefault: false, allowsAttendance: true },
}

export const ALL_ACTIVITY_TYPES = Object.keys(
  DEFAULT_ACTIVITY_TYPE_RULES,
) as ClassActivityType[]

/**
 * How class.isMandatory is recalculated when items change (CT-026 implements):
 * - If mandatorySource === manual → keep teacher's isMandatory (do not overwrite).
 * - Else derived: class.isMandatory = any(item.isMandatory); feriado-only → allowsAttendance false.
 */
export const CLASS_MANDATORY_RECALC_NOTE =
  'derived = any item mandatory; manual override is never overwritten by recalc'
