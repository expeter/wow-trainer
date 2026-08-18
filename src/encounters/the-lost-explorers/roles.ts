import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  { id: 'lost_tank', label: 'Council tank', responsibilities: ['Keep only two explorers together', 'Swap Shredding Shards and Steady Strikes', 'Aim Thud knockbacks inward'], actionIds: ['lost_throw_fish', 'lost_interrupt', 'lost_taunt'] },
  { id: 'lost_healer', label: 'Fish / cleanse healer', responsibilities: ['Recover and throw the assigned fish', 'Cleanse the opposite Frostfire element', 'Support each assigned Thud group'], actionIds: ['lost_throw_fish'] },
  { id: 'lost_melee', label: 'Melee explorer', responsibilities: ['Interrupt Iku when assigned', 'Dodge Shell Spin', 'Resolve the assigned Ultimate duty'], actionIds: ['lost_throw_fish', 'lost_interrupt'] },
  { id: 'lost_ranged', label: 'Ranged explorer', responsibilities: ['Place crates and Blink Nova clear of the raid', 'Interrupt Iku when assigned', 'Resolve the assigned Ultimate duty'], actionIds: ['lost_throw_fish', 'lost_interrupt'] },
] as const satisfies readonly RoleDefinition[]
