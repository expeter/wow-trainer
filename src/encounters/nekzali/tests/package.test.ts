import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import nekzali from '..'

describe("Nek'zali EncounterPackageV1", () => {
  it('exposes one complete full fight in both runtimes', () => {
    expect(validateEncounterPackage(nekzali)).toEqual({ ok: true, package: nekzali })
    expect(nekzali.learn2d.map(scenario => scenario.id)).toEqual(['nekzali_full_fight'])
    expect(nekzali.train3d.map(scenario => scenario.id)).toEqual(['nekzali_full_fight'])
    expect(nekzali.learn2d[0].abilityIds).toContain('nekzali_grasping_depths')
    expect(nekzali.train3d[0].abilityIds).toContain('nekzali_grasping_depths')
    expect(nekzali.timingProfiles.map(profile => profile.id)).toEqual(['nekzali_ptr_2026-08-15', 'nekzali_realm_training_2026-08-15'])
  })

  it('uses separate circular 2D and 3D arena declarations', () => {
    expect(nekzali.learn2d[0].arena.id).toBe('nekzali_raidplan')
    expect(nekzali.train3dArenas[0]).toMatchObject({ shape: 'circle', width: 90, depth: 90 })
  })
})
