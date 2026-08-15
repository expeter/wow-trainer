import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'

const splitDiagram = {
  id: 'sentinels_split_diagram',
  label: 'Abstract split-side plan',
  regions: [
    { id: 'acid-side', label: 'Acid side', x: 20, y: 50 },
    { id: 'center-corridor', label: 'Center corridor', x: 50, y: 50 },
    { id: 'blood-side', label: 'Blood side', x: 80, y: 50 },
    { id: 'north-meeting-sector', label: 'North meeting sector', x: 50, y: 20 },
    { id: 'south-meeting-sector', label: 'South meeting sector', x: 50, y: 80 },
  ],
} as const satisfies DiagramArena2D

const shared = {
  phaseIds: ['sentinels_active_cycle', 'sentinels_stasis'],
  roleIds: ['sentinels_acid_tank', 'sentinels_blood_tank', 'sentinels_acid_group', 'sentinels_blood_group'],
  timingProfileIds: ['ptr_2026-08-13'],
  tacticIds: ['sentinels_default'],
  arena: splitDiagram,
} as const

export const learn2dScenarios = [
  {
    ...shared,
    status: 'ready',
    id: 'sentinels_helical_toxins',
    name: 'Helical Toxins tutorial',
    kind: 'focused',
    mode: 'learn2d',
    difficulty: 'heroic',
    abilityIds: ['sentinels_vitriolic_stasis', 'sentinels_helical_toxins'],
    steps: ['Explain toxin composition.', 'Choose the compatible partner.', 'Meet in the assigned abstract sector.', 'Review the decision.'],
  },
  {
    ...shared,
    status: 'planned',
    id: 'sentinels_mythic_protovenom',
    name: 'Shifting Protovenom tutorial',
    kind: 'focused',
    mode: 'learn2d',
    difficulty: 'mythic',
    abilityIds: ['sentinels_shifting_protovenom'],
    steps: ['Read the partner assignment.', 'Choose the assigned lane.', 'Avoid unmarked traffic.', 'Review the route.'],
  },
  {
    ...shared,
    status: 'planned',
    id: 'sentinels_full_fight',
    name: 'Guided full-fight walkthrough',
    kind: 'full-fight',
    mode: 'learn2d',
    difficulty: 'heroic',
    abilityIds: [
      'sentinels_dominance', 'sentinels_marks', 'sentinels_toxic_droplets', 'sentinels_living_venom',
      'sentinels_unstable_miasma', 'sentinels_vitriolic_stasis', 'sentinels_helical_toxins',
    ],
    steps: ['Review side responsibilities.', 'Walk through Stasis and pairing.', 'Prepare the side swap.', 'Recap the next cycle.'],
  },
] as const satisfies readonly Learn2DScenario[]
