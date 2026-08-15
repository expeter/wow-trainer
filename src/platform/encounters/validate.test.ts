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
      expect(result.errors).toContain('Scenario "sentinels_helical_toxins" references unknown ability "missing_ability".')
    }
  })

  it('returns a diagnostic instead of throwing for malformed nested fields', () => {
    const malformed = {
      apiVersion: 1,
      manifest: {},
      tacticSchema: {},
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
})
