import { useEffect, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../encounters'
import TrainingHud from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { FIXED_STEP_SECONDS } from './simulation'
import ThreeWorldRenderer from './ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from './types'
import { activeContractEvent, contractRoomSnapshot, createContractRoomState, stepContractRoom, turnContractRoomPlayer } from './contractRoomSimulation'

export default function ContractRoom({ keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoomState())
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const [snapshot, setSnapshot] = useState(() => contractRoomSnapshot(stateRef.current))
  const [summary, setSummary] = useState({ successes: 0, misses: 0, eventIndex: 0 })

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1)
      previous = now
      while (accumulator >= FIXED_STEP_SECONDS) {
        stateRef.current = stepContractRoom(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS
      }
      if (now - lastPublish >= 50) {
        lastPublish = now
        setSnapshot(contractRoomSnapshot(stateRef.current))
        setSummary({ successes: stateRef.current.successes, misses: stateRef.current.misses, eventIndex: stateRef.current.eventIndex })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const actions = Object.keys(keyBindings) as (keyof typeof keyBindings)[]
    const update = (event: KeyboardEvent, active: boolean) => {
      const action = actions.find(candidate => keyBindings[candidate] === event.code)
      if (!action) return
      event.preventDefault()
      if (action === 'forward') {
        keyboardForwardRef.current = active
        commandsRef.current.forward = active || mouseForwardRef.current
      } else commandsRef.current[action] = active
    }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [keyBindings])

  const event = activeContractEvent(stateRef.current)
  const secondsRemaining = 6 - (stateRef.current.time - stateRef.current.eventStartedAt)

  return <main className="training-shell contract-room-runtime">
    <header className="training-header">
      <div>
        <p className="eyebrow">DEVELOPMENT · PLATFORM CONTRACT ROOM</p>
        <h1>Reaction and movement lab</h1>
        <p className="lede">A seeded sequence changes the icon attached to your character. React to the HUD direction before the spell pulse expires.</p>
      </div>
      <button type="button" className="secondary" onClick={onExit}>Back to setup</button>
    </header>
    <section className="training-runtime-layout">
      <div className="train3d-stage">
        <ThreeWorldRenderer
          snapshot={snapshot}
          cameraSettings={cameraSettings}
          onCameraSettingsChange={onCameraSettingsChange}
          onPlayerLook={yawDelta => { stateRef.current = turnContractRoomPlayer(stateRef.current, yawDelta) }}
          onBothButtonsForward={active => {
            mouseForwardRef.current = active
            commandsRef.current.forward = active || keyboardForwardRef.current
          }}
        />
        <p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · mouse-look, both-buttons-forward, and wheel zoom enabled</p>
      </div>
      <div className="training-sidecar">
        <TrainingHud settings={hudSettings} mode="Train 3D" objective={`React ${event.direction} to the new character icon`} secondsRemaining={secondsRemaining} position={snapshot.actors[0].position} status={`${summary.successes} resolved · ${summary.misses} expired · event ${summary.eventIndex + 1}`} />
        <p className="contract-room-note">The event order is randomized from a stable seed. Position checks and expiry run headlessly at 60 fixed steps per second; the renderer only displays snapshots.</p>
      </div>
    </section>
  </main>
}
