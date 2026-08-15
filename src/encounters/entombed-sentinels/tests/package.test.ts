import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import sentinels from '..'

describe('Entombed Sentinels package boundary', () => {
  it('is a conforming research package with both runtimes still planned', () => {
    expect(validateEncounterPackage(sentinels).ok).toBe(true)
    expect(sentinels.manifest.availability).toBe('research')
    expect([...sentinels.learn2d, ...sentinels.train3d].every(scenario => scenario.status === 'planned')).toBe(true)
  })

  it('shares vocabulary while keeping 2D and 3D arena models distinct', () => {
    const learnHelical = sentinels.learn2d.find(scenario => scenario.id === 'sentinels_helical_toxins')
    const trainHelical = sentinels.train3d.find(scenario => scenario.id === 'sentinels_helical_toxins')

    expect(learnHelical?.abilityIds).toEqual(trainHelical?.abilityIds)
    expect(learnHelical?.roleIds).toEqual(trainHelical?.roleIds)
    expect(learnHelical?.timingProfileIds).toEqual(trainHelical?.timingProfileIds)
    expect(learnHelical?.tacticIds).toEqual(trainHelical?.tacticIds)
    expect(learnHelical).toHaveProperty('arena.regions')
    expect(trainHelical).toHaveProperty('arenaId', 'sentinels_split_world')
    expect(trainHelical).not.toHaveProperty('arena')
  })

  it('keeps all research timing under the PTR profile', () => {
    expect(sentinels.timingProfiles.map(profile => profile.id)).toEqual(['ptr_2026-08-13'])
    expect(sentinels.timingProfiles[0].status).toBe('ptr')
    expect(sentinels.timingProfiles[0].values.every(value => value.provenance.asOf === '2026-08-13')).toBe(true)
  })
})
