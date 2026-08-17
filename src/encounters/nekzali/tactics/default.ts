import type { TacticPreset } from '../../../platform/encounters'
export const defaultTactic = { id: 'nekzali_default', name: 'Two-half encounter plan', schemaVersion: 2, assignments: {
  soak_group_1: ['tank-1', 'healer-1', 'healer-2', 'melee-1', 'melee-2', 'melee-3', 'ranged-1', 'ranged-2', 'ranged-3', 'ranged-4'],
  soak_group_2: ['tank-2', 'healer-3', 'healer-4', 'healer-5', 'melee-4', 'melee-5', 'ranged-5', 'ranged-6', 'ranged-7', 'ranged-8'],
  rend_edge_lane: 'outer-east', barrage_lane: 'outer-south',
} } as const satisfies TacticPreset
