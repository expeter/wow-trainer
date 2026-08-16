import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { createSentinelsState, dispelSentinels, nextSentinelsTimer, sentinelsContract, sentinelsSnapshot, stepSentinelsDiagramState, stepSentinelsState, type SentinelsState } from './simulation'

const idle = IDLE_PLAYER_COMMANDS

describe('Entombed Sentinels reconciled encounter contract', () => {
  it('keeps 100-yard homes and the 40-yard Dominance threshold', () => {
    const initial = createSentinelsState('tank-1', 'easy')
    expect(Math.hypot(initial.acidBoss.x - initial.bloodBoss.x, initial.acidBoss.z - initial.bloodBoss.z)).toBe(100)
    expect(sentinelsContract.dominanceYards).toBe(40)
    const result = stepSentinelsState({ ...initial, time: 9, acidBoss: { x: -15, z: 0 }, bloodBoss: { x: 15, z: 0 } }, idle, .1)
    expect(result.failures[0]?.code).toBe('dominance')
  })

  it('declares separate 2D and 3D schedules without trainer-difficulty timing changes', () => {
    expect(sentinelsContract.projections.learn2d.activeSeconds).toEqual([54, 64])
    expect(sentinelsContract.projections.train3d.activeSeconds).toEqual([60, 72])
    expect(sentinelsContract.projections.learn2d.dropletFuseSeconds).toBe(14)
    expect(sentinelsContract.projections.train3d.dropletFuseSeconds).toBe(12)
    expect(createSentinelsState('player', 'hard', 'learn2d').projection).toBe('learn2d')
  })

  it('uses screen-relative movement only in Learn 2D', () => {
    const initial = createSentinelsState('player', 'test', 'learn2d')
    const diagram = stepSentinelsDiagramState(initial, { ...idle, forward: true }, .5)
    const world = stepSentinelsState({ ...initial, projection: 'train3d' }, { ...idle, forward: true }, .5)
    expect(diagram.player.z).toBeLessThan(initial.player.z)
    expect(world.player).not.toEqual(diagram.player)
  })

  it('expires each five-second mark application independently after 40 seconds', () => {
    let state: SentinelsState = { ...createSentinelsState('player', 'test'), time: 4.99 }
    state = stepSentinelsState(state, idle, .02)
    state = stepSentinelsState(state, idle, 5)
    expect(state.acidMarks).toBe(2)
    state = stepSentinelsState(state, idle, 35.01)
    expect(state.acidMarks).toBe(2)
    state = { ...state, player: { x: 0, z: 28, facing: 0 } }
    state = stepSentinelsState(state, idle, 5)
    expect(state.acidMarks).toBe(1)
  })

  it('spawns four droplets on each side independently of Coagulation death', () => {
    const state = stepSentinelsState({ ...createSentinelsState('player', 'test'), time: 11.99, coagulationHealth: 100 }, idle, .02)
    expect(state.droplets).toHaveLength(8)
    expect(state.droplets.filter(droplet => droplet.side === 'acid')).toHaveLength(4)
    expect(state.droplets.filter(droplet => droplet.side === 'blood')).toHaveLength(4)
    expect(state.coagulationHealth).toBe(100)
  })

  it('assigns the controlled player a droplet on their current side', () => {
    let state = stepSentinelsState({ ...createSentinelsState('healer-2', 'test'), time: 11.99 }, idle, .02)
    expect(state.assignedSide).toBe('blood')
    const assigned = state.droplets.find(droplet => droplet.side === 'blood' && droplet.assignedToPlayer)!
    state = stepSentinelsState({ ...state, player: { ...state.player, ...assigned.position } }, idle, .1)
    expect(state.droplets.find(droplet => droplet.id === assigned.id)?.soaked).toBe(true)
    expect(sentinelsSnapshot(state).effects.some(effect => effect.id === `${assigned.id}-return`)).toBe(true)
  })

  it('keeps Living Venom visible for the projection-specific return time', () => {
    const droplet = { id: 'return', side: 'acid' as const, position: { x: 30, z: 10 }, assignedToPlayer: true, soaked: true, soakedAt: 10 }
    const state = { ...createSentinelsState('player', 'test'), time: 13.9, dropletsSpawned: true, droplets: [droplet] }
    expect(sentinelsSnapshot(state).effects.some(effect => effect.id === 'return-return')).toBe(true)
    expect(sentinelsSnapshot({ ...state, time: 14.01 }).effects.some(effect => effect.id === 'return-return')).toBe(false)
  })

  it('creates a persistent edge pool when a Blood healer dispels Blighted Blood', () => {
    const healer: SentinelsState = { ...createSentinelsState('healer-2', 'easy'), time: 40, blightedActive: true, blightedAppliedAt: 34, blightedTargetId: 'ranged-1' }
    const result = dispelSentinels(healer)
    expect(result.blightedResolved).toBe(true)
    expect(result.pools).toHaveLength(1)
    expect(Math.abs(result.pools[0].position.x)).toBeGreaterThan(40)
    expect(result.blightedActive).toBe(false)
  })

  it('delays the controlled Miasma pool by the six-second Clinging Murk window', () => {
    const initial: SentinelsState = { ...createSentinelsState('healer-2', 'test'), time: 24.99, player: { x: -37, z: 16, facing: 0 } }
    const soaked = stepSentinelsState(initial, idle, .02)
    expect(soaked.puddleDropAt! - soaked.time).toBeCloseTo(6)
    expect(stepSentinelsState(soaked, idle, 5.9).pools).toHaveLength(0)
  })

  it('tracks reusable tank stacks on the boss assigned to the player', () => {
    const acidTank = stepSentinelsState({ ...createSentinelsState('tank-1', 'test'), time: 14.99 }, idle, .02)
    expect(acidTank.empoweringSlamStacks).toBe(1)
    expect(acidTank.bloodvenomInjectionStacks).toBe(0)
    const bloodTank = stepSentinelsState({ ...createSentinelsState('tank-2', 'test'), time: 14.99 }, idle, .02)
    expect(bloodTank.bloodvenomInjectionStacks).toBe(1)
  })

  it('creates a deterministic Protovenom carrier set containing the player and several NPCs', () => {
    const state = stepSentinelsState({ ...createSentinelsState('player', 'test'), time: 39.99 }, idle, .02)
    expect(state.protovenomActive).toBe(true)
    expect(state.protovenomCarrierIds).toContain('player')
    expect(state.protovenomCarrierIds.length).toBeGreaterThan(2)
    const snapshot = sentinelsSnapshot(state)
    expect(snapshot.actors.filter(actor => actor.auras.some(aura => aura.id === 'protovenom')).length).toBeGreaterThan(2)
  })

  it('uses a 30-second Stasis and 28-second Helical window', () => {
    const initial = createSentinelsState('player', 'test')
    const stasis: SentinelsState = { ...initial, phase: 'stasis', phaseStartedAt: 0, time: 2, helicalResolved: false }
    expect(nextSentinelsTimer(stasis)).toMatchObject({ label: 'Helical', seconds: 28 })
    const stillStasis = stepSentinelsState({ ...stasis, time: 29.8, helicalResolved: true }, idle, .1)
    expect(stillStasis.phase).toBe('stasis')
    const swapped = stepSentinelsState({ ...stasis, time: 29.99, helicalResolved: true }, idle, .02)
    expect(swapped).toMatchObject({ phase: 'active', cycle: 2, assignedSide: 'blood' })
  })

  it('resolves Helical with any complementary exact-four player', () => {
    let state: SentinelsState = { ...createSentinelsState('player', 'test'), phase: 'stasis', phaseStartedAt: 0, time: 3 }
    const snapshot = sentinelsSnapshot(state)
    const partner = snapshot.actors.find(actor => actor.kind === 'ally' && actor.auras.some(aura => aura.id === 'green-toxin' && aura.stacks === 3))!
    state = stepSentinelsState({ ...state, player: { ...partner.position, facing: 0 } }, idle, .02)
    expect(state.helicalResolved).toBe(true)
  })

  it('retains linked boss health as the documented controllability abstraction', () => {
    const result = stepSentinelsState(createSentinelsState('player', 'test'), idle, 5)
    expect(result.acidHealth).toBe(result.bloodHealth)
    expect(result.acidHealth).toBeLessThan(100)
  })

  it('records failures without changing Test mechanics or stopping its schedule', () => {
    const result = stepSentinelsState({ ...createSentinelsState('player', 'test'), time: 9, acidBoss: { x: -10, z: 0 }, bloodBoss: { x: 10, z: 0 } }, idle, .1)
    expect(result.outcome).toBe('active')
    expect(result.failures[0]?.code).toBe('dominance')
  })
})
