import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'

export const vashnikDiagram = { id: 'vashnik_raidplan', label: 'Vashnik three-fountain raid-plan arena', regions: [
  { id: 'cavity', label: 'Malignant Cavity', x: 50, y: 50 },
  { id: 'blood', label: 'Blood Fountain', x: 50, y: 13 },
  { id: 'flame', label: 'Flame Fountain', x: 18, y: 69 },
  { id: 'shadow', label: 'Shadow Fountain', x: 82, y: 69 },
] } as const satisfies DiagramArena2D

const abilities = ['vashnik_imbibe', 'vashnik_infusions', 'vashnik_toxic_vapor', 'vashnik_living_venoms', 'vashnik_malignant_burst', 'vashnik_caustic_surge', 'vashnik_umbral_ejection', 'vashnik_splitting_clot', 'vashnik_adaptive_infection', 'vashnik_exploding_infection', 'vashnik_stygian_infection', 'vashnik_siphoning_infection', 'vashnik_malignant_catalyst', 'vashnik_plague_froth', 'vashnik_malignant_tumor', 'vashnik_dripping_fangs'] as const
export const learn2dScenarios = [{ id: 'vashnik_full_fight', name: 'Full fight', kind: 'full-fight', status: 'ready', mode: 'learn2d', abilityIds: abilities, phaseIds: ['vashnik_virulence_cycle'], roleIds: ['vashnik_tank', 'vashnik_healer', 'vashnik_damage'], timingProfileIds: ['vashnik_pre_live_2026-08-16'], tacticIds: ['vashnik_default'], arena: vashnikDiagram, steps: [
  'Before 100 energy, position Vashnik nearest the two fountains called for the next Imbibe.',
  'Track the two active Infusions and increase priority damage or healing as their stacks rise.',
  'Use raid healing and defensives for the increasing background Toxic Vapor pressure.',
  'Focus every Living Venom family before any add reaches the central cavity.',
  'Treat an add reaching the Malignant Cavity as a wipe: slow, control, and finish it early.',
  'Stagger Burning Venom deaths by more than three seconds so Caustic Surges do not overlap.',
  'Kill Shrouded Venoms while leaving the small Umbral Ejection impact circles.',
  'Keep switching to the Blood split lineage until every one-to-two-to-four add is dead.',
  'Identify the infection created by the active fountain pair, then move to its assigned lane or camp.',
  'Carry Exploding Infection to an uncontested outer lane before it is removed.',
  'Keep moving with Stygian Infection so each repeated Shadow burst is left behind the carrier.',
  'Form two separated support camps around Siphoning carriers and clear both absorbs.',
  'Put at least one assigned player inside every Catalytic Bile circle.',
  'Froth targets spread before expiry and aim all four cardinal waves away from other players.',
  'Aim Plague Waves through the assigned Tumors and destroy each within two Froth opportunities.',
  'Tanks swap ownership after every Dripping Fangs application.',
] }] as const satisfies readonly Learn2DScenario[]
