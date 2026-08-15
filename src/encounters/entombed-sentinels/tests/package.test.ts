import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import sentinels from '..'

describe('Entombed Sentinels package boundary', () => {
  it('is a conforming PTR preview with focused Heroic and separate full-fight scenarios ready', () => {
    expect(validateEncounterPackage(sentinels).ok).toBe(true)
    expect(sentinels.manifest.availability).toBe('ptr-preview')
    const ready = ['sentinels_helical_toxins', 'sentinels_full_fight', 'sentinels_mythic_full_fight']
    expect(sentinels.learn2d.filter(scenario => scenario.status === 'ready').map(scenario => scenario.id)).toEqual(ready)
    expect(sentinels.train3d.filter(scenario => scenario.status === 'ready').map(scenario => scenario.id)).toEqual(ready)
    expect(sentinels.learn2d.find(scenario => scenario.id === 'sentinels_full_fight')?.difficulty).toBe('heroic')
    expect(sentinels.learn2d.find(scenario => scenario.id === 'sentinels_mythic_full_fight')?.difficulty).toBe('mythic')
    expect(typeof sentinels.runtimeLoaders.learn2d).toBe('function')
    expect(typeof sentinels.runtimeLoaders.train3d).toBe('function')
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
