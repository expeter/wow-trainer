import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  {
    id: 'sentinels_acid_tank',
    label: 'Acid tank',
    responsibilities: ['Hold the Acid boss away from its partner.', 'Execute the planned ownership swap after Stasis.'],
    actions: [{ id: 'sentinels_swap_to_blood', label: 'Swap to Blood boss', kind: 'swap', defaultBinding: 'R' }],
  },
  {
    id: 'sentinels_blood_tank',
    label: 'Blood tank',
    responsibilities: ['Hold the Blood boss away from its partner.', 'Execute the planned ownership swap after Stasis.'],
    actions: [{ id: 'sentinels_swap_to_acid', label: 'Swap to Acid boss', kind: 'swap', defaultBinding: 'R' }],
  },
  {
    id: 'sentinels_acid_group',
    label: 'Acid group',
    responsibilities: ['Claim Toxic Droplets.', 'Avoid outgoing and returning venom lanes.', 'Resolve assigned toxin pairs.'],
    actions: [{ id: 'sentinels_claim_droplet', label: 'Claim droplet', kind: 'claim' }],
  },
  {
    id: 'sentinels_blood_group',
    label: 'Blood group',
    responsibilities: ['Group-soak Unstable Miasma.', 'Conserve edge pool space.', 'Resolve assigned toxin pairs.'],
    actions: [{ id: 'sentinels_join_miasma', label: 'Join Miasma soak', kind: 'soak' }],
  },
] as const satisfies readonly RoleDefinition[]
