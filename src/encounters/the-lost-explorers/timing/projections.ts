import type { EncounterProjection } from '../../../platform/encounters/mechanicState'

const profiles = {
  learn2d: { cycleSeconds: 34, energyDeadline: 13, ultimateTransition: 1.5 },
  train3d: { cycleSeconds: 38, energyDeadline: 15, ultimateTransition: 2 },
} as const
export function lostTiming(projection: EncounterProjection) { return profiles[projection] }
