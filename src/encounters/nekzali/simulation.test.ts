import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { contractRaidRoster } from '../../platform/contractRoom'
import { createNekzaliState, dispelNekzali, interruptNekzali, NEKZALI_TIMING, nekzaliRendRemaining, nekzaliSnapshot, startNekzaliMainCast, stepNekzaliDiagramState, stepNekzaliState, type NekzaliState } from './simulation'

const idle = IDLE_PLAYER_COMMANDS

describe("Nek'zali reconciled encounter contract", () => {
  it('declares separate 2D and 3D schedules over one mechanic set', () => {
    expect(createNekzaliState('player', 'normal', 'learn2d').projection).toBe('learn2d')
    expect(NEKZALI_TIMING.projections.learn2d.phaseOneSeconds).toBe(82)
    expect(NEKZALI_TIMING.projections.train3d.phaseOneSeconds).toBe(90)
    expect(NEKZALI_TIMING.projections.learn2d.essenceRendDebuffSeconds).toBe(12)
    expect(NEKZALI_TIMING.projections.train3d.essenceRendDebuffSeconds).toBe(15)
  })

  it('keeps Learn 2D screen-relative and Train 3D facing-relative movement', () => {
    const diagram = createNekzaliState('player', 'test', 'learn2d')
    const forward2d = stepNekzaliDiagramState(diagram, { ...idle, forward: true }, .5)
    const forward3d = stepNekzaliState({ ...diagram, projection: 'train3d' }, { ...idle, forward: true }, .5)
    expect(forward2d.player.z).toBeLessThan(diagram.player.z)
    expect(forward3d.player).not.toEqual(forward2d.player)
  })

  it('pulls, knocks, edge-dispels, and creates exactly one persistent Rend remain', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'hard'), time: 16.99, player: { x: 31, z: 0, facing: 0 } }
    state = stepNekzaliState(state, idle, .02)
    expect(state.rendTargetId).toBe('player')
    expect(nekzaliRendRemaining(state)).toBeGreaterThan(19)
    expect(nekzaliSnapshot(state).actors.find(actor => actor.id === 'controlled-player')?.auras).toContainEqual({ id: 'essence-rend', tone: 'danger', stacks: 1 })
    state = stepNekzaliState({ ...state, player: { x: 35, z: 0, facing: 0 } }, idle, 5.01)
    expect(state.rendTargetId).toBeUndefined()
    expect(state.hazards.filter(hazard => hazard.id.startsWith('rend-'))).toHaveLength(1)
    expect(state.hazards[0]).toMatchObject({ radius: 6, kind: 'cultist' })
  })

  it('lets an unaffected healer dispel an NPC Rend only after edge positioning', () => {
    const initial: NekzaliState = { ...createNekzaliState('healer-2', 'test'), time: 10, rendStartedAt: 0, rendTargetId: 'melee-1', rendEventIndex: 1, rendKnockbackApplied: true }
    const dispelled = dispelNekzali(initial)
    expect(dispelled.rendTargetId).toBeUndefined()
    expect(dispelled.hazards).toHaveLength(1)
    expect(dispelled.timeline.entities.find(entity => entity.id === 'controlled-player')?.actions.at(-1)?.kind).toBe('dispel')
  })

  it('records expiry inside the raid and still preserves the resulting remain', () => {
    const state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 19.99, rendStartedAt: 0, rendTargetId: 'player', rendEventIndex: 1, rendKnockbackApplied: true, player: { x: 20, z: 0, facing: 0 } }
    const result = stepNekzaliState(state, idle, .02)
    expect(result.failures[0]?.code).toBe('rend-inside')
    expect(result.hazards).toHaveLength(1)
    expect(result.outcome).toBe('active')
  })

  it('moves every persistent Cultist once clockwise when Invoke completes', () => {
    const hazard = { id: 'cultist', position: { x: 20, z: 0 }, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist' as const }
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 114.9, phase: 'phase-2', phaseStartedAt: 100, hazards: [hazard], bossHealth: 50 }
    state = stepNekzaliState(state, idle, .2)
    expect(state.invokes).toBe(1)
    expect(state.hazards[0].position.x).toBeCloseTo(Math.cos(Math.PI / 6) * 20)
    expect(state.hazards[0].position.z).toBeCloseTo(Math.sin(Math.PI / 6) * 20)
    const stepped = state.hazards[0].position
    state = stepNekzaliState(state, idle, 1)
    expect(state.hazards[0].position).toEqual(stepped)
  })

  it('tracks Soulcoil Rite energy and independently expiring Ritual Burn applications', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 8.9 }
    state = stepNekzaliState(state, idle, 3.2)
    expect(state.bossEnergy).toBeGreaterThan(0)
    expect(state.ritualBurnApplications.length).toBeGreaterThan(0)
    expect(nekzaliSnapshot(state).effects.some(effect => effect.id.startsWith('anguished-'))).toBe(true)
  })

  it('tracks independently expiring Hollowing Strikes on the active controlled tank', () => {
    let state: NekzaliState = { ...createNekzaliState('tank-1', 'test'), time: 11.99, aggroOwner: 'tank-1' }
    state = stepNekzaliState(state, idle, .02)
    expect(state.hollowingApplications).toHaveLength(1)
    expect(nekzaliSnapshot(state).actors.find(actor => actor.id === 'controlled-player')?.auras).toContainEqual({ id: 'hollowing-strikes', tone: 'danger', stacks: 1 })
    state = stepNekzaliState({ ...state, aggroOwner: 'tank-2' }, idle, 15.01)
    expect(state.hollowingApplications).toHaveLength(0)
  })

  it('breaks Amani shields before health and exposes NPC crowd control afterwards', () => {
    let state: NekzaliState = { ...createNekzaliState('tank-2', 'test'), time: 59.99, wellEventIndex: 1, rendEventIndex: 2, barrageStarted: true, barrageResolved: true }
    state = stepNekzaliState(state, idle, .02)
    const target = [...state.adds].sort((a, b) => Math.hypot(state.player.x - a.position.x, state.player.z - a.position.z) - Math.hypot(state.player.x - b.position.x, state.player.z - b.position.z))[0]
    state = stepNekzaliState(startNekzaliMainCast(state), idle, 1.01)
    const damaged = state.adds.find(add => add.id === target.id)!
    expect(damaged.shield).toBe(0)
    expect(damaged.health).toBeGreaterThan(65)
    expect(damaged.health).toBeLessThanOrEqual(70)
    expect(damaged.crowdControlled).toBe(true)
  })

  it('assigns a stable Pyre-soak or smaller Cremation-cleanup role before pull', () => {
    const duties = contractRaidRoster.map(member => createNekzaliState(member.id, 'test').cleanupDuty)
    expect(duties.some(Boolean)).toBe(true)
    expect(duties.filter(Boolean).length).toBeLessThan(duties.length / 2)
  })

  it('shows Soul Transfer before resolving the player intermission duty', () => {
    const state: NekzaliState = { ...createNekzaliState('tank-1', 'test'), time: 90, phase: 'echo-1', phaseStartedAt: 90, player: { x: 20, z: 10, facing: 0 } }
    expect(nekzaliSnapshot(state).effects.some(effect => effect.id === 'soul-transfer-1')).toBe(true)
    const dutyState = { ...state, time: 105.1 }
    expect(nekzaliSnapshot(dutyState).effects.some(effect => effect.id === 'pyre-1' || effect.id === 'spread-1')).toBe(true)
    expect(startNekzaliMainCast(state).mainCastRemaining).toBe(0)
  })
})

describe("Nek'zali Well realm", () => {
  const insideState = (): NekzaliState => ({ ...createNekzaliState('player', 'test'), realmStage: 'inside', realmStartedAt: 0, player: { x: 8, z: 8, facing: Math.PI }, innerCastInterrupted: true, disruptionIndex: 2 })

  it('uses a ten-second assigned Drowned Echo interrupt', () => {
    const interruptible = { ...insideState(), time: 5, innerCastStartedAt: 4, innerCastInterrupted: false }
    expect(interruptNekzali(interruptible).innerCastInterrupted).toBe(true)
    const missed = stepNekzaliState({ ...interruptible, time: 13.99 }, idle, .02)
    expect(missed.failures[0]?.code).toBe('missed-well-interrupt')
  })

  it('kills the Drowned Echo with 20 Main casts and applies 60-second exhaustion after return', () => {
    let state = insideState()
    for (let hit = 0; hit < 20; hit += 1) state = stepNekzaliState(startNekzaliMainCast(state), idle, 1.01)
    expect(state).toMatchObject({ realmAddHits: 20, realmStage: 'returning' })
    state = stepNekzaliState(state, idle, 5.01)
    expect(state.soulExhaustedUntil! - state.time).toBeCloseTo(60)
  })
})
