import type { Train3DScenario } from '../../../platform/encounters'

export const train3dScenarios = [{
  id: 'vashnik_full_fight', name: 'Full fight', kind: 'full-fight', status: 'ready', mode: 'train3d',
  abilityIds: ['vashnik_imbibe', 'vashnik_infusions', 'vashnik_toxic_vapor', 'vashnik_living_venoms', 'vashnik_malignant_burst', 'vashnik_caustic_surge', 'vashnik_umbral_ejection', 'vashnik_splitting_clot', 'vashnik_adaptive_infection', 'vashnik_exploding_infection', 'vashnik_stygian_infection', 'vashnik_siphoning_infection', 'vashnik_malignant_catalyst', 'vashnik_plague_froth', 'vashnik_malignant_tumor', 'vashnik_dripping_fangs'],
  phaseIds: ['vashnik_virulence_cycle'], roleIds: ['vashnik_tank', 'vashnik_healer', 'vashnik_damage'], timingProfileIds: ['vashnik_pre_live_2026-08-16'], tacticIds: ['vashnik_default'], arenaId: 'vashnik_chamber_world',
  metricIds: ['fountain-pair-correctness', 'add-leaks', 'burning-death-interval', 'infection-placement', 'siphon-coverage', 'bile-occupancy', 'froth-spacing', 'tumors-cleared', 'wave-hits', 'tank-swap-latency'],
}] as const satisfies readonly Train3DScenario[]
