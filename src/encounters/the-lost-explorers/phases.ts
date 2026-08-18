import type { PhaseDefinition } from '../../platform/encounters'

const base = ['lost_united_defense', 'lost_final_ascension', 'lost_throw_junk', 'lost_disgusting_fish', 'lost_icebound_flames', 'lost_shell_spin']
export const phases = [
  { id: 'lost_iku_cycle', name: 'Iku Ultimate', description: 'Recover the first fish and resolve Frostfire Volley.', abilityIds: [...base, 'lost_frostfire_volley'] },
  { id: 'lost_gebbo_cycle', name: 'Gebbo Ultimate', description: 'Preserve the mushroom, place the bomb, and cross Blast Wave airborne.', abilityIds: [...base, 'lost_explosive_surprise', 'lost_blast_wave'] },
  { id: 'lost_nama_cycle', name: 'Nama Ultimate', description: 'Resolve three Mighty Thud groups and their knockbacks.', abilityIds: [...base, 'lost_mighty_thud'] },
] as const satisfies readonly PhaseDefinition[]
