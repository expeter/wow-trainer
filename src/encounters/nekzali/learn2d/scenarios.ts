import type { DiagramArena2D, Learn2DScenario } from '../../../platform/encounters'
export const nekzaliDiagram = { id: 'nekzali_raidplan', label: "Nek'zali supplied raid-plan arena", regions: [
  { id: 'well', label: 'Soulcoil Well', x: 50, y: 50 }, { id: 'edge', label: 'Essence Rend edge', x: 86, y: 50 },
  { id: 'echo-1', label: 'First Echo', x: 50, y: 16 }, { id: 'echo-2', label: 'Second Echo', x: 50, y: 84 },
] } as const satisfies DiagramArena2D
const shared = { status: 'ready', phaseIds: ['nekzali_phase_1', 'nekzali_intermission', 'nekzali_phase_2', 'nekzali_well_realm'], roleIds: ['nekzali_tank', 'nekzali_healer', 'nekzali_damage'], timingProfileIds: ['nekzali_ptr_2026-08-15', 'nekzali_realm_training_2026-08-15'], tacticIds: ['nekzali_default'], arena: nekzaliDiagram } as const
export const learn2dScenarios = [
  { ...shared, id: 'nekzali_full_fight', name: 'Full fight', kind: 'full-fight', mode: 'learn2d', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_possession_barrage', 'nekzali_hollowing_strikes', 'nekzali_restless_amani', 'nekzali_hungering_pyre', 'nekzali_cremation', 'nekzali_invoke', 'nekzali_grasping_depths', 'nekzali_drowned_echo', 'nekzali_swirling_spirits', 'nekzali_soul_exhaustion', 'nekzali_disruption'], steps: [
    'Stay clear of the Well and stop spirits or adds from reaching it.',
    'Take your Rend to the assigned edge lane; heal or dispel it only after the residual Cultist is safely placed.',
    'The active tank carries Barrage far from the raid so every spirit travels the maximum distance.',
    'Tanks swap before Hollowing stacks become unsafe without dragging the boss out of position.',
    'Switch to Restless Amani and kill them before they reach the Well.',
    'Join your assigned Hungering Pyre half; the other half spreads for Slithering Flame.',
    'Spread Cremation over remaining Amani corpses while avoiding other players and residual fire.',
    'Keep resolving the Phase 1 jobs while moving around the orbiting Latent Cultists.',
    'Only the assigned raid half enters Grasping Depths; the outside group maintains the boss arena.',
    'Focus the Drowned Echo and use the assigned interrupt before its cast completes.',
    'Keep moving through the inner realm to avoid orbiting and outward-moving spirits.',
    'Players with Soul Exhaustion stay outside; alternate the raid half on the next Well entry.',
    'Do not begin a long Main cast into Realm Disruption; recover, then resume damage.',
  ] },
] as const satisfies readonly Learn2DScenario[]
