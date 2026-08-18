import { ALL_PLAYER_ROLES, BOTH_ENCOUNTER_MODES, type EncounterActionDefinition } from '../../platform/encounters'

export const actions = [
  { id: 'vashnik_main', binding: 'mainAbility', label: 'Main', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'vashnik_taunt', binding: 'taunt', label: 'Taunt / Spott', kind: 'taunt', roles: ['tank'], modes: BOTH_ENCOUNTER_MODES, hud: true },
] as const satisfies readonly EncounterActionDefinition[]
