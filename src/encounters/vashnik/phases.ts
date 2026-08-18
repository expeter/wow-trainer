import type { PhaseDefinition } from '../../platform/encounters'

export const phases = [
  {
    id: 'vashnik_virulence_cycle',
    name: 'Cycle of Virulence',
    description: 'Position Vashnik for three ordered fountain pairs while adds and mapped infections overlap core mechanics.',
    abilityIds: ['vashnik_imbibe', 'vashnik_infusions', 'vashnik_toxic_vapor', 'vashnik_living_venoms', 'vashnik_malignant_burst', 'vashnik_caustic_surge', 'vashnik_umbral_ejection', 'vashnik_splitting_clot', 'vashnik_adaptive_infection', 'vashnik_exploding_infection', 'vashnik_stygian_infection', 'vashnik_siphoning_infection', 'vashnik_malignant_catalyst', 'vashnik_plague_froth', 'vashnik_malignant_tumor', 'vashnik_dripping_fangs'],
    roleResponsibilities: [
      { roleId: 'vashnik_tank', responsibilities: ['Swap after Dripping Fangs and hold Vashnik so only the intended counter-clockwise fountain pair is nearest for each Imbibe.'] },
      { roleId: 'vashnik_healer', responsibilities: ['Cover both Blood camps, keep infection targets alive in their lanes, and prepare healing for the assigned Bile overlap.'] },
      { roleId: 'vashnik_damage', responsibilities: ['Prioritize the active add family, resolve the mapped infection, and aim Plague Froth waves through Malignant Tumors.'] },
    ],
  },
] as const satisfies readonly PhaseDefinition[]
