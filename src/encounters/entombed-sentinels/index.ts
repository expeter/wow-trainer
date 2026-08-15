import type { EncounterPackageV1 } from '../../platform/encounters'
import { abilities } from './abilities'
import { learn2dScenarios } from './learn2d/scenarios'
import { manifest } from './manifest'
import { phases } from './phases'
import { roles } from './roles'
import { defaultTactic } from './tactics/default'
import { tacticSchema } from './tactics/schema'
import { ptrTiming } from './timing/ptr'
import { train3dArenas } from './train3d/arenas'
import { train3dScenarios } from './train3d/scenarios'

const encounterPackage = {
  apiVersion: 1,
  manifest,
  abilities,
  phases,
  roles,
  timingProfiles: [ptrTiming],
  tacticSchema,
  tactics: [defaultTactic],
  learn2d: learn2dScenarios,
  train3d: train3dScenarios,
  train3dArenas,
} as const satisfies EncounterPackageV1

export default encounterPackage
