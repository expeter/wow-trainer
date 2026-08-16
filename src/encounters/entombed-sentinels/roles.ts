import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  {
    id: 'sentinels_acid_tank',
    label: 'Acid tank',
    responsibilities: ['Hold the Acid boss away from its partner.', 'Execute the planned ownership swap after Stasis.'],
    actionIds: ['sentinels_main'],
  },
  {
    id: 'sentinels_blood_tank',
    label: 'Blood tank',
    responsibilities: ['Hold the Blood boss away from its partner.', 'Execute the planned ownership swap after Stasis.'],
    actionIds: ['sentinels_main'],
  },
  {
    id: 'sentinels_acid_group',
    label: 'Acid group',
    responsibilities: ['Claim Toxic Droplets.', 'Avoid outgoing and returning venom lanes.', 'Resolve assigned toxin pairs.'],
    actionIds: ['sentinels_main'],
  },
  {
    id: 'sentinels_blood_group',
    label: 'Blood group',
    responsibilities: ['Group-soak Unstable Miasma.', 'Conserve edge pool space.', 'Resolve assigned toxin pairs.'],
    actionIds: ['sentinels_main'],
  },
  {
    id: 'sentinels_acid_healer',
    label: 'Acid healer',
    responsibilities: ['Handle Acid-side movement.', 'Resolve assigned toxin pairs after Stasis.'],
    actionIds: ['sentinels_main'],
  },
  {
    id: 'sentinels_blood_healer',
    label: 'Blood healer',
    responsibilities: ['Dispel Blighted Blood.', 'Join Miasma and place the delayed pool at the edge.'],
    actionIds: ['sentinels_main', 'sentinels_dispel_blighted_blood'],
  },
] as const satisfies readonly RoleDefinition[]
