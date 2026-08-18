import { describe, expect, it } from 'vitest'
import sentinels from '../../encounters/entombed-sentinels'
import { validateEncounterPackage } from './validate'

describe('EncounterPackageV1 conformance', () => {
  it('accepts the reference package', () => {
    expect(validateEncounterPackage(sentinels)).toEqual({ ok: true, package: sentinels })
  })

  it('rejects duplicate IDs and broken scenario references', () => {
    const malformed = {
      ...sentinels,
      abilities: [...sentinels.abilities, sentinels.abilities[0]],
      learn2d: [{ ...sentinels.learn2d[0], abilityIds: ['missing_ability'] }, ...sentinels.learn2d.slice(1)],
    }
    const result = validateEncounterPackage(malformed)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('Ability ID "sentinels_dominance" is duplicated.')
      expect(result.errors).toContain('Scenario "sentinels_full_fight" references unknown ability "missing_ability".')
    }
  })

  it('returns a diagnostic instead of throwing for malformed nested fields', () => {
    const malformed = {
      apiVersion: 1,
      manifest: {},
      tacticSchema: {},
      actions: [],
      abilities: [],
      phases: [],
      roles: [],
      timingProfiles: [],
      tactics: [],
      learn2d: [],
      train3d: [],
      train3dArenas: [],
      runtimeLoaders: { learn2d: sentinels.runtimeLoaders.learn2d, train3d: sentinels.runtimeLoaders.train3d },
    }

    expect(validateEncounterPackage(malformed)).toEqual({
      ok: false,
      errors: ['Package shape is malformed.'],
    })
  })

  it('allows optional focused drills but requires exactly one full fight per mode', () => {
    const malformed = {
      ...sentinels,
      learn2d: [...sentinels.learn2d, { ...sentinels.learn2d[0], id: 'sentinels_second_full_fight' }],
    }
    const result = validateEncounterPackage(malformed)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toContain('learn2d needs exactly one full-fight scenario.')
  })

  it('rejects duplicate package action bindings', () => {
    const malformed = { ...sentinels, actions: [...sentinels.actions, { ...sentinels.actions[0], id: 'sentinels_other_main' }] }
    const result = validateEncounterPackage(malformed)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toContain('Action binding "mainAbility" is declared more than once.')
  })

  it('rejects planner maps with unknown actors or missing phase placements', () => {
    const planner = sentinels.tacticSchema.planner
    const malformed = {
      ...sentinels,
      tacticSchema: {
        ...sentinels.tacticSchema,
        planner: {
          ...planner,
          maps: [{ ...planner.maps[0], actorIds: [...planner.maps[0].actorIds, 'missing-player'], placements: {} }, ...planner.maps.slice(1)],
        },
      },
    }
    const result = validateEncounterPackage(malformed)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('Planner map "sentinels_active_cycle" references unknown actor "missing-player".')
      expect(result.errors).toContain('Planner map "sentinels_active_cycle" is missing a valid placement for "tank-1".')
    }
  })

  it('rejects incomplete, duplicate, unknown, and empty phase responsibilities', () => {
    const phase = sentinels.phases[0]
    const malformed = {
      ...sentinels,
      phases: [{
        ...phase,
        roleResponsibilities: [
          ...phase.roleResponsibilities.slice(1),
          phase.roleResponsibilities[1],
          { roleId: 'missing_role', responsibilities: [''] },
        ],
      }, ...sentinels.phases.slice(1)],
    }
    const result = validateEncounterPackage(malformed)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain(`Phase "${phase.id}" repeats role "${phase.roleResponsibilities[1].roleId}".`)
      expect(result.errors).toContain(`Phase "${phase.id}" references unknown role "missing_role".`)
      expect(result.errors).toContain(`Phase "${phase.id}" role "missing_role" needs at least one non-empty responsibility.`)
      expect(result.errors).toContain(`Phase "${phase.id}" is missing ready full-fight role "${phase.roleResponsibilities[0].roleId}".`)
    }
  })
})
