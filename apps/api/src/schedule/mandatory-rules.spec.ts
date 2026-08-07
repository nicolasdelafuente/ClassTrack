import { ClassActivityType, MandatorySource } from '@prisma/client'
import {
  defaultItemMandatory,
  deriveAllowsAttendance,
  deriveClassMandatory,
  deriveSessionFromItems,
  resolveClassMandatory,
} from './mandatory-rules'

describe('mandatory-rules (CT-026)', () => {
  it('solo seguimiento → clase optativa', () => {
    const session = deriveSessionFromItems([
      { activityType: ClassActivityType.seguimiento },
    ])
    expect(session.items[0].isMandatory).toBe(false)
    expect(session.isMandatory).toBe(false)
    expect(session.allowsAttendance).toBe(true)
  })

  it('teórica + seguimiento → clase obligatoria', () => {
    const session = deriveSessionFromItems([
      { activityType: ClassActivityType.teorica },
      { activityType: ClassActivityType.seguimiento },
    ])
    expect(session.items.map((i) => i.isMandatory)).toEqual([true, false])
    expect(session.isMandatory).toBe(true)
    expect(session.allowsAttendance).toBe(true)
  })

  it('review + planning → ambos ítems y clase obligatorios', () => {
    const session = deriveSessionFromItems([
      { activityType: ClassActivityType.sprint_review },
      { activityType: ClassActivityType.sprint_planning },
    ])
    expect(session.items.every((i) => i.isMandatory)).toBe(true)
    expect(session.isMandatory).toBe(true)
  })

  it('feriado → sin asistencia y no obligatorio', () => {
    const session = deriveSessionFromItems([
      { activityType: ClassActivityType.feriado },
    ])
    expect(defaultItemMandatory(ClassActivityType.feriado)).toBe(false)
    expect(session.isMandatory).toBe(false)
    expect(session.allowsAttendance).toBe(false)
    expect(
      deriveAllowsAttendance([{ activityType: ClassActivityType.feriado }]),
    ).toBe(false)
  })

  it('override manual no se pisa al recalcular', () => {
    const items = [{ isMandatory: true }, { isMandatory: false }]
    expect(deriveClassMandatory(items)).toBe(true)

    const keptOptional = resolveClassMandatory({
      mandatorySource: MandatorySource.manual,
      currentIsMandatory: false,
      items,
    })
    expect(keptOptional).toBe(false)

    const derived = resolveClassMandatory({
      mandatorySource: MandatorySource.derived,
      currentIsMandatory: false,
      items,
    })
    expect(derived).toBe(true)
  })

  it('presentacion_medio optativa; presentacion_final obligatoria', () => {
    expect(defaultItemMandatory(ClassActivityType.presentacion_medio)).toBe(
      false,
    )
    expect(defaultItemMandatory(ClassActivityType.presentacion_final)).toBe(
      true,
    )
  })
})
