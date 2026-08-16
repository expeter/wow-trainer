import { useEffect, useRef } from 'react'
import { keyLabel, type CombatAction, type MovementKeyBindings } from '../trainingSettings'
import type { BoundEncounterAction, EncounterActionDefinition, EncounterMode, EncounterPlayerRole } from './types'

export const ALL_PLAYER_ROLES = ['tank', 'healer', 'melee', 'ranged'] as const satisfies readonly EncounterPlayerRole[]
export const BOTH_ENCOUNTER_MODES = ['learn2d', 'train3d'] as const satisfies readonly EncounterMode[]

export function bindEncounterActions(definitions: readonly EncounterActionDefinition[], keyBindings: MovementKeyBindings): readonly BoundEncounterAction[] {
  return definitions.map(definition => ({ ...definition, keyCode: keyBindings[definition.binding] }))
}

export function activeEncounterActions(actions: readonly BoundEncounterAction[], role: EncounterPlayerRole, mode: EncounterMode) {
  return actions.filter(action => action.roles.includes(role) && action.modes.includes(mode))
}

export function encounterActionLegend(actions: readonly BoundEncounterAction[], role: EncounterPlayerRole, mode: EncounterMode) {
  return activeEncounterActions(actions, role, mode).map(action => `${action.label} ${keyLabel(action.keyCode)}`).join(' · ')
}

export function encounterActionBinding(actions: readonly BoundEncounterAction[], binding: CombatAction, role: EncounterPlayerRole, mode: EncounterMode) {
  return activeEncounterActions(actions, role, mode).find(action => action.binding === binding)
}

export function useEncounterActionInput({ actions, role, mode, enabled, paused, handlers }: {
  actions: readonly BoundEncounterAction[]
  role: EncounterPlayerRole
  mode: EncounterMode
  enabled: boolean
  paused: boolean
  handlers: Partial<Record<CombatAction, () => void | boolean>>
}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  useEffect(() => {
    const active = activeEncounterActions(actions, role, mode)
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || paused || event.repeat) return
      const action = active.find(candidate => candidate.keyCode === event.code)
      const handler = action && handlersRef.current[action.binding]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions, enabled, mode, paused, role])
}
