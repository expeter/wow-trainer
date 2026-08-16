import { activeEncounterActions, type BoundEncounterAction, type EncounterMode, type EncounterPlayerRole } from './encounters'
import type { CombatAction } from './trainingSettings'
import { keyLabel } from './trainingSettings'

export default function EncounterActionButtons({ actions, role, mode, handlers, disabled = {} }: {
  actions: readonly BoundEncounterAction[]
  role: EncounterPlayerRole
  mode: EncounterMode
  handlers: Partial<Record<CombatAction, () => void>>
  disabled?: Partial<Record<CombatAction, boolean>>
}) {
  const visible = activeEncounterActions(actions, role, mode).filter(action => action.hud && handlers[action.binding])
  if (!visible.length) return null
  return <>{visible.map(action => <button type="button" key={action.id} aria-label={`${action.binding === 'mainAbility' ? 'Main ability' : action.label} ${keyLabel(action.keyCode)}`} onClick={handlers[action.binding]} disabled={disabled[action.binding]}>
    {action.label} <kbd>{keyLabel(action.keyCode)}</kbd>
  </button>)}</>
}
