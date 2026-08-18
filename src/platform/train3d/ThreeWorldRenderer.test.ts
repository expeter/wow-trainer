import { describe, expect, it } from 'vitest'
import { arenaSurroundingKind, objectRotationToSimulationFacing, renderedFloorDimensions, simulationFacingToObjectRotation } from './ThreeWorldRenderer'

describe('Train 3D visual facing convention', () => {
  it.each([0, Math.PI / 2, -Math.PI / 2, Math.PI])('maps simulation facing %s to the Three.js -Z forward axis', facing => {
    const rotation = simulationFacingToObjectRotation(facing)
    expect({ x: -Math.sin(rotation), z: -Math.cos(rotation) }).toEqual({ x: Math.sin(facing), z: -Math.cos(facing) })
    expect(objectRotationToSimulationFacing(rotation)).toBe(facing)
  })
})

describe('Train 3D room treatment', () => {
  it('extends the visible floor without changing the arena contract', () => {
    const arena = { id: 'lab', label: 'Lab', shape: 'rectangle' as const, width: 90, depth: 70, anchors: [], theme: {} }
    expect(renderedFloorDimensions(arena)).toEqual({ width: 360, depth: 280 })
    expect(arena).toMatchObject({ width: 90, depth: 70 })
  })

  it('keeps floating-platform surroundings package-authored', () => {
    const toxic = { id: 'toxic', label: 'Toxic', shape: 'rectangle' as const, width: 90, depth: 70, anchors: [], theme: { surroundings: 'toxic-depths' } }
    const cave = { ...toxic, id: 'cave', theme: { surroundings: 'cave-void' } }
    expect(arenaSurroundingKind(toxic)).toBe('toxic-depths')
    expect(arenaSurroundingKind(cave)).toBe('cave-void')
    expect(arenaSurroundingKind({ ...toxic, theme: {} })).toBe('grounded')
  })
})
