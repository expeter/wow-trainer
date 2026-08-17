import { describe, expect, it } from 'vitest'
import { advanceEntityMotion, resolveAttachedEffect } from './entityState'

describe('entity-owned mechanics', () => {
  it('bounds displacement by actor speed', () => {
    const moved = advanceEntityMotion({ x: 0, z: 0 }, { x: 20, z: 0 }, .25, { speed: 7 })
    expect(Math.hypot(moved.x, moved.z)).toBeCloseTo(1.75)
  })

  it('routes around a lethal circular exclusion', () => {
    const moved = advanceEntityMotion({ x: -10, z: 0 }, { x: 10, z: 0 }, 1, { speed: 7, exclusions: [{ centre: { x: 0, z: 0 }, radius: 6 }] })
    expect(Math.hypot(moved.x, moved.z)).toBeGreaterThan(6)
    expect(moved.z).not.toBe(0)
  })

  it('evacuates an actor already inside an exclusion and rejects a destination inside one', () => {
    const exclusion = [{ centre: { x: 0, z: 0 }, radius: 6 }]
    const escaped = advanceEntityMotion({ x: 2, z: 0 }, { x: 12, z: 0 }, 1, { speed: 7, exclusions: exclusion })
    expect(Math.hypot(escaped.x, escaped.z)).toBeGreaterThan(6)
    const redirected = advanceEntityMotion({ x: 12, z: 0 }, { x: 2, z: 0 }, 1, { speed: 7, exclusions: exclusion })
    expect(Math.hypot(redirected.x, redirected.z)).toBeGreaterThan(6)
  })

  it('keeps an attached visual on its live owner', () => {
    const effect = resolveAttachedEffect({ id: 'spread', kind: 'ground-spread', ownerId: 'npc', position: { x: 0, z: 0 }, radius: 4, color: '#f00', progress: .5 }, [
      { id: 'npc', kind: 'ally', position: { x: 12, z: -4 }, facing: 0, color: '#fff', auras: [] },
    ])
    expect(effect.position).toEqual({ x: 12, z: -4 })
  })
})
