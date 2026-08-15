import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS, stepPlayerMovement } from './simulation'
import { IDLE_PLAYER_COMMANDS } from './types'

const bounds = { halfWidth: 50, halfDepth: 30 }

describe('shared Train 3D movement contract', () => {
  it('uses character-facing forward movement and perpendicular strafing', () => {
    const start = { x: 0, z: 0, facing: 0 }
    const forward = stepPlayerMovement(start, { ...IDLE_PLAYER_COMMANDS, forward: true }, 1, bounds)
    const right = stepPlayerMovement(start, { ...IDLE_PLAYER_COMMANDS, right: true }, 1, bounds)
    expect(forward).toMatchObject({ x: 0, z: -16 })
    expect(right).toMatchObject({ x: 16, z: 0 })
  })

  it('supports keyboard turning independently from movement', () => {
    const turned = stepPlayerMovement({ x: 0, z: 0, facing: 0 }, { ...IDLE_PLAYER_COMMANDS, turnRight: true }, 1, bounds)
    expect(turned.x).toBe(0)
    expect(turned.z).toBe(0)
    expect(turned.facing).toBeCloseTo(2.35)
  })

  it('produces the same movement across fixed render-frame groupings', () => {
    const commands = { ...IDLE_PLAYER_COMMANDS, forward: true, right: true }
    let state = { x: 0, z: 0, facing: .4 }
    for (let index = 0; index < 120; index += 1) state = stepPlayerMovement(state, commands, FIXED_STEP_SECONDS, bounds)

    let grouped = { x: 0, z: 0, facing: .4 }
    for (let index = 0; index < 40; index += 1) {
      for (let step = 0; step < 3; step += 1) grouped = stepPlayerMovement(grouped, commands, FIXED_STEP_SECONDS, bounds)
    }
    expect(grouped).toEqual(state)
  })
})
