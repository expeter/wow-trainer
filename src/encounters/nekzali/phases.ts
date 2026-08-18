import type { PhaseDefinition } from '../../platform/encounters'

export const phases = [
  {
    id: 'nekzali_phase_1', name: 'Soulcoiler Initiation', description: 'Edge remains, distance tank play, and Well-bound adds.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_possession_barrage', 'nekzali_hollowing_strikes', 'nekzali_restless_amani'],
    roleResponsibilities: [
      { roleId: 'nekzali_tank', responsibilities: ['Carry Possession Barrage away from the raid, then swap Hollowing Strikes without dragging Nek’zali through the room.'] },
      { roleId: 'nekzali_healer', responsibilities: ['Send Essence Rend targets to the edge and dispel only after their remains are safely placed.'] },
      { roleId: 'nekzali_damage', responsibilities: ['Kill each assigned Restless Amani before it reaches the Soulcoil Well while preserving the tank lanes.'] },
    ],
  },
  {
    id: 'nekzali_intermission', name: 'Ritual of Awakening', description: 'Two alternating Echo soak/spread cycles clear every Amani corpse.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_hungering_pyre', 'nekzali_cremation'],
    roleResponsibilities: [
      { roleId: 'nekzali_tank', responsibilities: ['Join the assigned Hungering Pyre half and keep the next Echo cycle’s route clear of uncremated remains.'] },
      { roleId: 'nekzali_healer', responsibilities: ['Stabilize the assigned Pyre soak, then spread for Cremation without clipping the opposite half.'] },
      { roleId: 'nekzali_damage', responsibilities: ['Follow the assigned soak half and use Cremation to clear the remaining Amani corpses before the next cycle.'] },
    ],
  },
  {
    id: 'nekzali_phase_2', name: 'Uncoiling', description: 'Phase 1 rules continue while Invoke moves Cultist hazards and raises energy.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_possession_barrage', 'nekzali_invoke'],
    roleResponsibilities: [
      { roleId: 'nekzali_tank', responsibilities: ['Repeat the Barrage and Hollowing swap while holding Nek’zali clear of the moving Invoke hazards.'] },
      { roleId: 'nekzali_healer', responsibilities: ['Place and dispel Essence Rend at the edge while tracking players displaced by the Cultist pattern.'] },
      { roleId: 'nekzali_damage', responsibilities: ['Avoid the invoked Cultists, protect the Well, and keep the boss area open for Rend and tank lanes.'] },
    ],
  },
  {
    id: 'nekzali_well_realm', name: 'Grasping Depths', description: 'The assigned raid half defeats and interrupts the Drowned Echo inside the Well realm.', abilityIds: ['nekzali_grasping_depths', 'nekzali_drowned_echo', 'nekzali_swirling_spirits', 'nekzali_soul_exhaustion', 'nekzali_disruption'],
    roleResponsibilities: [
      { roleId: 'nekzali_tank', responsibilities: ['Enter with the assigned half, hold the Drowned Echo, and interrupt Disruption while avoiding Swirling Spirits.'] },
      { roleId: 'nekzali_healer', responsibilities: ['Keep the realm group moving through Swirling Spirits and take an assigned Disruption interrupt when available.'] },
      { roleId: 'nekzali_damage', responsibilities: ['Focus the Drowned Echo, rotate assigned Disruption interrupts, and leave every Swirling Spirit lane.'] },
    ],
  },
] as const satisfies readonly PhaseDefinition[]
