import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../../../platform/train3d/simulation'
import { IDLE_PLAYER_COMMANDS } from '../../../platform/train3d/types'
import { createHelicalState, helicalSnapshot, stepHelicalState } from './helicalSimulation'

describe('Helical Toxins headless simulation', () => {
  it('advances movement in deterministic fixed steps without a renderer', () => {
    const forward = { ...IDLE_PLAYER_COMMANDS, forward: true }
    let sixtySteps = createHelicalState()
    for (let index = 0; index < 60; index += 1) sixtySteps = stepHelicalState(sixtySteps, forward, FIXED_STEP_SECONDS)

    let twoChunks = createHelicalState()
    for (let index = 0; index < 2; index += 1) twoChunks = stepHelicalState(twoChunks, forward, .5)

    expect(sixtySteps.player.x).toBeCloseTo(twoChunks.player.x, 8)
    expect(sixtySteps.player.z).toBeCloseTo(twoChunks.player.z, 8)
    expect(sixtySteps.time).toBeCloseTo(1, 8)
  })

  it('publishes toxin stacks as attached aura snapshots', () => {
    const snapshot = helicalSnapshot(createHelicalState())
    expect(snapshot.actors.find(actor => actor.id === 'player')?.auras).toEqual([
      { id: 'green-toxin', tone: 'poison', stacks: 1 },
      { id: 'red-toxin', tone: 'danger', stacks: 3 },
    ])
    expect(snapshot.actors.find(actor => actor.id === 'compatible-partner')?.auras[0].stacks).toBe(3)
  })

  it('expires at the researched matching window', () => {
    const result = stepHelicalState(createHelicalState(), IDLE_PLAYER_COMMANDS, 28)
    expect(result.outcome).toBe('expired')
  })
})
