import type { TacticPreset } from '../../../platform/encounters'
import { tacticSchema } from './schema'

export const defaultTactic = {
  id: 'lost_explorers_default', name: 'Iku → Gebbo → Nama', schemaVersion: 1,
  assignments: { 'fish-order': ['lost-iku', 'lost-gebbo', 'lost-nama'], 'thud-groups': ['group-one', 'group-two', 'group-three'], 'interrupt-owner': 'player' },
  placements: tacticSchema.planner!.maps[0].placements,
} as const satisfies TacticPreset
