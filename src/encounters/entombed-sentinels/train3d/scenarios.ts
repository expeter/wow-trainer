import type { Train3DScenario } from '../../../platform/encounters'

const shared = {
  phaseIds: ['sentinels_active_cycle', 'sentinels_stasis'],
  roleIds: ['sentinels_acid_tank', 'sentinels_blood_tank', 'sentinels_acid_group', 'sentinels_blood_group'],
  timingProfileIds: ['ptr_2026-08-13'],
  tacticIds: ['sentinels_default'],
  arenaId: 'sentinels_split_world',
} as const

export const train3dScenarios = [
  {
    ...shared,
    status: 'ready',
    id: 'sentinels_helical_toxins',
    name: 'Helical Toxins movement drill',
    kind: 'focused',
    mode: 'train3d',
    difficulty: 'heroic',
    abilityIds: ['sentinels_vitriolic_stasis', 'sentinels_helical_toxins'],
    metricIds: ['recognition-latency', 'solve-time', 'wrong-collision', 'path-crossing', 'route-deviation', 'expiry-margin'],
  },
  {
    ...shared,
    status: 'planned',
    id: 'sentinels_mythic_protovenom',
    name: 'Shifting Protovenom movement drill',
    kind: 'focused',
    mode: 'train3d',
    difficulty: 'mythic',
    abilityIds: ['sentinels_shifting_protovenom'],
    metricIds: ['pair-recognition', 'collision-count', 'lane-adherence', 'resolution-margin'],
  },
  {
    ...shared,
    status: 'planned',
    id: 'sentinels_full_fight',
    name: 'Provisional Heroic full fight',
    kind: 'full-fight',
    mode: 'train3d',
    difficulty: 'heroic',
    abilityIds: [
      'sentinels_dominance', 'sentinels_marks', 'sentinels_toxic_droplets', 'sentinels_living_venom',
      'sentinels_unstable_miasma', 'sentinels_vitriolic_stasis', 'sentinels_helical_toxins',
    ],
    metricIds: ['unhandled-objects', 'floor-consumption', 'boss-distance', 'soak-participation', 'swap-time'],
  },
] as const satisfies readonly Train3DScenario[]
