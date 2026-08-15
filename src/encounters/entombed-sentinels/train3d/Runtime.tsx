import { useEffect, useMemo, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import TrainingHud from '../../../platform/TrainingHud'
import { FIXED_STEP_SECONDS } from '../../../platform/train3d/simulation'
import ThreeWorldRenderer from '../../../platform/train3d/ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { keyLabel } from '../../../platform/trainingSettings'
import { createHelicalState, helicalSnapshot, stepHelicalState, turnHelicalPlayer } from './helicalSimulation'
import { train3dScenarios } from './scenarios'

export default function SentinelsTrain3D({ scenarioId, keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const scenario = useMemo(() => train3dScenarios.find(item => item.id === scenarioId) ?? train3dScenarios[0], [scenarioId])
  const stateRef = useRef(createHelicalState())
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const [snapshot, setSnapshot] = useState(() => helicalSnapshot(stateRef.current))
  const [outcome, setOutcome] = useState(stateRef.current.outcome)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1)
      previous = now
      while (accumulator >= FIXED_STEP_SECONDS) {
        stateRef.current = stepHelicalState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS
      }
      if (now - lastPublish >= 50 || stateRef.current.outcome !== 'active') {
        lastPublish = now
        setSnapshot(helicalSnapshot(stateRef.current))
        setOutcome(stateRef.current.outcome)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [attempt])

  useEffect(() => {
    const actions = Object.keys(keyBindings) as (keyof typeof keyBindings)[]
    const setKey = (event: KeyboardEvent, active: boolean) => {
      const action = actions.find(candidate => keyBindings[candidate] === event.code)
      if (!action) return
      event.preventDefault()
      if (action === 'forward') {
        keyboardForwardRef.current = active
        commandsRef.current.forward = active || mouseForwardRef.current
      } else commandsRef.current[action] = active
    }
    const down = (event: KeyboardEvent) => setKey(event, true)
    const up = (event: KeyboardEvent) => setKey(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [keyBindings])

  const status = outcome === 'active'
    ? 'Read the icons above each character and meet the one compatible partner in the north sector.'
    : outcome === 'success'
      ? 'Resolved: exactly four green, with no third player in contact.'
      : outcome === 'wrong-partner'
        ? 'Wrong partner: the combined green toxins do not total four.'
        : outcome === 'third-player'
          ? 'Third-player collision: only the assigned pair may meet.'
          : 'The 28-second matching window expired.'

  function restart() {
    stateRef.current = createHelicalState()
    commandsRef.current = { ...IDLE_PLAYER_COMMANDS }
    keyboardForwardRef.current = false
    mouseForwardRef.current = false
    setSnapshot(helicalSnapshot(stateRef.current))
    setOutcome('active')
    setAttempt(value => value + 1)
  }

  return <main className="training-shell train3d-runtime">
    <header className="training-header">
      <div>
        <p className="eyebrow">ENTOMBED SENTINELS · TRAIN 3D</p>
        <h1>{scenario.name}</h1>
        <p className="lede">Third-person movement and camera practice. Toxin composition is shown by the small colored icons attached to each character.</p>
      </div>
      <button type="button" className="secondary" onClick={onExit}>Back to setup</button>
    </header>
    <section className="training-runtime-layout">
      <div className="train3d-stage">
        <ThreeWorldRenderer
          snapshot={snapshot}
          cameraSettings={cameraSettings}
          onCameraSettingsChange={onCameraSettingsChange}
          onPlayerLook={yawDelta => { stateRef.current = turnHelicalPlayer(stateRef.current, yawDelta) }}
          onBothButtonsForward={active => {
            mouseForwardRef.current = active
            commandsRef.current.forward = active || keyboardForwardRef.current
          }}
        />
        <p className="train3d-controls">
          Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · left-drag orbit · right-drag face · both buttons forward · wheel zoom
        </p>
      </div>
      <div className="training-sidecar">
        <TrainingHud settings={hudSettings} mode="Train 3D" objective="Read your toxin icons and reach the compatible northern partner" secondsRemaining={28 - snapshot.time} position={snapshot.actors[0].position} status={status} />
        {outcome !== 'active' && <button type="button" className="training-restart" onClick={restart}>Restart drill</button>}
      </div>
    </section>
  </main>
}
