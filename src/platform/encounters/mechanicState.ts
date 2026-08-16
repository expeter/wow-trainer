import type { WorldPoint } from '../train3d/types'

export type EncounterProjection = 'learn2d' | 'train3d'

export type ProjectionProfile<T> = Readonly<Record<EncounterProjection, T>>

export function forProjection<T>(profile: ProjectionProfile<T>, projection: EncounterProjection): T {
  return profile[projection]
}

export interface TimedApplication {
  id: string
  appliedAt: number
  duration: number
}

export function activeApplications<T extends TimedApplication>(applications: readonly T[], time: number): readonly T[] {
  return applications.filter(application => time < application.appliedAt + application.duration)
}

export function applicationRemaining(application: TimedApplication, time: number): number {
  return Math.max(0, application.appliedAt + application.duration - time)
}

export function rotateAround(point: WorldPoint, radians: number, centre: WorldPoint = { x: 0, z: 0 }): WorldPoint {
  const x = point.x - centre.x
  const z = point.z - centre.z
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  return { x: centre.x + x * cosine - z * sine, z: centre.z + x * sine + z * cosine }
}

export function radialKnockback(point: WorldPoint, source: WorldPoint, yards: number): WorldPoint {
  const x = point.x - source.x
  const z = point.z - source.z
  const length = Math.hypot(x, z) || 1
  return { x: point.x + x / length * yards, z: point.z + z / length * yards }
}
