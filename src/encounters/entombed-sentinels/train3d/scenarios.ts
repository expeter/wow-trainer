import type { Train3DScenario } from '../../../platform/encounters'

const shared = {
  phaseIds: ['sentinels_active_cycle', 'sentinels_stasis'],
  roleIds: ['sentinels_acid_tank', 'sentinels_blood_tank', 'sentinels_acid_group', 'sentinels_blood_group', 'sentinels_acid_healer', 'sentinels_blood_healer'],
  timingProfileIds: ['ptr_2026-08-13'],
  tacticIds: ['sentinels_default'],
  arenaId: 'sentinels_split_world',
} as const

export const train3dScenarios = [
  {
    ...shared,
    status: 'ready',
    id: 'sentinels_full_fight',
    name: 'Full fight',
    kind: 'full-fight',
    mode: 'train3d',
    abilityIds: [
      'sentinels_dominance', 'sentinels_marks', 'sentinels_toxic_droplets', 'sentinels_living_venom', 'sentinels_venom_coagulation',
      'sentinels_unstable_miasma', 'sentinels_vitriolic_stasis', 'sentinels_helical_toxins',
      'sentinels_blighted_blood', 'sentinels_shifting_protovenom',
    ],
    metricIds: ['unhandled-objects', 'boss-distance', 'soak-participation', 'dispel-latency', 'protovenom-pairing', 'helical-solve'],
  },
] as const satisfies readonly Train3DScenario[]
