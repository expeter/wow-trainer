import { ALL_PLAYER_ROLES, BOTH_ENCOUNTER_MODES, type EncounterActionDefinition } from './encounters'

export const contractRoomActions = [
  { id: 'contract_main', binding: 'mainAbility', label: 'Main', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'contract_shield', binding: 'shield', label: 'Shield', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true, cooldown: 20 },
  { id: 'contract_health_pot', binding: 'healthPot', label: 'Potion', kind: 'special', roles: ALL_PLAYER_ROLES, modes: BOTH_ENCOUNTER_MODES, hud: true },
  { id: 'contract_taunt', binding: 'taunt', label: 'Taunt / Spott', kind: 'taunt', roles: ['tank'], modes: BOTH_ENCOUNTER_MODES, hud: true },
] as const satisfies readonly EncounterActionDefinition[]
