import type { PhaseDefinition } from '../../platform/encounters'

export const phases = [
  {
    id: 'vashnik_virulence_cycle',
    name: 'Cycle of Virulence',
    description: 'Position Vashnik for three ordered fountain pairs while adds and mapped infections overlap core mechanics.',
    abilityIds: ['vashnik_imbibe', 'vashnik_infusions', 'vashnik_toxic_vapor', 'vashnik_living_venoms', 'vashnik_malignant_burst', 'vashnik_caustic_surge', 'vashnik_umbral_ejection', 'vashnik_splitting_clot', 'vashnik_adaptive_infection', 'vashnik_exploding_infection', 'vashnik_stygian_infection', 'vashnik_siphoning_infection', 'vashnik_malignant_catalyst', 'vashnik_plague_froth', 'vashnik_malignant_tumor', 'vashnik_dripping_fangs'],
  },
] as const satisfies readonly PhaseDefinition[]
