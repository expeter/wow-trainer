import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from './types'
import { activeContractEvent, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, contractGroundPosition3D, contractRoomSnapshot, createContractRoomState, stepContractRoom } from './contractRoomSimulation'
import { WOW_MOVEMENT_PROFILE, distance } from './simulation'

describe('development contract room simulation', () => {
  it('produces a deterministic seeded aura sequence', () => {
    const first = createContractRoomState(42)
    const second = createContractRoomState(42)
    expect(first.events).toEqual(second.events)
    expect(new Set(first.events.map(event => event.id)).size).toBe(4)
    expect(first.events.every(event => event.groundObjects.length === 4 && event.groundObjects.filter(object => object.correct).length === 1)).toBe(true)
  })

  it('changes the attached aura after an unhandled expiry', () => {
    const initial = createContractRoomState()
    const initialAura = contractRoomSnapshot(initial).actors[0].auras[0].id
    const expired = stepContractRoom(initial, IDLE_PLAYER_COMMANDS, CONTRACT_EVENT_SECONDS)
    expect(expired.misses).toBe(1)
    expect(activeContractEvent(expired).id).not.toBe(initialAura)
  })

  it('publishes representative position and spell-animation primitives', () => {
    const snapshot = contractRoomSnapshot(createContractRoomState())
    expect(snapshot.effects.filter(effect => effect.kind === 'pulse')).toHaveLength(4)
    expect(snapshot.effects.filter(effect => effect.kind === 'projectile')).toHaveLength(4)
    expect(snapshot.actors[0].auras[0].stacks).toBe(1)
    expect(snapshot.actors).toHaveLength(21)
    expect(snapshot.markers?.map(marker => marker.kind)).toEqual(['star', 'cross', 'diamond', 'circle'])
    expect(snapshot.effects.filter(effect => effect.kind === 'cosmetic-projectile')).toHaveLength(19)
  })

  it('keeps the controlled render identity unique after every slot transfer', () => {
    for (const slotId of ['player', 'tank-1', 'healer-5', 'melee-3', 'ranged-7']) {
      const snapshot = contractRoomSnapshot(createContractRoomState(), slotId)
      expect(snapshot.actors.map(actor => actor.id)).toEqual([...new Set(snapshot.actors.map(actor => actor.id))])
      expect(snapshot.actors.find(actor => actor.kind === 'player')?.id).toBe('controlled-player')
    }
  })

  it('distinguishes matching and wrong ground contacts after projectiles land', () => {
    const initial = createContractRoomState()
    const event = activeContractEvent(initial)
    const correct = event.groundObjects.find(object => object.correct)!
    const wrong = event.groundObjects.find(object => !object.correct)!
    const success = stepContractRoom({ ...initial, player: { ...initial.player, ...contractGroundPosition3D(correct.direction) } }, IDLE_PLAYER_COMMANDS, CONTRACT_LANDING_SECONDS)
    const failure = stepContractRoom({ ...initial, player: { ...initial.player, ...contractGroundPosition3D(wrong.direction) } }, IDLE_PLAYER_COMMANDS, CONTRACT_LANDING_SECONDS)
    expect(success.successes).toBe(1)
    expect(failure.wrongGrounds).toBe(1)
    expect(failure.failures[0]).toMatchObject({ code: 'wrong-ground' })
  })

  it('keeps every consecutive reaction point reachable inside one event window', () => {
    const directions = ['north', 'east', 'south', 'west'] as const
    const longestRoute = Math.max(...directions.flatMap(from => directions.map(to => distance(contractGroundPosition3D(from), contractGroundPosition3D(to)))))
    expect(longestRoute / WOW_MOVEMENT_PROFILE.runSpeed).toBeLessThan(CONTRACT_EVENT_SECONDS - .5)
  })
})
