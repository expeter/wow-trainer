import { useEffect, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../encounters'
import ContractActionBar from '../ContractActionBar'
import TrainingHud from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { FIXED_STEP_SECONDS } from './simulation'
import ThreeWorldRenderer from './ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from './types'
import { activeContractEvent, CONTRACT_EVENT_SECONDS, contractRoomSnapshot, createContractRoomState, stepContractRoom, turnContractRoomPlayer } from './contractRoomSimulation'

export default function ContractRoom({ keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoomState())
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const [snapshot, setSnapshot] = useState(() => contractRoomSnapshot(stateRef.current))
  const [summary, setSummary] = useState({ successes: 0, misses: 0, wrongGrounds: 0, eventIndex: 0 })

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
        setSummary({ successes: stateRef.current.successes, misses: stateRef.current.misses, wrongGrounds: stateRef.current.wrongGrounds, eventIndex: stateRef.current.eventIndex })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const actions = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
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
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS, forward: mouseForwardRef.current }; keyboardForwardRef.current = false }
    const visibility = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [keyBindings])

  const event = activeContractEvent(stateRef.current)
  const secondsRemaining = CONTRACT_EVENT_SECONDS - (stateRef.current.time - stateRef.current.eventStartedAt)

  return <main className="training-shell contract-room-runtime">
    <header className="training-header">
      <div>
        <p className="eyebrow">DEVELOPMENT · PLATFORM CONTRACT ROOM</p>
        <h1>Reaction and movement lab</h1>
        <p className="lede">A seeded sequence changes the icon attached to your character. Choose the matching ground rune among four simultaneous correct and incorrect reactions.</p>
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
        <TrainingHud settings={hudSettings} mode="Train 3D" objective={`Match the ${event.tone} ground rune`} secondsRemaining={secondsRemaining} position={snapshot.actors[0].position} status={`${summary.successes} resolved · ${summary.misses} missed (${summary.wrongGrounds} wrong rune) · 20-player raid · event ${summary.eventIndex + 1}`} />
        <ContractActionBar keyBindings={keyBindings} eventIndex={summary.eventIndex} />
        <p className="contract-room-note">Four ground objects and their spell projectiles are simulated together. The boss, two tanks, five healers, and thirteen mixed melee/ranged damage players make a 20-player raid including you.</p>
      </div>
    </section>
  </main>
}
