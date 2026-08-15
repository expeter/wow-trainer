import { useEffect, useMemo, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { ArenaTrainingHud } from '../../../platform/TrainingHud'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import RuntimeFeedback, { type RuntimeFailure } from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { FIXED_STEP_SECONDS } from '../../../platform/train3d/simulation'
import ThreeWorldRenderer from '../../../platform/train3d/ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { keyLabel } from '../../../platform/trainingSettings'
import { createHelicalState, helicalSnapshot, stepHelicalState, turnHelicalPlayer } from './helicalSimulation'
import { train3dScenarios } from './scenarios'
import FullFightRuntime from './FullFightRuntime'

function HelicalTrain3D({ scenarioId, keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const scenario = useMemo(() => train3dScenarios.find(item => item.id === scenarioId) ?? train3dScenarios[0], [scenarioId])
  const stateRef = useRef(createHelicalState())
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const renderSnapshotRef = useRef(helicalSnapshot(stateRef.current))
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const [outcome, setOutcome] = useState(stateRef.current.outcome)
  const [attempt, setAttempt] = useState(0)
  const [failures, setFailures] = useState<RuntimeFailure[]>([])
  const pause = useRuntimePause(keyBindings.pause)

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublish = 0
    let publishedOutcome = stateRef.current.outcome
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1)
      previous = now
      let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) {
        if (!pause.pausedRef.current) stateRef.current = stepHelicalState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS
        stepped = true
      }
      if (stepped) renderSnapshotRef.current = helicalSnapshot(stateRef.current)
      if (now - lastPublish >= 100 || stateRef.current.outcome !== publishedOutcome) {
        lastPublish = now
        publishedOutcome = stateRef.current.outcome
        setSnapshot(renderSnapshotRef.current)
        setOutcome(stateRef.current.outcome)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [attempt, pause.pausedRef])

  useEffect(() => {
    const actions = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
    const setKey = (event: KeyboardEvent, active: boolean) => {
      const action = actions.find(candidate => keyBindings[candidate] === event.code)
      if (!action) return
      event.preventDefault()
      if (pause.pausedRef.current) { commandsRef.current[action] = false; return }
      if (action === 'forward') {
        keyboardForwardRef.current = active
        commandsRef.current.forward = active || mouseForwardRef.current
      } else commandsRef.current[action] = active
    }
    const down = (event: KeyboardEvent) => setKey(event, true)
    const up = (event: KeyboardEvent) => setKey(event, false)
    const clear = () => {
      commandsRef.current = { ...IDLE_PLAYER_COMMANDS, forward: mouseForwardRef.current }
      keyboardForwardRef.current = false
    }
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
  }, [keyBindings, pause.pausedRef])

  const status = outcome === 'active'
    ? 'Reach the compatible northern partner.'
    : outcome === 'success'
      ? 'Resolved: exactly four green, with no third player in contact.'
      : outcome === 'wrong-partner'
        ? 'Wrong partner: the combined green toxins do not total four.'
        : outcome === 'third-player'
          ? 'Third-player collision: only the assigned pair may meet.'
          : 'The 28-second matching window expired.'

  const outcomeDetail = outcome === 'success'
    ? ['Helical Toxins resolved', 'Your pair combined to exactly four green toxins without a third player in contact.']
    : outcome === 'wrong-partner'
      ? ['Joined an incompatible toxin partner', 'Add the green toxin icons on both characters and choose the pair that totals exactly four.']
      : outcome === 'third-player'
        ? ['Allowed a third player into the toxin pair', 'Resolve with only the assigned compatible partner; keep every other player outside the contact radius.']
        : ['Toxin matching window expired', 'Read the attached icons, face the compatible northern partner, and start moving before the timer expires.']

  useEffect(() => {
    if (outcome === 'active' || outcome === 'success') return
    setFailures(current => [{ id: `helical-3d-${attempt}-${outcome}`, code: outcome, time: stateRef.current.time, label: outcomeDetail[0], advice: outcomeDetail[1] }, ...current].slice(0, 5))
  }, [attempt, outcome])

  function restart() {
    stateRef.current = createHelicalState()
    renderSnapshotRef.current = helicalSnapshot(stateRef.current)
    commandsRef.current = { ...IDLE_PLAYER_COMMANDS }
    keyboardForwardRef.current = false
    mouseForwardRef.current = false
    setSnapshot(renderSnapshotRef.current)
    setOutcome('active')
    setAttempt(value => value + 1)
  }

  return <main className="training-shell train3d-runtime">
    <RuntimeStatusBar meta="ENTOMBED SENTINELS · TRAIN 3D" title={scenario.name} status={status} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only">
      <div className="train3d-stage">
        <div className="train3d-viewport">
          <ThreeWorldRenderer
            snapshot={snapshot}
            snapshotSource={() => renderSnapshotRef.current}
            cameraSettings={cameraSettings}
            onCameraSettingsChange={onCameraSettingsChange}
            onPlayerLook={yawDelta => { stateRef.current = turnHelicalPlayer(stateRef.current, yawDelta) }}
            onBothButtonsForward={active => {
              mouseForwardRef.current = active && !pause.pausedRef.current
              commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current
            }}
          />
          <ArenaTrainingHud settings={hudSettings} objective="Match toxins with your partner" timers={[{ label: 'Toxins', seconds: 28 - snapshot.time }]} status={status} auraLabel="Helical Toxins" actionStatus="No encounter action assigned" />
          <RuntimeFeedback failures={failures} elapsed={snapshot.time} />
          {outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${attempt}-${outcome}`} kind={outcome === 'success' ? 'success' : 'wipe'} reason={outcomeDetail[0]} advice={outcomeDetail[1]} onRetry={restart} onExit={onExit} />}
        </div>
        <p className="train3d-controls">
          Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · left-drag orbit · right-drag face · both buttons forward · wheel zoom
        </p>
      </div>
    </section>
  </main>
}

export default function SentinelsTrain3D(props: EncounterRuntimeProps) {
  if (props.scenarioId === 'sentinels_full_fight' || props.scenarioId === 'sentinels_mythic_full_fight') return <FullFightRuntime {...props} />
  return <HelicalTrain3D {...props} />
}
