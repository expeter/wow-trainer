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
  roleIds: ['sentinels_acid_tank', 'sentinels_blood_tank', 'sentinels_acid_group', 'sentinels_blood_group', 'sentinels_acid_healer', 'sentinels_blood_healer'],
  timingProfileIds: ['ptr_2026-08-13'],
  tacticIds: ['sentinels_default'],
  arena: splitDiagram,
} as const

export const learn2dScenarios = [
  {
    ...shared,
    status: 'ready',
    id: 'sentinels_full_fight',
    name: 'Full fight',
    kind: 'full-fight',
    mode: 'learn2d',
    abilityIds: [
      'sentinels_dominance', 'sentinels_marks', 'sentinels_toxic_droplets', 'sentinels_living_venom', 'sentinels_venom_coagulation',
      'sentinels_unstable_miasma', 'sentinels_vitriolic_stasis', 'sentinels_helical_toxins',
      'sentinels_blighted_blood', 'sentinels_shifting_protovenom',
    ],
    steps: [
      'Tanks keep the two Sentinels more than 40 yards apart so Dominance never activates.',
      'Stay with your assigned Acid or Blood side and track the accumulating side mark.',
      'Assigned Acid players intercept Toxic Droplets before they explode.',
      'Dodge the outgoing venom lanes, then move again for their delayed return path.',
      'Switch to Venom Coagulation immediately and kill it before Contaminate completes.',
      'The Blood group stacks for Miasma, then marked players carry the delayed pool to the edge.',
      'At full energy, move to the Stasis meeting sector and prepare the toxin pairing puzzle.',
      'Find the red/green partner whose combined toxin count equals four green and meet only that player.',
      'A Blood healer dispels Blighted Blood after the carrier reaches the assigned safe drop location.',
      'Protovenom partners meet in their assigned lane without touching unmarked or incorrect players.',
    ],
  },
] as const satisfies readonly Learn2DScenario[]
