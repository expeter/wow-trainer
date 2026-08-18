import type { TacticPreset } from '../../../platform/encounters'

export const defaultTactic = { id: 'vashnik_default', name: 'Counter-clockwise fountain rotation', schemaVersion: 2, assignments: {
  pair_rotation: 'flame-shadow_shadow-blood_blood-flame',
  siphon_camp_a: ['tank-1', 'healer-1', 'healer-2', 'melee-1', 'melee-2', 'melee-3', 'ranged-1', 'ranged-2', 'ranged-3', 'ranged-4'],
  siphon_camp_b: ['tank-2', 'healer-3', 'healer-4', 'healer-5', 'melee-4', 'melee-5', 'ranged-5', 'ranged-6', 'ranged-7', 'ranged-8'],
  outer_infection_lane: 'outer-south',
} } as const satisfies TacticPreset
