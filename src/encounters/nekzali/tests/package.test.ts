import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import nekzali from '..'

describe("Nek'zali EncounterPackageV1", () => {
  it('keeps Heroic and the separate Mythic full fight playable in both runtimes', () => {
    expect(validateEncounterPackage(nekzali)).toEqual({ ok: true, package: nekzali })
    expect(nekzali.learn2d.find(scenario => scenario.id === 'nekzali_heroic_full_fight')?.status).toBe('ready')
    expect(nekzali.train3d.find(scenario => scenario.id === 'nekzali_heroic_full_fight')?.status).toBe('ready')
    expect(nekzali.learn2d.find(scenario => scenario.id === 'nekzali_mythic_well')?.status).toBe('planned')
    expect(nekzali.train3d.find(scenario => scenario.id === 'nekzali_mythic_well')?.status).toBe('planned')
    expect(nekzali.learn2d.find(scenario => scenario.id === 'nekzali_mythic_full_fight')?.status).toBe('ready')
    expect(nekzali.train3d.find(scenario => scenario.id === 'nekzali_mythic_full_fight')?.status).toBe('ready')
    expect(nekzali.timingProfiles.map(profile => profile.id)).toEqual(['nekzali_ptr_2026-08-15', 'nekzali_mythic_training_2026-08-15'])
  })

  it('uses separate circular 2D and 3D arena declarations', () => {
    expect(nekzali.learn2d[0].arena.id).toBe('nekzali_raidplan')
    expect(nekzali.train3dArenas[0]).toMatchObject({ shape: 'circle', width: 90, depth: 90 })
  })
})
