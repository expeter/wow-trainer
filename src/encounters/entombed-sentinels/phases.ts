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
    roleResponsibilities: [
      { roleId: 'sentinels_acid_tank', responsibilities: ['Keep the Acid Sentinel separated, preserve its group’s lane, and prepare the ownership swap at full energy.'] },
      { roleId: 'sentinels_blood_tank', responsibilities: ['Keep the Blood Sentinel separated, aim its pressure away from the Acid group, and prepare the ownership swap.'] },
      { roleId: 'sentinels_acid_group', responsibilities: ['Claim assigned Toxic Droplets, dodge outgoing and returning venom, and place Living Venom clear of the corridor.'] },
      { roleId: 'sentinels_blood_group', responsibilities: ['Stack for Unstable Miasma, place Blighted Blood pools at the edge, and leave shifting Protovenom lanes.'] },
      { roleId: 'sentinels_acid_healer', responsibilities: ['Cover Acid-side movement and droplet claims while keeping the central pairing corridor open.'] },
      { roleId: 'sentinels_blood_healer', responsibilities: ['Dispel Blighted Blood on schedule, heal the Miasma stack, and support delayed edge-pool placement.'] },
    ],
  },
  {
    id: 'sentinels_stasis',
    name: 'Vitriolic Stasis',
    description: 'The raid resolves toxin pairs, preserves the corridor, and prepares to swap sides.',
    abilityIds: ['sentinels_vitriolic_stasis', 'sentinels_helical_toxins'],
    roleResponsibilities: [
      { roleId: 'sentinels_acid_tank', responsibilities: ['Meet the assigned toxin partner in the planned sector, then take ownership of the opposite boss after Stasis.'] },
      { roleId: 'sentinels_blood_tank', responsibilities: ['Meet the assigned toxin partner in the planned sector, then take ownership of the opposite boss after Stasis.'] },
      { roleId: 'sentinels_acid_group', responsibilities: ['Match the attached toxin icon to the assigned partner without crossing another pair’s path.'] },
      { roleId: 'sentinels_blood_group', responsibilities: ['Match the attached toxin icon to the assigned partner and clear the corridor before the side swap.'] },
      { roleId: 'sentinels_acid_healer', responsibilities: ['Resolve the assigned toxin pair while covering players moving out of the Acid side.'] },
      { roleId: 'sentinels_blood_healer', responsibilities: ['Resolve the assigned toxin pair, stabilize delayed damage, and move into the new side cleanly.'] },
    ],
  },
] as const satisfies readonly PhaseDefinition[]
