import type { TacticPreset } from '../../../platform/encounters'

export const defaultTactic = {
  id: 'sentinels_default',
  name: 'PTR split-side baseline',
  schemaVersion: 1,
  assignments: {
    acid_tank: 'Tank 1',
    blood_tank: 'Tank 2',
    acid_group: ['Tank 1', 'Acid 1', 'Acid 2', 'Acid 3'],
    blood_group: ['Tank 2', 'Blood 1', 'Blood 2', 'Blood 3'],
    helical_pairs: ['Acid 1 + Blood 1', 'Acid 2 + Blood 2', 'Acid 3 + Blood 3'],
    meeting_sectors: ['north', 'center', 'south'],
    protovenom_pairs: ['Acid 1 + Acid 2', 'Blood 1 + Blood 2'],
    protovenom_lanes: ['acid-outer', 'blood-outer'],
    swap_action_owner: ['Tank 1', 'Tank 2'],
  },
} as const satisfies TacticPreset
