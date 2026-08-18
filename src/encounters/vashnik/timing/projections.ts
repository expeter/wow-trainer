import type { EncounterProjection, ProjectionProfile } from '../../../platform/encounters/mechanicState'

export interface VashnikProjectionTiming {
  cycleSeconds: number
  imbibeAt: number
  infectionAt: number
  infectionDuration: number
  bileAt: number
  bileDuration: number
  frothAt: number
  frothDuration: number
  fangsAt: number
  fangsCastSeconds: number
}

export const vashnikProjectionTimings: ProjectionProfile<VashnikProjectionTiming> = {
  learn2d: { cycleSeconds: 38, imbibeAt: 6, infectionAt: 13, infectionDuration: 8, bileAt: 23, bileDuration: 5, frothAt: 29, frothDuration: 6, fangsAt: 18, fangsCastSeconds: 2 },
  train3d: { cycleSeconds: 46, imbibeAt: 8, infectionAt: 16, infectionDuration: 10, bileAt: 29, bileDuration: 6, frothAt: 37, frothDuration: 6, fangsAt: 22, fangsCastSeconds: 2 },
}

export function vashnikTiming(projection: EncounterProjection): VashnikProjectionTiming {
  return vashnikProjectionTimings[projection]
}
