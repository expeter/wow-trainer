import type { PhaseDefinition } from '../../platform/encounters'

const base = ['lost_united_defense', 'lost_final_ascension', 'lost_throw_junk', 'lost_disgusting_fish', 'lost_icebound_flames', 'lost_shell_spin']
export const phases = [
  {
    id: 'lost_iku_cycle', name: 'Iku Ultimate', description: 'Recover the first fish and resolve Frostfire Volley.', abilityIds: [...base, 'lost_frostfire_volley'],
    roleResponsibilities: [
      { roleId: 'lost_tank', responsibilities: ['Keep Iku separated from the stacked pair, swap Shredding Shards, and face Shell Spin away from the raid.'] },
      { roleId: 'lost_healer', responsibilities: ['Recover and throw the assigned fish, then cleanse the opposite Frostfire element without pairing identical debuffs.'] },
      { roleId: 'lost_melee', responsibilities: ['Take the assigned Iku interrupt, dodge Shell Spin at close range, and move to the correct Frostfire cleanse partner.'] },
      { roleId: 'lost_ranged', responsibilities: ['Take the assigned Iku interrupt, place ranged hazards outside the group, and reach the correct Frostfire cleanse partner.'] },
    ],
  },
  {
    id: 'lost_gebbo_cycle', name: 'Gebbo Ultimate', description: 'Preserve the mushroom, place the bomb, and cross Blast Wave airborne.', abilityIds: [...base, 'lost_explosive_surprise', 'lost_blast_wave'],
    roleResponsibilities: [
      { roleId: 'lost_tank', responsibilities: ['Keep Gebbo separated, preserve the escape route to the mushroom, and avoid dragging Shell Spin across it.'] },
      { roleId: 'lost_healer', responsibilities: ['Handle the assigned fish while keeping the raid stable through the bomb and airborne Blast Wave crossing.'] },
      { roleId: 'lost_melee', responsibilities: ['Leave the bomb placement lane, protect the mushroom from stray hazards, and jump from it across Blast Wave.'] },
      { roleId: 'lost_ranged', responsibilities: ['Place Explosive Surprise away from the mushroom and raid, then use the mushroom to clear Blast Wave airborne.'] },
    ],
  },
  {
    id: 'lost_nama_cycle', name: 'Nama Ultimate', description: 'Resolve three Mighty Thud groups and their knockbacks.', abilityIds: [...base, 'lost_mighty_thud'],
    roleResponsibilities: [
      { roleId: 'lost_tank', responsibilities: ['Keep Nama separated and aim each Mighty Thud knockback inward so assigned groups remain on the platform.'] },
      { roleId: 'lost_healer', responsibilities: ['Support the assigned Mighty Thud group through its hit and recover players before the next ordered knockback.'] },
      { roleId: 'lost_melee', responsibilities: ['Join the assigned Mighty Thud group, stand on its inward side, and avoid Shell Spin between knockbacks.'] },
      { roleId: 'lost_ranged', responsibilities: ['Join the assigned Mighty Thud group from a clear lane and keep ranged placements out of later soak positions.'] },
    ],
  },
] as const satisfies readonly PhaseDefinition[]
