import type { EncounterActionDefinition } from '../../platform/encounters'

export const actions = [
  { id: 'lost_throw_fish', binding: 'mainAbility', label: 'Throw fish', kind: 'special', roles: ['tank', 'healer', 'melee', 'ranged'], modes: ['learn2d', 'train3d'], hud: true },
  { id: 'lost_interrupt', binding: 'interrupt', label: 'Interrupt Iku', kind: 'interrupt', roles: ['tank', 'melee', 'ranged'], modes: ['learn2d', 'train3d'], hud: true },
  { id: 'lost_taunt', binding: 'taunt', label: 'Taunt / swap', kind: 'taunt', roles: ['tank'], modes: ['learn2d', 'train3d'], hud: true },
] as const satisfies readonly EncounterActionDefinition[]
