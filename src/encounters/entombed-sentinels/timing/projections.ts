import type { EncounterProjection, ProjectionProfile } from '../../../platform/encounters/mechanicState'

export interface SentinelsProjectionTiming {
  activeSeconds: readonly [number, number]
  markCadenceSeconds: number
  markLifetimeSeconds: number
  dropletFuseSeconds: number
  livingVenomSeconds: number
  miasmaSeconds: number
  blightedBloodSeconds: number
  stasisSeconds: number
  helicalSeconds: number
}

export const sentinelsProjectionTimings: ProjectionProfile<SentinelsProjectionTiming> = {
  learn2d: { activeSeconds: [54, 64], markCadenceSeconds: 5, markLifetimeSeconds: 40, dropletFuseSeconds: 14, livingVenomSeconds: 5, miasmaSeconds: 9, blightedBloodSeconds: 18, stasisSeconds: 30, helicalSeconds: 28 },
  train3d: { activeSeconds: [60, 72], markCadenceSeconds: 5, markLifetimeSeconds: 40, dropletFuseSeconds: 12, livingVenomSeconds: 4, miasmaSeconds: 8, blightedBloodSeconds: 18, stasisSeconds: 30, helicalSeconds: 28 },
}

export function sentinelsTiming(projection: EncounterProjection): SentinelsProjectionTiming {
  return sentinelsProjectionTimings[projection]
}
