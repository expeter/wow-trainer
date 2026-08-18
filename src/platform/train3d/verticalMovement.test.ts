import { describe, expect, it } from 'vitest'
import { GROUNDED_VERTICAL_MOTION, isAirborne, launchVerticalMotion, stepVerticalMotion } from './verticalMovement'

describe('shared deterministic vertical movement', () => {
  it('launches once per key press, follows gravity, and lands on the floor', () => {
    let state = stepVerticalMotion(GROUNDED_VERTICAL_MOTION, true, 1 / 60)
    expect(state.grounded).toBe(false)
    expect(state.height).toBeGreaterThan(0)
    for (let frame = 0; frame < 180; frame += 1) state = stepVerticalMotion(state, true, 1 / 60)
    expect(state).toMatchObject({ height: 0, velocity: 0, grounded: true, jumpHeld: true })
    expect(stepVerticalMotion(state, true, 1 / 60).grounded).toBe(true)
    state = stepVerticalMotion(state, false, 1 / 60)
    expect(stepVerticalMotion(state, true, 1 / 60).grounded).toBe(false)
  })

  it('supports encounter-authored launches and airborne collision clearance', () => {
    let state = launchVerticalMotion(GROUNDED_VERTICAL_MOTION, 11)
    for (let frame = 0; frame < 20; frame += 1) state = stepVerticalMotion(state, false, 1 / 60)
    expect(isAirborne(state, 1.2)).toBe(true)
  })
})
