import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { clampToVashnikArena, createVashnikState, fountainsForPair, PAIR_ORDER, selectVashnikFountainPair, startVashnikMainCast, stepVashnikDiagramState, stepVashnikState, tauntVashnik, VASHNIK_ADD_LANES, VASHNIK_TIMING, vashnikSnapshot, type VashnikState } from './simulation'

const idle = IDLE_PLAYER_COMMANDS

function stepTo(state: VashnikState, target: number, projection: 'learn2d' | 'train3d' = state.projection) {
  let next = state
  while (next.time + .05 < target && next.outcome === 'active') next = projection === 'learn2d' ? stepVashnikDiagramState(next, idle, .05) : stepVashnikState(next, idle, .05)
  return projection === 'learn2d' ? stepVashnikDiagramState(next, idle, Math.max(0, target - next.time)) : stepVashnikState(next, idle, Math.max(0, target - next.time))
}

describe('Vashnik reconciled encounter contract', () => {
  it('selects fountain pairs geometrically and retains the fixed causal mapping', () => {
    expect(selectVashnikFountainPair({ x: 0, z: 20 })).toBe('flame-shadow')
    expect(selectVashnikFountainPair({ x: 17, z: -10 })).toBe('shadow-blood')
    expect(selectVashnikFountainPair({ x: -17, z: -10 })).toBe('blood-flame')
    expect(PAIR_ORDER.map(fountainsForPair)).toEqual([['flame', 'shadow'], ['shadow', 'blood'], ['blood', 'flame']])
  })

  it('uses separate projection schedules that trainer difficulty cannot mutate', () => {
    expect(VASHNIK_TIMING.projections.learn2d.cycleSeconds).toBe(38)
    expect(VASHNIK_TIMING.projections.train3d.cycleSeconds).toBe(46)
    expect(createVashnikState('player', 'test').projection).toBe('train3d')
    expect(createVashnikState('player', 'hard').projection).toBe('train3d')
    expect(createVashnikState('player', 'test', 'learn2d').projection).toBe('learn2d')
  })

  it('activates the correct pair at 100 energy and gives every fountain timed stacks', () => {
    let state = createVashnikState('player', 'test', 'learn2d')
    state = stepTo(state, VASHNIK_TIMING.projections.learn2d.imbibeAt + .01, 'learn2d')
    expect(state.activePair).toBe('flame-shadow')
    expect(state.bossEnergy).toBe(100)
    expect(state.toxicVaporStacks).toBe(1)
    expect(state.infusionApplications.flame).toHaveLength(1)
    expect(state.infusionApplications.shadow).toHaveLength(1)
    expect(state.infusionApplications.blood).toHaveLength(0)
    expect(state.adds.filter(add => add.family === 'flame')).toHaveLength(2)
    expect(state.adds.filter(add => add.family === 'shadow')).toHaveLength(5)
  })

  it('spawns adds on the three visible in-room lanes and keeps their travel inside the mapped boundary', () => {
    let state = stepTo(createVashnikState('player', 'test', 'learn2d'), VASHNIK_TIMING.projections.learn2d.imbibeAt + .01, 'learn2d')
    const before = state.adds.map(add => ({ id: add.id, distance: Math.hypot(add.position.x, add.position.z) }))
    state = stepVashnikDiagramState(state, idle, 1)
    for (const add of state.adds) {
      expect(add.position).toEqual(clampToVashnikArena(add.position))
      expect(Math.hypot(add.position.x, add.position.z)).toBeLessThan(before.find(candidate => candidate.id === add.id)!.distance)
      expect(VASHNIK_ADD_LANES[add.family].origin).toEqual(expect.objectContaining({ x: expect.any(Number), z: expect.any(Number) }))
    }
    const pathEffects = vashnikSnapshot(state).effects.filter(effect => effect.intent === 'path')
    expect(pathEffects.map(effect => effect.id)).toEqual(['blood-add-lane', 'flame-add-lane', 'shadow-add-lane'])
  })

  it('labels every colored Vashnik circle with its intent and required reaction', () => {
    let state = stepTo(createVashnikState('player', 'test', 'learn2d'), 13.01, 'learn2d')
    let snapshot = vashnikSnapshot(state)
    expect(snapshot.effects.find(effect => effect.id === 'stygian-infection-zone')).toMatchObject({ intent: 'avoid', label: expect.stringContaining('keep moving') })
    state = { ...state, infection: undefined, bileStartedAt: state.time, bilePositions: [{ x: 10, z: 10 }] }
    snapshot = vashnikSnapshot(state)
    expect(snapshot.effects.find(effect => effect.id.startsWith('bile-'))).toMatchObject({ intent: 'soak', label: expect.stringContaining('stand inside') })
    expect(snapshot.effects.find(effect => effect.id === 'malignant-cavity')).toMatchObject({ intent: 'avoid', label: expect.stringContaining('kill every add') })
  })

  it('keeps one player-owned priority add and resolves Main through the shared cast lifecycle', () => {
    let state = stepTo(createVashnikState('player', 'test', 'learn2d'), 6.01, 'learn2d')
    const target = state.adds.find(add => add.assignedToPlayer)!
    state = stepVashnikDiagramState(startVashnikMainCast(state), idle, 1.01)
    expect(state.mainProjectileOrdinal).toBe(1)
    expect(vashnikSnapshot(state).effects.some(effect => effect.id.startsWith('player-main'))).toBe(true)
    expect(state.adds.find(add => add.id === target.id)?.health).toBeLessThan(target.health)
    expect(state.timeline.entities.find(entity => entity.id === 'controlled-player')?.actions.at(-1)?.kind).toBe('main-ability')
  })

  it('hard-fails a Living Venom leak but keeps Test sequencing active', () => {
    const leaked = { id: 'leak', family: 'flame' as const, generation: 0 as const, position: { x: 5.6, z: 0 }, health: 100, shield: 0, speed: 1, assignedToPlayer: true, spawnedAt: 0, hardened: false }
    const hard = stepVashnikState({ ...createVashnikState('player', 'hard'), adds: [leaked] }, idle, .2)
    expect(hard.outcome).toBe('wipe')
    expect(hard.failures[0]?.code).toBe('add-leak-leak')
    const test = stepVashnikState({ ...createVashnikState('player', 'test'), adds: [leaked] }, idle, .2)
    expect(test.outcome).toBe('active')
  })

  it('models the Blood family as one to two to four without assigning Fire the split', () => {
    const blood = { id: 'blood', family: 'blood' as const, generation: 0 as const, position: { x: 10, z: 0 }, health: 20, shield: 0, speed: .7, assignedToPlayer: true, spawnedAt: 0, hardened: false }
    let state: VashnikState = { ...createVashnikState('player', 'test'), adds: [blood] }
    state = stepVashnikState(startVashnikMainCast(state), idle, 1.01)
    expect(state.adds.filter(add => add.generation === 1)).toHaveLength(2)
    expect(state.adds.filter(add => add.generation === 1).every(add => add.family === 'blood')).toBe(true)
  })

  it('runs Stygian, Siphoning, and Exploding as the three player-owned pair lessons', () => {
    let state = stepTo(createVashnikState('player', 'test', 'learn2d'), 13.01, 'learn2d')
    expect(state.infection?.kind).toBe('stygian')
    expect(vashnikSnapshot(state).effects.some(effect => effect.id === 'stygian-infection-zone')).toBe(true)
    state = { ...createVashnikState('player', 'test', 'learn2d'), cycle: 2, cycleStartedAt: 0 }
    state = stepTo(state, 13.01, 'learn2d')
    expect(state.infection?.kind).toBe('siphoning')
    state = { ...createVashnikState('player', 'test', 'learn2d'), cycle: 3, cycleStartedAt: 0 }
    state = stepTo(state, 13.01, 'learn2d')
    expect(state.infection?.kind).toBe('exploding')
  })

  it('requires at least one player in their Bile circle and does not call extra occupants a failure', () => {
    const timing = VASHNIK_TIMING.projections.learn2d
    let state: VashnikState = { ...createVashnikState('player', 'test', 'learn2d'), time: timing.bileAt, bileCycle: 1, bileStartedAt: timing.bileAt, bilePositions: [{ x: 20, z: 20 }, { x: -17, z: -8 }, { x: 17, z: -8 }], player: { x: 0, z: 0, facing: 0 } }
    state = stepVashnikDiagramState(state, idle, timing.bileDuration + .01)
    expect(state.failures.some(failure => failure.code === 'empty-bile')).toBe(true)
    state = { ...state, failures: [], bileResolved: false, outcome: 'active', bilePositions: [{ x: 20, z: 20 }, { x: -17, z: -8 }, { x: 17, z: -8 }], player: { x: 20, z: 20, facing: 0 } }
    state = stepVashnikDiagramState(state, idle, .01)
    expect(state.failures.some(failure => failure.code === 'empty-bile')).toBe(false)
  })

  it('resolves arena-fixed Froth axes against Tumors in simulation', () => {
    const timing = VASHNIK_TIMING.projections.learn2d
    const base = createVashnikState('player', 'test', 'learn2d')
    const aligned: VashnikState = { ...base, time: 30, frothCycle: 1, frothStartedAt: 24, player: { x: 5, z: 5, facing: 0 }, tumors: [{ id: 'tumor-player', position: { x: 5, z: -20 }, resolved: false }] }
    const success = stepVashnikDiagramState(aligned, idle, .01)
    expect(success.tumors[0].resolved).toBe(true)
    const missed = stepVashnikDiagramState({ ...aligned, tumors: [{ id: 'tumor-player', position: { x: 16, z: -20 }, resolved: false }] }, idle, .01)
    expect(missed.failures.some(failure => failure.code === 'uncleared-tumor')).toBe(true)
    expect(timing.frothDuration).toBe(6)
  })

  it('records tank swaps through the same action timeline', () => {
    const state = createVashnikState('tank-2', 'test')
    const taunted = tauntVashnik({ ...state, aggroOwner: 'tank-1' })
    expect(taunted.aggroOwner).toBe('tank-2')
    expect(taunted.timeline.entities.find(entity => entity.id === 'controlled-player')?.actions.at(-1)?.kind).toBe('taunt')
  })
})
