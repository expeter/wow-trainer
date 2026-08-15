import { describe, expect, it } from 'vitest'
import { stepDiagramMovement, type DiagramDirection } from './movement'

describe('Learn 2D diagram movement', () => {
  it.each([
    ['forward', { x: 50, y: 26 }],
    ['backward', { x: 50, y: 74 }],
    ['left', { x: 26, y: 50 }],
    ['right', { x: 74, y: 50 }],
  ] as const)('moves %s independently', (direction, expected) => {
    expect(stepDiagramMovement({ x: 50, y: 50 }, new Set<DiagramDirection>([direction]), 1)).toEqual(expected)
  })

  it('normalizes diagonals and clamps every arena edge', () => {
    const diagonal = stepDiagramMovement({ x: 50, y: 50 }, new Set<DiagramDirection>(['forward', 'right']), 1)
    expect(Math.hypot(diagonal.x - 50, diagonal.y - 50)).toBeCloseTo(24)
    expect(stepDiagramMovement({ x: 5, y: 95 }, new Set<DiagramDirection>(['left', 'backward']), 2)).toEqual({ x: 5, y: 95 })
  })
})
