import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from './types'
import { activeContractEvent, contractRoomSnapshot, createContractRoomState, stepContractRoom } from './contractRoomSimulation'

describe('development contract room simulation', () => {
  it('produces a deterministic seeded aura sequence', () => {
    const first = createContractRoomState(42)
    const second = createContractRoomState(42)
    expect(first.events).toEqual(second.events)
    expect(new Set(first.events.map(event => event.id)).size).toBe(4)
  })

  it('changes the attached aura after an unhandled expiry', () => {
    const initial = createContractRoomState()
    const initialAura = contractRoomSnapshot(initial).actors[0].auras[0].id
    const expired = stepContractRoom(initial, IDLE_PLAYER_COMMANDS, 6)
    expect(expired.misses).toBe(1)
    expect(activeContractEvent(expired).id).not.toBe(initialAura)
  })

  it('publishes representative position and spell-animation primitives', () => {
    const snapshot = contractRoomSnapshot(createContractRoomState())
    expect(snapshot.effects.map(effect => effect.kind)).toEqual(['pulse', 'projectile'])
    expect(snapshot.actors[0].auras[0].stacks).toBe(1)
  })
})
