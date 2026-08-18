import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import vashnik from '..'

describe('Vashnik EncounterPackageV1', () => {
  it('exposes one conforming full fight in both runtimes', () => {
    expect(validateEncounterPackage(vashnik)).toEqual({ ok: true, package: vashnik })
    expect(vashnik.learn2d.map(scenario => scenario.id)).toEqual(['vashnik_full_fight'])
    expect(vashnik.train3d.map(scenario => scenario.id)).toEqual(['vashnik_full_fight'])
    expect(vashnik.learn2d[0].abilityIds).toEqual(vashnik.train3d[0].abilityIds)
    expect(vashnik.manifest.availability).toBe('ptr-preview')
  })

  it('keeps separate arena models and explicit pre-live provenance', () => {
    expect(vashnik.learn2d[0].arena.id).toBe('vashnik_raidplan')
    expect(vashnik.train3dArenas[0]).toMatchObject({ id: 'vashnik_chamber_world', shape: 'circle', width: 96, depth: 96 })
    expect(vashnik.train3dArenas[0].theme).toMatchObject({ layout: 'three-fountain-plan', fog: 'none', material: 'three-fountain-stone' })
    expect(vashnik.timingProfiles[0].values.every(value => value.provenance.asOf === '2026-08-16')).toBe(true)
  })

  it('declares only package-backed actions without a generic crowd-control binding', () => {
    expect(vashnik.actions.map(action => action.binding)).toEqual(['mainAbility', 'taunt'])
    expect(vashnik.roles.find(role => role.id === 'vashnik_tank')?.actionIds).toContain('vashnik_taunt')
  })
})
