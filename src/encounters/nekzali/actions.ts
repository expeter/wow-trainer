import { ALL_PLAYER_ROLES, BOTH_ENCOUNTER_MODES, type EncounterActionDefinition } from '../../platform/encounters'

export const actions = [
  { id: 'nekzali_main', binding: 'mainAbility', label: 'Main', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'nekzali_well_interrupt', binding: 'interrupt', label: 'Interrupt', kind: 'interrupt', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'nekzali_dispel_rend', binding: 'dispel', label: 'Dispel', kind: 'dispel', roles: ['healer'], modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'nekzali_taunt', binding: 'taunt', label: 'Taunt / Spott', kind: 'taunt', roles: ['tank'], modes: BOTH_ENCOUNTER_MODES, hud: true },
] as const satisfies readonly EncounterActionDefinition[]
