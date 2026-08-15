import type { TacticSchema } from '../../../platform/encounters'
export const tacticSchema = { version: 1, fields: [
  { id: 'soak_group_1', label: 'First Echo soak group', kind: 'group', required: true },
  { id: 'soak_group_2', label: 'Second Echo soak group', kind: 'group', required: true },
  { id: 'rend_edge_lane', label: 'Essence Rend edge lane', kind: 'region', required: true },
  { id: 'barrage_lane', label: 'Possession Barrage lane', kind: 'region', required: true },
] } as const satisfies TacticSchema
