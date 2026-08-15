import { describe, expect, it } from 'vitest'
import { objectRotationToSimulationFacing, simulationFacingToObjectRotation } from './ThreeWorldRenderer'

describe('Train 3D visual facing convention', () => {
  it.each([0, Math.PI / 2, -Math.PI / 2, Math.PI])('maps simulation facing %s to the Three.js -Z forward axis', facing => {
    const rotation = simulationFacingToObjectRotation(facing)
    expect({ x: -Math.sin(rotation), z: -Math.cos(rotation) }).toEqual({ x: Math.sin(facing), z: -Math.cos(facing) })
    expect(objectRotationToSimulationFacing(rotation)).toBe(facing)
  })
})
