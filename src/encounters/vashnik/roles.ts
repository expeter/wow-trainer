import type { RoleDefinition } from '../../platform/encounters'

export const roles = [
  { id: 'vashnik_tank', label: 'Tank', responsibilities: ['Swap after each Dripping Fangs', 'Keep the intended two fountains nearest', 'Preserve the counter-clockwise pair rotation'], actionIds: ['vashnik_main', 'vashnik_taunt'] },
  { id: 'vashnik_healer', label: 'Healer', responsibilities: ['Support both Blood camps', 'Respect infection lanes', 'Cover assigned Bile'], actionIds: ['vashnik_main'] },
  { id: 'vashnik_damage', label: 'Damage', responsibilities: ['Prioritize the active add family', 'Resolve the assigned infection', 'Aim Froth waves through Tumors'], actionIds: ['vashnik_main'] },
] as const satisfies readonly RoleDefinition[]
