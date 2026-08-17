import type { EncounterProjection, ProjectionProfile } from '../../../platform/encounters/mechanicState'

export interface NekzaliProjectionTiming {
  phaseOneSeconds: number
  essenceRendDurationSeconds: number
  possessionBarrageSeconds: number
  pyreSeconds: number
  wellEntrySeconds: number
  drownedEchoInterruptSeconds: number
  invokeStarts: readonly number[]
  phaseOneRendStarts: readonly number[]
  phaseTwoRendStarts: readonly number[]
  phaseOneIgnitionStarts: readonly number[]
  phaseTwoIgnitionStarts: readonly number[]
}

export const nekzaliProjectionTimings: ProjectionProfile<NekzaliProjectionTiming> = {
  learn2d: {
    phaseOneSeconds: 82,
    essenceRendDurationSeconds: 12,
    possessionBarrageSeconds: 7,
    pyreSeconds: 9,
    wellEntrySeconds: 8,
    drownedEchoInterruptSeconds: 10,
    invokeStarts: [14, 34, 54],
    phaseOneRendStarts: [15, 27],
    phaseTwoRendStarts: [17, 39],
    phaseOneIgnitionStarts: [7, 50],
    phaseTwoIgnitionStarts: [6, 31],
  },
  train3d: {
    phaseOneSeconds: 90,
    essenceRendDurationSeconds: 15,
    possessionBarrageSeconds: 6,
    pyreSeconds: 7.5,
    wellEntrySeconds: 7,
    drownedEchoInterruptSeconds: 10,
    invokeStarts: [15, 35, 55],
    phaseOneRendStarts: [17, 28],
    phaseTwoRendStarts: [18, 38],
    phaseOneIgnitionStarts: [8, 52],
    phaseTwoIgnitionStarts: [7, 32],
  },
}

export function nekzaliTiming(projection: EncounterProjection): NekzaliProjectionTiming {
  return nekzaliProjectionTimings[projection]
}
