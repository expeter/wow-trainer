import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../../platform/encounters'
import lostExplorers from '..'

describe('The Lost Explorers EncounterPackageV1', () => {
  it('exposes one conforming three-boss full fight in both runtimes', () => {
    expect(validateEncounterPackage(lostExplorers)).toEqual({ ok: true, package: lostExplorers })
    expect(lostExplorers.learn2d.map(scenario => scenario.id)).toEqual(['lost_explorers_full_fight'])
    expect(lostExplorers.train3d.map(scenario => scenario.id)).toEqual(['lost_explorers_full_fight'])
    expect(lostExplorers.learn2d[0].abilityIds).toEqual(lostExplorers.train3d[0].abilityIds)
  })

  it('keeps separate octagonal arenas and explicit pre-live provenance', () => {
    expect(lostExplorers.learn2d[0].arena.id).toBe('lost_explorers_raidplan')
    expect(lostExplorers.train3dArenas[0]).toMatchObject({ id: 'lost_explorers_octagonal_world', theme: { layout: 'octagonal-council', fog: 'none' } })
    expect(lostExplorers.timingProfiles[0].values.every(value => value.provenance.asOf === '2026-08-16')).toBe(true)
  })

  it('declares only package-backed fish, interrupt, and tank actions', () => {
    expect(lostExplorers.actions.map(action => action.binding)).toEqual(['mainAbility', 'interrupt', 'taunt'])
  })
})
