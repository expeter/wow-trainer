import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { createSentinelsState, dispelSentinels, nextSentinelsTimer, sentinelsContract, sentinelsSnapshot, stepSentinelsDiagramState, stepSentinelsState, type SentinelsState } from './simulation'
import { sentinelsArena } from './train3d/arenas'

const idle = { ...IDLE_PLAYER_COMMANDS }

describe('Entombed Sentinels full-fight contract', () => {
  it('starts the bosses about 100 yards apart and fails below the 40-yard Dominance threshold', () => {
    const initial = createSentinelsState('tank-1', 'easy')
    expect(Math.hypot(initial.acidBoss.x - initial.bloodBoss.x, initial.acidBoss.z - initial.bloodBoss.z)).toBe(100)
    expect(initial.acidBoss.x).toBeGreaterThan(0)
    expect(initial.bloodBoss.x).toBeLessThan(0)
    expect(Math.abs(initial.acidBoss.x)).toBeLessThan(sentinelsArena.width / 2)
    const close = { ...initial, time: 9, phaseStartedAt: 0, acidBoss: { x: -15, z: 0 }, bloodBoss: { x: 15, z: 0 } }
    const result = stepSentinelsState(close, idle, .1)
    expect(sentinelsContract.dominanceYards).toBe(40)
    expect(result.outcome).toBe('wipe')
    expect(result.failures[0].code).toBe('dominance')
  })

  it('applies only the mark whose 40-yard boss aura contains the player', () => {
    const state = { ...createSentinelsState('player', 'easy'), time: 4.95, lastMarkAt: 0 }
    const result = stepSentinelsState(state, idle, .1)
    expect(result.acidMarks).toBe(1)
    expect(result.bloodMarks).toBe(0)
  })

  it('uses screen-relative movement only in Learn 2D', () => {
    const initial = createSentinelsState('player', 'hard')
    const forward = { ...idle, forward: true }
    const diagram = stepSentinelsDiagramState(initial, forward, .5)
    const world = stepSentinelsState(initial, forward, .5)
    expect(diagram.player.x).toBeCloseTo(initial.player.x)
    expect(diagram.player.z).toBeLessThan(initial.player.z)
    expect(world.player.x).not.toBeCloseTo(initial.player.x)

    const right = stepSentinelsDiagramState(initial, { ...idle, right: true }, .5)
    expect(right.player.x).toBeGreaterThan(initial.player.x)
    expect(right.player.z).toBeCloseTo(initial.player.z)
  })

  it('publishes the controlled player facing used by right-button camera look', () => {
    const initial = createSentinelsState('player', 'test')
    const turned = { ...initial, player: { ...initial.player, facing: .75 } }
    expect(sentinelsSnapshot(turned).actors.find(actor => actor.kind === 'player')?.facing).toBe(.75)
  })

  it('spawns four droplets and turns a soaked droplet into a returning projectile', () => {
    let state = { ...createSentinelsState('player', 'easy'), time: 11.95 }
    state = stepSentinelsState(state, idle, .1)
    expect(state.droplets).toHaveLength(4)
    const assigned = state.droplets.find(droplet => droplet.assignedToPlayer)!
    state = { ...state, player: { ...state.player, ...assigned.position } }
    state = stepSentinelsState(state, idle, .1)
    expect(state.droplets.find(droplet => droplet.assignedToPlayer)?.soaked).toBe(true)
    expect(sentinelsSnapshot(state).effects.some(effect => effect.id.endsWith('-return'))).toBe(true)
  })

  it('keeps both NPC side groups on the board and gathers them into NPC-owned soaks', () => {
    let state = stepSentinelsState({ ...createSentinelsState('player', 'hard'), time: 11.95 }, idle, .1)
    let snapshot = sentinelsSnapshot(state)
    const allies = snapshot.actors.filter(actor => actor.kind === 'ally')
    expect(allies).toHaveLength(19)
    expect(allies.every(actor => Math.abs(actor.position.x) <= 46 && Math.abs(actor.position.z) <= 26)).toBe(true)
    const npcDroplets = state.droplets.filter(droplet => !droplet.assignedToPlayer)
    const acidAllies = allies.filter(actor => actor.position.x > 0)
    expect(acidAllies.every(actor => npcDroplets.some(droplet => Math.hypot(actor.position.x - droplet.position.x, actor.position.z - droplet.position.z) <= 1.3))).toBe(true)

    state = { ...state, time: 17.1 }
    snapshot = sentinelsSnapshot(state)
    const soak = snapshot.effects.find(effect => effect.id === 'miasma-soak')!
    const bloodAllies = snapshot.actors.filter(actor => actor.kind === 'ally' && actor.position.x < 0)
    expect(bloodAllies.every(actor => Math.hypot(actor.position.x - soak.position.x, actor.position.z - soak.position.z) <= 5.3)).toBe(true)
    expect(state.droplets.find(droplet => droplet.assignedToPlayer)?.soaked).toBe(false)
  })

  it('allows only a Blood-side healer to dispel Blighted Blood', () => {
    const healer = { ...createSentinelsState('healer-2', 'easy'), time: 34, blightedActive: true }
    expect(healer.assignedSide).toBe('blood')
    expect(dispelSentinels(healer).blightedResolved).toBe(true)
    const damage = { ...createSentinelsState('melee-1', 'easy'), time: 34, assignedSide: 'blood' as const, blightedActive: true }
    expect(dispelSentinels(damage).blightedResolved).toBe(false)
  })

  it('enters Stasis at 100 energy and resolves the exact-four partner contact', () => {
    const initial = createSentinelsState('player', 'easy')
    let state: SentinelsState = { ...initial, time: 59.95, dropletsSpawned: true, droplets: [
      { id: 'd1', position: { x: -38, z: 0 }, assignedToPlayer: true, soaked: true, soakedAt: 20 },
    ], miasmaResolved: true, protovenomResolved: true }
    state = stepSentinelsState(state, idle, .1)
    expect(state.phase).toBe('stasis')
    expect(state.energy).toBe(100)
    state = { ...state, player: { x: 2, z: -14, facing: 0 } }
    state = stepSentinelsState(state, idle, .1)
    expect(state.helicalResolved).toBe(true)
  })

  it('swaps the controlled player side after the first Stasis cycle', () => {
    const initial = createSentinelsState('player', 'easy')
    const state = { ...initial, phase: 'stasis' as const, phaseStartedAt: 0, time: 29.95, helicalResolved: true }
    const result = stepSentinelsState(state, idle, .1)
    expect(result.cycle).toBe(2)
    expect(result.phase).toBe('active')
    expect(result.assignedSide).toBe('blood')
  })

  it('includes Protovenom and requires it cleared before Stasis', () => {
    const active = { ...createSentinelsState('player', 'easy'), time: 40 }
    expect(stepSentinelsState(active, idle, .1).protovenomActive).toBe(true)
    const uncleared = { ...createSentinelsState('player', 'easy'), time: 59.95, dropletsSpawned: true, droplets: [
      { id: 'd1', position: { x: -38, z: 0 }, assignedToPlayer: true, soaked: true, soakedAt: 20 },
    ], miasmaResolved: true }
    const result = stepSentinelsState(uncleared, idle, .1)
    expect(result.outcome).toBe('wipe')
    expect(result.failures[0].code).toBe('protovenom-stasis')
  })

  it('keeps Test attempts moving into Stasis after recording uncleared Protovenom', () => {
    const initial = createSentinelsState('player', 'test')
    const state = { ...initial, time: 59.95, dropletsSpawned: true, droplets: [
      { id: 'd1', position: { x: 38, z: 0 }, assignedToPlayer: true, soaked: true, soakedAt: 20 },
    ], miasmaResolved: true }
    const result = stepSentinelsState(state, idle, .1)
    expect(result.outcome).toBe('active')
    expect(result.failures[0].code).toBe('protovenom-stasis')
    expect(result.phase).toBe('stasis')
    expect(result.acidBoss).toEqual({ x: -5, z: 0 })
    expect(result.bloodBoss).toEqual({ x: 5, z: 0 })
  })

  it('exposes the assigned droplet deadline and both visible matching partners', () => {
    const dropletState = stepSentinelsState({ ...createSentinelsState('player', 'test'), time: 11.95 }, idle, .1)
    const timer = nextSentinelsTimer(dropletState)
    expect(timer.label).toBe('Droplet')
    expect(timer.seconds).toBeCloseTo(17.95)

    const protovenom = sentinelsSnapshot({ ...dropletState, time: 40, protovenomActive: true })
    expect(protovenom.actors.some(actor => actor.id === 'protovenom-partner' && actor.auras.some(aura => aura.id === 'protovenom'))).toBe(true)
    expect(protovenom.effects.some(effect => effect.id === 'partner-protovenom-ring')).toBe(true)

    const stasis = sentinelsSnapshot({ ...dropletState, phase: 'stasis', phaseStartedAt: 40, time: 41 })
    expect(stasis.actors.some(actor => actor.id === 'helical-partner' && actor.auras.some(aura => aura.tone === 'poison' && aura.stacks === 3))).toBe(true)
  })

  it('records encounter failures without ending Test attempts', () => {
    const state = { ...createSentinelsState('player', 'test'), time: 9, acidBoss: { x: -10, z: 0 }, bloodBoss: { x: 10, z: 0 } }
    const result = stepSentinelsState(state, idle, .1)
    expect(result.outcome).toBe('active')
    expect(result.failures[0]?.code).toBe('dominance')
  })
})
