import { describe, expect, it } from 'vitest'
import { activeApplications, applicationRemaining, forProjection, radialKnockback, rotateAround } from './mechanicState'

describe('reusable encounter mechanic state', () => {
  it('selects explicit projection values without a global time multiplier', () => {
    expect(forProjection({ learn2d: 12, train3d: 15 }, 'learn2d')).toBe(12)
    expect(forProjection({ learn2d: 12, train3d: 15 }, 'train3d')).toBe(15)
  })

  it('expires stacked applications independently', () => {
    const applications = [
      { id: 'first', appliedAt: 0, duration: 40 },
      { id: 'second', appliedAt: 5, duration: 40 },
    ]
    expect(activeApplications(applications, 40).map(application => application.id)).toEqual(['second'])
    expect(applicationRemaining(applications[1], 42)).toBe(3)
  })

  it('provides reusable discrete rotation and radial knockback geometry', () => {
    const rotated = rotateAround({ x: 10, z: 0 }, Math.PI / 2)
    expect(rotated.x).toBeCloseTo(0)
    expect(rotated.z).toBeCloseTo(10)
    expect(radialKnockback({ x: 2, z: 0 }, { x: 0, z: 0 }, 3)).toEqual({ x: 5, z: 0 })
  })
})
