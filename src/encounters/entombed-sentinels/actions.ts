import { ALL_PLAYER_ROLES, BOTH_ENCOUNTER_MODES, type EncounterActionDefinition } from '../../platform/encounters'

export const actions = [
  { id: 'sentinels_main', binding: 'mainAbility', label: 'Main', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'sentinels_dispel_blighted_blood', binding: 'dispel', label: 'Dispel', kind: 'dispel', roles: ['healer'], modes: BOTH_ENCOUNTER_MODES, hud: true },
] as const satisfies readonly EncounterActionDefinition[]
