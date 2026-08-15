import type { PhaseDefinition } from '../../platform/encounters'

export const phases = [
  {
    id: 'sentinels_active_cycle',
    name: 'Active cycle',
    description: 'The split raid handles Acid and Blood responsibilities while the bosses gain energy.',
    abilityIds: [
      'sentinels_dominance',
      'sentinels_marks',
      'sentinels_toxic_droplets',
      'sentinels_venom_coagulation',
      'sentinels_living_venom',
      'sentinels_unstable_miasma',
      'sentinels_blighted_blood',
      'sentinels_shifting_protovenom',
    ],
  },
  {
    id: 'sentinels_stasis',
    name: 'Vitriolic Stasis',
    description: 'The raid resolves toxin pairs, preserves the corridor, and prepares to swap sides.',
    abilityIds: ['sentinels_vitriolic_stasis', 'sentinels_helical_toxins'],
  },
] as const satisfies readonly PhaseDefinition[]
