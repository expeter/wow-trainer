import { describe, expect, it } from 'vitest'
import { CONTRACT_LANDING_SECONDS } from '../contractRoom'
import { activeContractEvent2D, contractGroundSlots2D, createContractRoom2DState, stepContractRoom2D } from './contractRoomSimulation'

describe('Learn 2D contract room simulation', () => {
  it('uses independent percentage geometry for matching and wrong ground checks', () => {
    const state = createContractRoom2DState()
    const event = activeContractEvent2D(state)
    const correct = event.groundObjects.find(object => object.correct)!
    const slot = contractGroundSlots2D[correct.direction]
    const resolved = stepContractRoom2D({ ...state, player: { x: slot.x, y: slot.y } }, new Set(), CONTRACT_LANDING_SECONDS)
    expect(resolved.successes).toBe(1)
    expect(resolved.eventIndex).toBe(1)
  })
})
