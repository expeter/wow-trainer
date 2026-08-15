import type { EncounterPackageV1 } from './types'

export interface PlannedEncounterIdentity {
  id: string
  name: string
  order: number
  summary: string
}

/** Metadata-only package used to reserve a real auto-discovered catalogue slot. */
export function createPlannedEncounterPackage(identity: PlannedEncounterIdentity): EncounterPackageV1 {
  const arenaId = `${identity.id}-planned-arena`
  const diagram = { id: `${identity.id}-planned-diagram`, label: `${identity.name} research diagram`, regions: [] }
  const common = {
    status: 'planned' as const,
    difficulty: 'heroic' as const,
    abilityIds: [], phaseIds: [], roleIds: [], timingProfileIds: [], tacticIds: [],
  }
  return {
    apiVersion: 1,
    manifest: {
      ...identity,
      raid: 'The Venomous Abyss',
      contentSeason: 'Midnight Season 2',
      sourceConfidence: 'medium',
      availability: 'research',
      supportedModes: ['learn2d', 'train3d'],
      supportedDifficulties: ['heroic', 'mythic'],
      defaults: [],
      capabilities: [],
    },
    abilities: [], phases: [], roles: [], timingProfiles: [],
    tacticSchema: { version: 1, fields: [] }, tactics: [],
    learn2d: [
      { ...common, id: `${identity.id}-focused`, name: 'Focused mechanic training', kind: 'focused', mode: 'learn2d', arena: diagram, steps: [] },
      { ...common, id: `${identity.id}-full-fight`, name: 'Heroic full fight', kind: 'full-fight', mode: 'learn2d', arena: diagram, steps: [] },
    ],
    train3d: [
      { ...common, id: `${identity.id}-focused`, name: 'Focused mechanic training', kind: 'focused', mode: 'train3d', arenaId, metricIds: [] },
      { ...common, id: `${identity.id}-full-fight`, name: 'Heroic full fight', kind: 'full-fight', mode: 'train3d', arenaId, metricIds: [] },
    ],
    train3dArenas: [{ id: arenaId, label: `${identity.name} planned arena`, shape: 'circle', width: 90, depth: 90, anchors: [], theme: { floor: '#172523' } }],
    runtimeLoaders: {
      learn2d: () => import('./PlannedRuntime'),
      train3d: () => import('./PlannedRuntime'),
    },
  }
}
