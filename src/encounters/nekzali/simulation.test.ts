import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { createNekzaliState, interruptNekzali, nekzaliSnapshot, startNekzaliMainCast, stepNekzaliState, tauntNekzali, type NekzaliState } from './simulation'

const idle = IDLE_PLAYER_COMMANDS

describe("Nek'zali headless full-fight simulation", () => {
  it('assigns one of two alternating soak groups before pull', () => {
    expect(createNekzaliState('tank-1').soakGroup).toBe(1)
    expect(createNekzaliState('tank-2').soakGroup).toBe(2)
  })

  it('spawns nine Amani and requires exactly three marked player kills', () => {
    let state = stepNekzaliState({ ...createNekzaliState(), time: 59.99, wellEventIndex: 1 }, idle, .02)
    expect(state.adds).toHaveLength(9)
    expect(state.adds.filter(add => add.assignedToPlayer)).toHaveLength(3)
    for (let cast = 0; cast < 6; cast += 1) {
      state = startNekzaliMainCast(state)
      state = stepNekzaliState(state, idle, 1.01)
    }
    expect(state.playerAddKills).toBe(3)
    expect(state.corpses.filter(corpse => corpse.id.includes('amani-')).length).toBeGreaterThanOrEqual(3)
  })

  it('drops the provisional 15-zone Rend trail and requires continuous edge movement', () => {
    let state: NekzaliState = createNekzaliState('player', 'hard')
    for (let drop = 0; drop < 15; drop += 1) {
      const angle = drop * Math.PI * 2 / 15
      state = stepNekzaliState({ ...state, time: 16.99 + drop, player: { x: Math.cos(angle) * 38, z: Math.sin(angle) * 38, facing: 0 } }, idle, .02)
    }
    expect(state.hazards.filter(hazard => hazard.id.startsWith('rend-'))).toHaveLength(15)
    expect(state.outcome).toBe('active')

    let stopped: NekzaliState = { ...createNekzaliState('player', 'hard'), time: 16.99, player: { x: 38, z: 0, facing: 0 } }
    stopped = stepNekzaliState(stopped, idle, .02)
    stopped = stepNekzaliState(stopped, idle, .7)
    expect(stopped.outcomeReason).toBe('Stayed in an Essence Rend pool')
  })

  it('fails if the three assigned adds are not dead at the 50% intermission', () => {
    const state = stepNekzaliState({ ...createNekzaliState(), time: 89.9, wellEventIndex: 1, addsSpawned: true, adds: [], playerAddKills: 2 }, idle, .2)
    expect(state).toMatchObject({ outcome: 'wipe', outcomeReason: 'Your three assigned Amani were not defeated' })
  })

  it('swaps the boss off a Barrage tank and rewards sufficient distance', () => {
    let state = { ...createNekzaliState('tank-1', 'hard'), time: 37.9, player: { x: 0, z: 43.5, facing: 0 } }
    state = stepNekzaliState(state, idle, .2)
    expect(state.aggroOwner).toBe('tank-2')
    state = stepNekzaliState({ ...state, time: 43.9 }, idle, .2)
    expect(state.outcome).toBe('active')
    expect(tauntNekzali(state).aggroOwner).toBe('tank-1')
  })

  it('fails a tank that resolves Possession Barrage beside the boss', () => {
    const state = stepNekzaliState({ ...createNekzaliState('tank-1', 'hard'), time: 43.9, barrageStarted: true, aggroOwner: 'tank-2', player: { x: 0, z: 24, facing: 0 } }, idle, .2)
    expect(state.outcomeReason).toBe('Possession Barrage exploded too close to the raid')
  })

  it('alternates the soak half and uses the spread half to cremate every corpse', () => {
    const corpses = [
      { id: 'corpse-a', position: { x: 20, z: 0 }, group: 1 as const, cremated: false },
      { id: 'corpse-b', position: { x: -20, z: 0 }, group: 2 as const, cremated: false },
    ]
    let state: NekzaliState = { ...createNekzaliState('tank-1', 'hard'), time: 90, phase: 'echo-1', phaseStartedAt: 90, player: { x: 0, z: -34, facing: 0 }, playerAddKills: 3, corpses }
    expect(nekzaliSnapshot(state).effects.find(effect => effect.id === 'pyre-1')).toMatchObject({ kind: 'ground-soak', filled: false })
    state = stepNekzaliState(state, idle, 12.01)
    expect(state.phase).toBe('echo-2')
    state = { ...state, player: { x: 20, z: 0, facing: 0 } }
    state = stepNekzaliState(state, idle, 12.01)
    expect(state.phase).toBe('phase-2')
    expect(state.corpses.every(corpse => corpse.cremated)).toBe(true)
  })

  it('moves persistent Cultist hazards in seeded directions when Invoke completes', () => {
    const hazard = { id: 'cultist', position: { x: 20, z: 0 }, radius: 3, direction: { x: 0, z: 0 }, kind: 'cultist' as const }
    let state: NekzaliState = { ...createNekzaliState(), time: 114.9, phase: 'phase-2', phaseStartedAt: 100, hazards: [hazard], bossHealth: 50 }
    state = stepNekzaliState(state, idle, .2)
    expect(state.invokes).toBe(1)
    const before = state.hazards[0].position
    state = stepNekzaliState(state, idle, 1)
    expect(state.hazards[0].position).not.toEqual(before)
  })
})

describe("Nek'zali Well realm simulation", () => {
  const insideState = (): NekzaliState => ({
    ...createNekzaliState('player', 'normal'),
    realmStage: 'inside',
    realmStartedAt: 0,
    player: { x: 8, z: 8, facing: Math.PI },
    innerCastInterrupted: true,
    disruptionIndex: 2,
  })

  it('alternates assigned raid halves and isolates the entered half inside the dome', () => {
    const assigned = stepNekzaliState({ ...createNekzaliState('player', 'normal'), time: 44.99 }, idle, .02)
    expect(assigned).toMatchObject({ realmStage: 'pull', wellGroup: 1, wellEventIndex: 1 })

    const unassigned = stepNekzaliState({ ...createNekzaliState('tank-2', 'normal'), time: 44.99 }, idle, .02)
    expect(unassigned).toMatchObject({ realmStage: 'none', wellGroup: 2, wellEventIndex: 1 })

    const snapshot = nekzaliSnapshot({ ...assigned, realmStage: 'inside', realmStartedAt: assigned.time })
    expect(snapshot.effects.some(effect => effect.kind === 'dome')).toBe(true)
    expect(snapshot.actors.some(actor => actor.id === 'nekzali-boss')).toBe(false)
    expect(snapshot.actors.filter(actor => actor.kind === 'ally').length).toBeGreaterThan(0)
    expect(snapshot.actors.filter(actor => actor.kind === 'ally').length).toBeLessThan(19)
  })

  it('kills the Drowned Echo with 20 completed Main casts and returns after five seconds', () => {
    let state = insideState()
    for (let hit = 0; hit < 20; hit += 1) {
      state = startNekzaliMainCast(state)
      state = stepNekzaliState(state, idle, 1.01)
    }
    expect(state).toMatchObject({ realmAddHits: 20, realmStage: 'returning', outcome: 'active' })
    state = stepNekzaliState(state, idle, 5.01)
    expect(state).toMatchObject({ realmStage: 'none', soulExhausted: true, outcome: 'active' })
  })

  it('requires the assigned interrupt and keeps Nekzali disruption non-terminal', () => {
    const interruptible = { ...insideState(), time: 5, innerCastStartedAt: 4, innerCastInterrupted: false }
    expect(interruptNekzali(interruptible).innerCastInterrupted).toBe(true)
    const missed = stepNekzaliState({ ...interruptible, time: 8.99 }, idle, .02)
    expect(missed).toMatchObject({ outcome: 'wipe', outcomeReason: 'Drowned Echo completed its assigned cast' })

    let disrupted: NekzaliState = { ...insideState(), time: 8.9, disruptionIndex: 0, mainCastRemaining: 20, mainTargetId: 'drowned-echo' }
    while (disrupted.time < 18 && disrupted.disruptionIndex === 0) disrupted = stepNekzaliState(disrupted, idle, .2)
    expect(disrupted).toMatchObject({ outcome: 'active', mistakes: 0, mainCastRemaining: 0, disruptionIndex: 1 })
    expect(disrupted.failures[0]?.code).toBe('realm-main-interrupted')
  })

  it('records terminal mechanic mistakes without ending Test attempts', () => {
    const testState = { ...insideState(), trainingDifficulty: 'test' as const, time: 8.99, innerCastStartedAt: 4, innerCastInterrupted: false }
    const result = stepNekzaliState(testState, idle, .02)
    expect(result.outcome).toBe('active')
    expect(result.failures[0]?.code).toBe('missed-well-interrupt')
  })
})
