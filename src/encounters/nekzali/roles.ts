import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  { id: 'nekzali_tank', label: 'Tank', responsibilities: ['Carry Possession Barrage away', 'Swap aggro without moving the boss', 'Avoid the other tank lane'], actionIds: ['nekzali_main', 'nekzali_well_interrupt', 'nekzali_taunt'] },
  { id: 'nekzali_healer', label: 'Healer', responsibilities: ['Dispel another Rend target at the edge', 'Respect Pyre or cleanup assignment', 'Track Ritual Burn'], actionIds: ['nekzali_main', 'nekzali_well_interrupt', 'nekzali_dispel_rend'] },
  { id: 'nekzali_damage', label: 'Damage', responsibilities: ['Kill assigned Restless Amani', 'Respect assigned soak half', 'Cremate residual corpses'], actionIds: ['nekzali_main', 'nekzali_well_interrupt'] },
] as const satisfies readonly RoleDefinition[]
