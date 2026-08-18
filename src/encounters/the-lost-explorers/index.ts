import type { EncounterPackageV1 } from '../../platform/encounters'
import { abilities } from './abilities'
import { actions } from './actions'
import { learn2dScenarios } from './learn2d/scenarios'
import { manifest } from './manifest'
import { phases } from './phases'
import { roles } from './roles'
import { defaultTactic } from './tactics/default'
import { tacticSchema } from './tactics/schema'
import { preLiveTiming } from './timing/preLive'
import { train3dArenas } from './train3d/arenas'
import { train3dScenarios } from './train3d/scenarios'

export default {
  apiVersion: 1,
  manifest,
  actions,
  abilities,
  phases,
  roles,
  timingProfiles: [preLiveTiming],
  tacticSchema,
  tactics: [defaultTactic],
  learn2d: learn2dScenarios,
  train3d: train3dScenarios,
  train3dArenas,
  runtimeLoaders: {
    learn2d: () => import('./learn2d/Runtime'),
    train3d: () => import('./train3d/Runtime'),
  },
} as const satisfies EncounterPackageV1
