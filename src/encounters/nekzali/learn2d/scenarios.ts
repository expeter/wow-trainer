import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'
export const nekzaliDiagram = { id: 'nekzali_raidplan', label: "Nek'zali supplied raid-plan arena", regions: [
  { id: 'well', label: 'Soulcoil Well', x: 50, y: 50 }, { id: 'edge', label: 'Essence Rend edge', x: 86, y: 50 },
  { id: 'echo-1', label: 'First Echo', x: 50, y: 16 }, { id: 'echo-2', label: 'Second Echo', x: 50, y: 84 },
] } as const satisfies DiagramArena2D
const shared = { status: 'ready', phaseIds: ['nekzali_phase_1', 'nekzali_intermission', 'nekzali_phase_2', 'nekzali_well_realm'], roleIds: ['nekzali_tank', 'nekzali_healer', 'nekzali_damage'], timingProfileIds: ['nekzali_ptr_2026-08-15', 'nekzali_realm_training_2026-08-15'], tacticIds: ['nekzali_default'], arena: nekzaliDiagram } as const
export const learn2dScenarios = [
  { ...shared, id: 'nekzali_full_fight', name: 'Full fight', kind: 'full-fight', mode: 'learn2d', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_training_rend_trail', 'nekzali_possession_barrage', 'nekzali_hollowing_strikes', 'nekzali_restless_amani', 'nekzali_hungering_pyre', 'nekzali_cremation', 'nekzali_invoke', 'nekzali_grasping_depths', 'nekzali_drowned_echo', 'nekzali_swirling_spirits', 'nekzali_soul_exhaustion', 'nekzali_disruption'], steps: ['Read your role, soak group, and well half.', 'Resolve the active phase and assigned Well realm.', 'Alternate Echo soak and spread.', 'Survive Invoke movement in Phase 2.'] },
] as const satisfies readonly Learn2DScenario[]
