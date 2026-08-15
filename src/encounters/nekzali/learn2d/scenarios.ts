import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'
export const nekzaliDiagram = { id: 'nekzali_raidplan', label: "Nek'zali supplied raid-plan arena", regions: [
  { id: 'well', label: 'Soulcoil Well', x: 50, y: 50 }, { id: 'edge', label: 'Essence Rend edge', x: 86, y: 50 },
  { id: 'echo-1', label: 'First Echo', x: 50, y: 16 }, { id: 'echo-2', label: 'Second Echo', x: 50, y: 84 },
] } as const satisfies DiagramArena2D
const shared = { status: 'ready', difficulty: 'heroic', phaseIds: ['nekzali_phase_1', 'nekzali_intermission', 'nekzali_phase_2'], roleIds: ['nekzali_tank', 'nekzali_healer', 'nekzali_damage'], timingProfileIds: ['nekzali_ptr_2026-08-15'], tacticIds: ['nekzali_default'], arena: nekzaliDiagram } as const
export const learn2dScenarios = [
  { ...shared, status: 'planned', id: 'nekzali_mechanic_walkthrough', name: 'Heroic mechanic walkthrough', kind: 'focused', mode: 'learn2d', abilityIds: ['nekzali_essence_rend', 'nekzali_possession_barrage', 'nekzali_hungering_pyre'], steps: ['Drop at the edge.', 'Clear assigned adds.', 'Soak or spread by group.'] },
  { ...shared, id: 'nekzali_heroic_full_fight', name: 'Heroic full fight', kind: 'full-fight', mode: 'learn2d', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_training_rend_trail', 'nekzali_possession_barrage', 'nekzali_hollowing_strikes', 'nekzali_restless_amani', 'nekzali_hungering_pyre', 'nekzali_cremation', 'nekzali_invoke'], steps: ['Read the pre-pull role and soak group.', 'Resolve Phase 1.', 'Alternate Echo soak and spread.', 'Survive Invoke movement in Phase 2.'] },
  { ...shared, status: 'planned', difficulty: 'mythic', id: 'nekzali_mythic_well', name: 'Mythic Grasping Depths', kind: 'focused', mode: 'learn2d', phaseIds: ['nekzali_mythic_well'], abilityIds: ['nekzali_grasping_depths'], timingProfileIds: [], steps: ['Await validated Mythic timing.'] },
] as const satisfies readonly Learn2DScenario[]
