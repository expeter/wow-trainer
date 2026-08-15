import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../train3d/types'
import { stepScreenRelativeWorldMovement } from './worldMovement'

describe('screen-relative yard-space diagram movement', () => {
  it('covers equal rendered distance horizontally and vertically on a wide board', () => {
    const player = { x: 0, z: 0, facing: Math.PI / 2 }
    const bounds = { halfWidth: 60, halfDepth: 35 }
    const aspect = 16 / 9
    const left = stepScreenRelativeWorldMovement(player, { ...IDLE_PLAYER_COMMANDS, left: true }, 1, bounds, aspect)
    const down = stepScreenRelativeWorldMovement(player, { ...IDLE_PLAYER_COMMANDS, backward: true }, 1, bounds, aspect)
    const horizontalPixels = Math.abs(left.x) / (bounds.halfWidth * 2) * aspect
    const verticalPixels = Math.abs(down.z) / (bounds.halfDepth * 2)
    expect(horizontalPixels).toBeCloseTo(verticalPixels, 8)
    expect(left.z).toBe(0)
    expect(down.x).toBe(0)
  })

  it('normalizes diagonal input and ignores actor facing', () => {
    const bounds = { halfWidth: 45, halfDepth: 45 }
    const player = { x: 0, z: 0, facing: Math.PI }
    const straight = stepScreenRelativeWorldMovement(player, { ...IDLE_PLAYER_COMMANDS, forward: true }, 1, bounds, 1, 9)
    const diagonal = stepScreenRelativeWorldMovement(player, { ...IDLE_PLAYER_COMMANDS, forward: true, right: true }, 1, bounds, 1, 9)
    expect(straight).toMatchObject({ x: 0, z: -9, facing: Math.PI })
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(9)
  })
})
