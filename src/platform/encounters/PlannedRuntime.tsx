import type { EncounterRuntimeProps } from './types'

export default function PlannedRuntime({ onExit }: EncounterRuntimeProps) {
  return <main><p>This encounter is not playable yet.</p><button type="button" onClick={onExit}>Exit</button></main>
}
