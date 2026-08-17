import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { contractRaidRoster } from '../../platform/contractRoom'
import { createNekzaliState, dispelNekzali, interruptNekzali, NEKZALI_TIMING, nekzaliRendRemaining, nekzaliSnapshot, nextNekzaliTimer, startNekzaliMainCast, stepNekzaliDiagramState, stepNekzaliState, type NekzaliState } from './simulation'

const idle = IDLE_PLAYER_COMMANDS

describe("Nek'zali reconciled encounter contract", () => {
  it('declares separate 2D and 3D schedules over one mechanic set', () => {
    expect(createNekzaliState('player', 'normal', 'learn2d').projection).toBe('learn2d')
    expect(NEKZALI_TIMING.projections.learn2d.phaseOneSeconds).toBe(82)
    expect(NEKZALI_TIMING.projections.train3d.phaseOneSeconds).toBe(90)
    expect(NEKZALI_TIMING.projections.learn2d.essenceRendDurationSeconds).toBe(12)
    expect(NEKZALI_TIMING.projections.train3d.essenceRendDurationSeconds).toBe(15)
  })

  it('keeps Learn 2D screen-relative and Train 3D facing-relative movement', () => {
    const diagram = createNekzaliState('player', 'test', 'learn2d')
    const forward2d = stepNekzaliDiagramState(diagram, { ...idle, forward: true }, .5)
    const forward3d = stepNekzaliState({ ...diagram, projection: 'train3d' }, { ...idle, forward: true }, .5)
    expect(forward2d.player.z).toBeLessThan(diagram.player.z)
    expect(forward3d.player).not.toEqual(forward2d.player)
  })

  it('never forces player movement, edge-dispels, and creates exactly one persistent Rend remain', () => {
    const diagram: NekzaliState = { ...createNekzaliState('player', 'hard', 'learn2d'), time: 1, rendStartedAt: 0, rendTargetId: 'player', rendEventIndex: 1, player: { x: 31, z: 0, facing: 0 } }
    expect(stepNekzaliDiagramState(diagram, idle, .5).player).toEqual(diagram.player)

    let state: NekzaliState = { ...createNekzaliState('player', 'hard'), time: 16.99, player: { x: 31, z: 0, facing: 0 } }
    state = stepNekzaliState(state, idle, .02)
    expect(state.rendTargetId).toBe('player')
    expect(nekzaliRendRemaining(state)).toBeGreaterThan(14)
    expect(nekzaliSnapshot(state).actors.find(actor => actor.id === 'controlled-player')?.auras[0]).toMatchObject({ id: 'essence-rend', tone: 'danger', stacks: 1, label: 'Rend' })
    const positionBeforeIdle = state.player
    state = stepNekzaliState(state, idle, .5)
    expect(state.player).toEqual(positionBeforeIdle)
    expect(state.rendTargetId).toBe('player')
    state = stepNekzaliState({ ...state, player: { x: 36, z: 0, facing: 0 } }, idle, .01)
    expect(state.rendTargetId).toBeUndefined()
    expect(state.hazards.filter(hazard => hazard.id.startsWith('rend-'))).toHaveLength(1)
    expect(state.hazards[0]).toMatchObject({ radius: 6, kind: 'cultist' })
  })

  it('lets an unaffected healer dispel an NPC Rend only after edge positioning', () => {
    const created = createNekzaliState('healer-2', 'test')
    const initial: NekzaliState = { ...created, time: 10, rendStartedAt: 0, rendTargetId: 'melee-1', rendEventIndex: 1, npcPositions: { ...created.npcPositions, 'melee-1': { x: 36, z: 0 } } }
    const dispelled = dispelNekzali(initial)
    expect(dispelled.rendTargetId).toBeUndefined()
    expect(dispelled.hazards).toHaveLength(1)
    expect(dispelled.timeline.entities.find(entity => entity.id === 'controlled-player')?.actions.at(-1)?.kind).toBe('dispel')
  })

  it('records expiry inside the raid and still preserves the resulting remain', () => {
    const state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 14.99, rendStartedAt: 0, rendTargetId: 'player', rendEventIndex: 1, player: { x: 20, z: 0, facing: 0 } }
    const result = stepNekzaliState(state, idle, .02)
    expect(result.failures[0]?.code).toBe('rend-inside')
    expect(result.hazards).toHaveLength(1)
    expect(result.outcome).toBe('active')
  })

  it('moves persistent Cultists continuously at varied slow orbital speeds without an Invoke jump', () => {
    const clockwise = { id: 'cultist-a', position: { x: 20, z: 0 }, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist' as const, orbitDirection: 1 as const, orbitSpeed: .04 }
    const fasterClockwise = { id: 'cultist-b', position: { x: -30, z: 0 }, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist' as const, orbitDirection: 1 as const, orbitSpeed: .06 }
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 114.9, phase: 'phase-2', phaseStartedAt: 100, hazards: [clockwise, fasterClockwise], bossHealth: 50 }
    state = stepNekzaliState(state, idle, .2)
    expect(state.invokes).toBe(1)
    expect(Math.hypot(state.hazards[0].position.x - clockwise.position.x, state.hazards[0].position.z - clockwise.position.z)).toBeLessThan(.25)
    expect(state.hazards[0].position.z).toBeGreaterThan(0)
    expect(state.hazards[1].position.z).toBeLessThan(0)
    expect(Math.hypot(state.hazards[0].position.x, state.hazards[0].position.z)).toBeCloseTo(20)
    const stepped = { ...state.hazards[0].position }
    state = stepNekzaliState(state, idle, 1)
    expect(state.hazards[0].position).not.toEqual(stepped)
    expect(Math.hypot(state.hazards[0].position.x - stepped.x, state.hazards[0].position.z - stepped.z)).toBeLessThan(1)
  })

  it('expires Cremation fire after three seconds while preserving Cultists across a realm return', () => {
    const cultist = { id: 'cultist', position: { x: 30, z: 0 }, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist' as const, createdAt: 1 }
    const burning = { id: 'burning', position: { x: -30, z: 0 }, radius: 4, direction: { x: 0, z: 0 }, kind: 'burning' as const, createdAt: 18 }
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 20, phase: 'phase-2', phaseStartedAt: 10, realmStage: 'returning', realmStartedAt: 18, hazards: [cultist, burning] }
    expect(nekzaliSnapshot(state).actors.find(actor => actor.id === 'controlled-player')?.auras[0]).toMatchObject({ id: 'realm-return', expiresAt: 23 })
    state = stepNekzaliState(state, idle, 3.01)
    expect(state.realmStage).toBe('none')
    expect(state.hazards.map(hazard => hazard.id)).toEqual(['cultist'])
    expect(nekzaliSnapshot(state).effects.some(effect => effect.id === 'cultist')).toBe(true)
    expect(nekzaliSnapshot(state).actors.length).toBeGreaterThan(15)
  })

  it('gives a full second to leave a newly dropped Rend remain', () => {
    const hazard = { id: 'cultist', position: { x: 20, z: 0 }, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist' as const, createdAt: 1 }
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 1, phase: 'phase-2', phaseStartedAt: 1, hazards: [hazard], player: { x: 20, z: 0, facing: 0 } }
    state = stepNekzaliState(state, idle, .99)
    expect(state.failures.some(failure => failure.code === 'cultist-contact')).toBe(false)
    state = stepNekzaliState(state, idle, .02)
    expect(state.failures[0]?.code).toBe('cultist-contact')
  })

  it('tracks Soulcoil Rite energy and independently expiring Ritual Burn applications', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 8.9 }
    state = stepNekzaliState(state, idle, 3.2)
    expect(state.bossEnergy).toBeGreaterThan(0)
    expect(state.ritualBurnApplications.length).toBeGreaterThan(0)
    expect(nekzaliSnapshot(state).effects.some(effect => effect.id.startsWith('anguished-'))).toBe(true)
  })

  it('announces Soulcoil Ignition before and throughout its visible opening pulses', () => {
    const initial = createNekzaliState('player', 'test', 'learn2d')
    expect(nextNekzaliTimer(initial)).toEqual({ label: 'Soulcoil Ignition in', seconds: 7 })
    expect(nextNekzaliTimer({ ...initial, time: 7.5 })).toEqual({ label: 'Soulcoil Ignition', seconds: 3.5 })
  })

  it('targets Anguished Echo at raid entities, resolves after its telegraph, and leaves no after-image', () => {
    const initial: NekzaliState = { ...createNekzaliState('player', 'test', 'learn2d'), time: 8.99, soulcoilPulseIds: ['phase-1-0-1'] }
    const telegraphed = stepNekzaliDiagramState(initial, idle, .02)
    const playerImpact = telegraphed.anguishedImpacts.find(impact => impact.targetId === 'player')!
    expect(playerImpact.position).toMatchObject({ x: initial.player.x, z: initial.player.z })
    expect(telegraphed.failures).toHaveLength(0)
    const escaped = stepNekzaliDiagramState({ ...telegraphed, player: { x: initial.player.x - 7, z: initial.player.z, facing: 0 } }, idle, 2.01)
    expect(escaped.failures).toHaveLength(0)
    expect(escaped.anguishedImpacts.some(impact => impact.id === playerImpact.id)).toBe(false)
    const hit = stepNekzaliDiagramState(telegraphed, idle, 2.01)
    expect(hit.failures[0]?.code).toBe('anguished-echo')
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

  it('never lets NPC damage finish the player-assigned Amani', () => {
    const assigned = { id: 'amani-player', position: { x: 30, z: 0 }, health: 40, shield: 0, crowdControlled: true, assignedToPlayer: true, playerDamage: 0, corpseGroup: 1 as const }
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 50, addsSpawned: true, adds: [assigned], wellEventIndex: 1, rendEventIndex: 2, barrageStarted: true, barrageResolved: true }
    state = stepNekzaliState(state, idle, 1)
    expect(state.adds[0].health).toBe(40)
    expect(Math.hypot(state.adds[0].position.x, state.adds[0].position.z)).toBeLessThan(30)
    state = stepNekzaliState(startNekzaliMainCast(state), idle, 1.01)
    expect(state.adds[0].health).toBe(0)
    expect(state.playerAddKills).toBe(1)
  })

  it('marks the Barrage carrier, evacuates other NPCs, and exposes the assisted impact area', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 37.99 }
    state = stepNekzaliState(state, idle, .02)
    const snapshot = nekzaliSnapshot(state)
    expect(snapshot.actors.find(actor => actor.id === state.barrageTargetId)?.auras.some(aura => aura.id === 'possession-barrage')).toBe(true)
    expect(snapshot.effects.some(effect => effect.id.endsWith('barrage-assisted-radius') && effect.radius === 10)).toBe(true)
    const target = state.barrageTargetId!
    for (let elapsed = 0; elapsed < NEKZALI_TIMING.projections.train3d.possessionBarrageSeconds - .1; elapsed += .1) state = stepNekzaliState(state, idle, .1)
    const targetPosition = state.npcPositions[target]
    const bystanders = contractRaidRoster.filter(member => member.id !== state.selectedSlotId && member.id !== target)
    expect(bystanders.every(member => Math.hypot(state.npcPositions[member.id].x - targetPosition.x, state.npcPositions[member.id].z - targetPosition.z) > 11)).toBe(true)
  })

  it('treats Barrage geometry as a preview until spirits impact the distant tank', () => {
    let state = stepNekzaliState({ ...createNekzaliState('player', 'test'), time: 37.99 }, idle, .02)
    const target = state.npcPositions[state.barrageTargetId!]
    state = { ...state, player: { x: (state.boss.x + target.x) / 2, z: (state.boss.z + target.z) / 2, facing: 0 } }
    state = stepNekzaliState(state, idle, NEKZALI_TIMING.projections.train3d.possessionBarrageSeconds + .01)
    expect(state.failures.some(failure => failure.code === 'barrage-impact')).toBe(false)
    expect(nekzaliSnapshot(state).effects.some(effect => effect.id.endsWith('barrage-assisted-radius') && effect.kind === 'ground-harmful')).toBe(false)
  })

  it('assigns a stable Pyre-soak or smaller Cremation-cleanup role before pull', () => {
    const duties = contractRaidRoster.map(member => createNekzaliState(member.id, 'test').cleanupDuty)
    expect(duties.some(Boolean)).toBe(true)
    expect(duties.filter(Boolean).length).toBeLessThan(duties.length / 2)
  })

  it('uses roster-derived Realm Groups once in P1 and P2, never during the Echo intermission', () => {
    const groupOneSlot = contractRaidRoster.find(member => createNekzaliState(member.id).wellGroup === 1)!.id
    const groupTwoSlot = contractRaidRoster.find(member => createNekzaliState(member.id).wellGroup === 2)!.id
    const groupOne = stepNekzaliState({ ...createNekzaliState(groupOneSlot, 'test'), time: 54.99, addsSpawned: true, adds: [] }, idle, .02)
    expect(groupOne).toMatchObject({ realmStage: 'pull', wellEventIndex: 1 })
    const outside = stepNekzaliState({ ...createNekzaliState(groupTwoSlot, 'test'), time: 54.99, addsSpawned: true, adds: [] }, idle, .02)
    expect(outside).toMatchObject({ realmStage: 'none', npcRealmGroup: 1, wellEventIndex: 1 })
    const groupTwo = stepNekzaliState({ ...createNekzaliState(groupTwoSlot, 'test'), time: 107.99, phase: 'phase-2', phaseStartedAt: 100, wellEventIndex: 1 }, idle, .02)
    expect(groupTwo).toMatchObject({ realmStage: 'pull', wellEventIndex: 2 })
    const intermission = stepNekzaliState({ ...createNekzaliState(groupOneSlot, 'test'), time: 100, phase: 'echo-1', phaseStartedAt: 100, wellEventIndex: 1 }, idle, .02)
    expect(intermission.realmStage).toBe('none')
    expect(intermission.npcRealmGroup).toBeUndefined()
  })

  it('spawns the Amani wave before the first Grasping Depths call', () => {
    const state = stepNekzaliState({ ...createNekzaliState('player', 'test'), time: 41.99, wellEventIndex: 0 }, idle, .02)
    expect(state.addsSpawned).toBe(true)
    expect(state.realmStage).toBe('none')
  })

  it('shows Soul Transfer before resolving the player intermission duty', () => {
    const pyreSlot = contractRaidRoster.find(member => !createNekzaliState(member.id, 'test').cleanupDuty)!.id
    const state: NekzaliState = { ...createNekzaliState(pyreSlot, 'test'), time: 90, phase: 'echo-1', phaseStartedAt: 90, player: { x: 20, z: 10, facing: 0 } }
    expect(nekzaliSnapshot(state).effects).toContainEqual(expect.objectContaining({ id: 'soul-transfer-1', radius: .85, projectileShape: 'shadowbolt' }))
    const dutyState = { ...state, time: 105.5 }
    expect(nekzaliSnapshot(dutyState).effects).toContainEqual(expect.objectContaining({ id: 'pyre-projectile-1', kind: 'projectile', target: { x: 0, z: -34 } }))
    expect(nekzaliSnapshot(dutyState).effects.some(effect => effect.id === 'pyre-1' || effect.id === 'spread-1')).toBe(true)
    expect(startNekzaliMainCast(state)).toMatchObject({ mainCastRemaining: 1, mainTargetId: 'echo-1' })
    expect(nekzaliSnapshot(state).actors.find(actor => actor.id === 'nekzali-boss')?.auras).toContainEqual({ id: 'unavailable', label: 'Unavailable', tone: 'spectral', stacks: 1 })
  })

  it('telegraphs a dense avoidable field before Phase 2 becomes active', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 100, phase: 'phase-2', phaseStartedAt: 100, player: { x: -29, z: -18, facing: 0 } }
    expect(nekzaliSnapshot(state).effects.filter(effect => effect.id.startsWith('phase-two-awakening-'))).toHaveLength(6)
    state = stepNekzaliState(state, idle, 1.81)
    expect(state.failures.some(failure => failure.code === 'phase-two-transition')).toBe(true)
    expect(state.transitionFieldResolved).toBe(true)
  })

  it('moves intermission NPCs toward the active Echo without detaching Cremation', () => {
    const created = createNekzaliState('player', 'test')
    const member = contractRaidRoster.find(candidate => candidate.id !== 'player')!
    const echoState: NekzaliState = { ...created, time: 90, phase: 'echo-1', phaseStartedAt: 90 }
    const before = echoState.npcPositions[member.id]
    const approached = stepNekzaliState(echoState, idle, .5)
    const after = approached.npcPositions[member.id]
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThanOrEqual(3.5001)
    expect(Math.hypot(after.x, after.z + 34)).toBeLessThan(Math.hypot(before.x, before.z + 34))

    const cremationState: NekzaliState = { ...approached, time: 106, phaseStartedAt: 90 }
    const carried = stepNekzaliState(cremationState, idle, .5)
    const carrier = nekzaliSnapshot(carried).actors.find(actor => actor.auras.some(aura => aura.id === 'cremation'))
    expect(carrier).toBeDefined()
    expect(carrier?.position).toEqual(carried.npcPositions[carrier!.id])
  })

  it('gets the complete intermission raid around the Echo before its soak', () => {
    let state: NekzaliState = { ...createNekzaliState('player', 'test'), time: 90, phase: 'echo-1', phaseStartedAt: 90 }
    for (let elapsed = 0; elapsed < 14.5; elapsed += .1) state = stepNekzaliState(state, idle, .1)
    const actors = nekzaliSnapshot(state).actors.filter(actor => actor.kind === 'ally')
    expect(actors.length).toBeGreaterThan(15)
    expect(actors.filter(actor => Math.hypot(actor.position.x, actor.position.z + 34) <= 14).length).toBeGreaterThanOrEqual(15)
  })

  it('advances past a tolerated Test intermission mistake instead of sticking at zero', () => {
    const created = createNekzaliState('tank-1', 'test', 'learn2d')
    const state: NekzaliState = { ...created, time: 23.99, phase: 'echo-1', phaseStartedAt: 0, cleanupDuty: true, corpses: [{ id: 'corpse', position: { x: 25, z: 0 }, group: 1, cremated: false }] }
    const result = stepNekzaliDiagramState(state, idle, .02)
    expect(result.failures.some(failure => failure.code === 'uncleared-corpse')).toBe(true)
    expect(result.phase).toBe('echo-2')
    expect(result.outcome).toBe('active')
  })
})

describe("Nek'zali Well realm", () => {
  const insideState = (): NekzaliState => ({ ...createNekzaliState('player', 'test'), realmStage: 'inside', realmStartedAt: 0, player: { x: 8, z: 8, facing: Math.PI }, innerCastInterrupted: true, disruptionIndex: 2 })

  it('uses a ten-second assigned Drowned Echo interrupt', () => {
    const interruptible = { ...insideState(), time: 5, innerCastStartedAt: 4, innerCastInterrupted: false }
    expect(interruptNekzali(interruptible).innerCastInterrupted).toBe(true)
    const missed = stepNekzaliState({ ...interruptible, time: 13.99 }, idle, .02)
    expect(missed.failures[0]?.code).toBe('missed-well-interrupt')
    expect(missed.failures[0]?.label).toBe('Failed to kick the Drowned Echo')
  })

  it('cancels a Main cast during disruption without recording a mechanic failure', () => {
    const disrupted = stepNekzaliState({ ...insideState(), time: 12.99, mainCastRemaining: .5, disruptionIndex: 0 }, idle, .02)
    expect(disrupted.mainCastRemaining).toBe(0)
    expect(disrupted.failures).toHaveLength(0)
  })

  it('moves the inside NPC roster persistently between spirit-safe destinations', () => {
    let state = insideState()
    state = stepNekzaliState(state, idle, .1)
    const before = { ...state.realmNpcPositions }
    for (let elapsed = 0; elapsed < 3; elapsed += .1) state = stepNekzaliState(state, idle, .1)
    const snapshot = nekzaliSnapshot(state)
    const allies = snapshot.actors.filter(actor => actor.kind === 'ally')
    const hazards = snapshot.effects.filter(effect => effect.id.startsWith('well-spirit-'))
    expect(allies.some(actor => Math.hypot(actor.position.x - before[actor.id].x, actor.position.z - before[actor.id].z) > 1)).toBe(true)
    expect(allies.every(actor => hazards.every(hazard => Math.hypot(actor.position.x - hazard.position.x, actor.position.z - hazard.position.z) >= 1.5))).toBe(true)
  })

  it('kills the Drowned Echo with 20 Main casts and applies 60-second exhaustion after return', () => {
    let state = insideState()
    for (let hit = 0; hit < 20; hit += 1) state = stepNekzaliState(startNekzaliMainCast(state), idle, 1.01)
    expect(state).toMatchObject({ realmAddHits: 20, realmStage: 'returning' })
    state = stepNekzaliState(state, idle, 5.01)
    expect(state.soulExhaustedUntil! - state.time).toBeCloseTo(60)
  })
})
