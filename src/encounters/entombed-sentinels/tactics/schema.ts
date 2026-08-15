import type { TacticSchema } from '../../../platform/encounters'

export const tacticSchema = {
  version: 1,
  fields: [
    { id: 'acid_tank', label: 'Acid tank', kind: 'player', required: true },
    { id: 'blood_tank', label: 'Blood tank', kind: 'player', required: true },
    { id: 'acid_group', label: 'Acid-side group', kind: 'group', required: true },
    { id: 'blood_group', label: 'Blood-side group', kind: 'group', required: true },
    { id: 'helical_pairs', label: 'Helical Toxin pairs', kind: 'pair', required: true },
    { id: 'meeting_sectors', label: 'Helical meeting sectors', kind: 'region', required: true },
    { id: 'protovenom_pairs', label: 'Mythic Protovenom pairs', kind: 'pair', required: false },
    { id: 'protovenom_lanes', label: 'Mythic meeting lanes', kind: 'region', required: false },
    { id: 'swap_action_owner', label: 'Tank swap action owner', kind: 'action-owner', required: true },
  ],
} as const satisfies TacticSchema
