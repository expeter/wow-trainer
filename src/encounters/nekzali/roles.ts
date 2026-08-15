import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  { id: 'nekzali_tank', label: 'Tank', responsibilities: ['Carry Possession Barrage away', 'Swap aggro without moving the boss', 'Avoid the other tank lane'], actions: [{ id: 'nekzali_taunt', label: 'Taunt / Spott', kind: 'taunt', defaultBinding: 'Numpad1' }, { id: 'nekzali_well_interrupt', label: 'Interrupt Drowned Echo', kind: 'interrupt', defaultBinding: 'KeyT' }] },
  { id: 'nekzali_healer', label: 'Healer', responsibilities: ['Respect assigned soak half', 'Spread Slithering Flame', 'Track Ritual Burn'], actions: [{ id: 'nekzali_well_interrupt', label: 'Interrupt Drowned Echo', kind: 'interrupt', defaultBinding: 'KeyT' }] },
  { id: 'nekzali_damage', label: 'Damage', responsibilities: ['Kill assigned Restless Amani', 'Respect assigned soak half', 'Cremate residual corpses'], actions: [{ id: 'nekzali_main', label: 'Main ability', kind: 'special', defaultBinding: 'KeyF' }, { id: 'nekzali_well_interrupt', label: 'Interrupt Drowned Echo', kind: 'interrupt', defaultBinding: 'KeyT' }] },
] as const satisfies readonly RoleDefinition[]
