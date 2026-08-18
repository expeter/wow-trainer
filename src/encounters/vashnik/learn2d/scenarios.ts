import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'

export const vashnikDiagram = { id: 'vashnik_raidplan', label: 'Vashnik three-fountain raid-plan arena', regions: [
  { id: 'cavity', label: 'Malignant Cavity', x: 50, y: 50 },
  { id: 'blood', label: 'Blood Fountain', x: 50, y: 13 },
  { id: 'flame', label: 'Flame Fountain', x: 18, y: 69 },
  { id: 'shadow', label: 'Shadow Fountain', x: 82, y: 69 },
] } as const satisfies DiagramArena2D

const abilities = ['vashnik_imbibe', 'vashnik_infusions', 'vashnik_toxic_vapor', 'vashnik_living_venoms', 'vashnik_malignant_burst', 'vashnik_caustic_surge', 'vashnik_umbral_ejection', 'vashnik_splitting_clot', 'vashnik_adaptive_infection', 'vashnik_exploding_infection', 'vashnik_stygian_infection', 'vashnik_siphoning_infection', 'vashnik_malignant_catalyst', 'vashnik_plague_froth', 'vashnik_malignant_tumor', 'vashnik_dripping_fangs'] as const
export const learn2dScenarios = [{ id: 'vashnik_full_fight', name: 'Full fight', kind: 'full-fight', status: 'ready', mode: 'learn2d', abilityIds: abilities, phaseIds: ['vashnik_virulence_cycle'], roleIds: ['vashnik_tank', 'vashnik_healer', 'vashnik_damage'], timingProfileIds: ['vashnik_pre_live_2026-08-16'], tacticIds: ['vashnik_default'], arena: vashnikDiagram, steps: ['Position for the called fountain pair.', 'Recognize its adds and infection variants.', 'Cover Bile, then spread Froth waves through Tumors.', 'Repeat all three fountain pairs without changing mechanics by trainer difficulty.'] }] as const satisfies readonly Learn2DScenario[]
