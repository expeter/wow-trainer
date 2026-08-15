import { useEffect, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../encounters'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import type { ContractPlayerRole } from '../contractRoom'
import RuntimeStatusBar from '../RuntimeStatusBar'
import RuntimeFeedback from '../RuntimeFeedback'
import { ArenaTrainingHud } from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { useContractActions } from '../useContractActions'
import { useRuntimePause } from '../useRuntimePause'
import { FIXED_STEP_SECONDS } from './simulation'
import ThreeWorldRenderer from './ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from './types'
import { activeContractEvent, CONTRACT_EVENT_SECONDS, contractRoomSnapshot, createContractRoomState, prepareContractRoomRole, stepContractRoom, turnContractRoomPlayer } from './contractRoomSimulation'

export default function ContractRoom({ keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoomState())
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const renderSnapshotRef = useRef(contractRoomSnapshot(stateRef.current))
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const [summary, setSummary] = useState({ successes: 0, misses: 0, wrongGrounds: 0, eventIndex: 0 })
  const [performanceSample, setPerformanceSample] = useState({ fps: 0, p95Ms: 0 })
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const actions = useContractActions({ enabled: gate.phase === 'active', role: gate.role, eventIndex: summary.eventIndex, keyBindings, includeMainAndPotion: true })
  const roleRef = useRef(gate.role)
  const healthRef = useRef(actions.health)
  roleRef.current = gate.role
  healthRef.current = actions.health

  function chooseRole(role: ContractPlayerRole) {
    gate.setRole(role)
    stateRef.current = prepareContractRoomRole(stateRef.current, role)
    renderSnapshotRef.current = contractRoomSnapshot(stateRef.current, role, actions.health)
    setSnapshot(renderSnapshotRef.current)
  }

  useEffect(() => {
    renderSnapshotRef.current = contractRoomSnapshot(stateRef.current, gate.role, actions.health)
  }, [actions.health, gate.role])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1)
      previous = now
      let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) {
        if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepContractRoom(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS
        stepped = true
      }
      if (stepped) renderSnapshotRef.current = contractRoomSnapshot(stateRef.current, roleRef.current, healthRef.current)
      if (now - lastPublish >= 100) {
        lastPublish = now
        setSnapshot(renderSnapshotRef.current)
        setSummary({ successes: stateRef.current.successes, misses: stateRef.current.misses, wrongGrounds: stateRef.current.wrongGrounds, eventIndex: stateRef.current.eventIndex })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const actions = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
    const update = (event: KeyboardEvent, active: boolean) => {
      const action = actions.find(candidate => keyBindings[candidate] === event.code)
      if (!action) return
      event.preventDefault()
      if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) {
        commandsRef.current[action] = false
        return
      }
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
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const event = activeContractEvent(stateRef.current)
  const secondsRemaining = CONTRACT_EVENT_SECONDS - (stateRef.current.time - stateRef.current.eventStartedAt)

  return <main className="training-shell contract-room-runtime">
    <RuntimeStatusBar meta={`DEVELOPMENT · TRAIN 3D LAB · ${gate.role.toUpperCase()}`} title="Reaction and movement lab" status={`Match ${event.tone} · ${summary.successes} resolved · event ${summary.eventIndex + 1}`} performance={`${performanceSample.fps || '…'} FPS · p95 ${performanceSample.p95Ms || '…'} ms`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only">
      <div className="train3d-stage">
        <div className="train3d-viewport">
          <ThreeWorldRenderer
            snapshot={snapshot}
            snapshotSource={() => renderSnapshotRef.current}
            cameraSettings={cameraSettings}
            onCameraSettingsChange={onCameraSettingsChange}
            onPlayerLook={yawDelta => { stateRef.current = turnContractRoomPlayer(stateRef.current, yawDelta) }}
            onBothButtonsForward={active => {
              mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current
              commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current
            }}
            onPerformanceSample={setPerformanceSample}
          />
          <ArenaTrainingHud settings={hudSettings} objective={`Match the ${event.tone} ground rune`} secondsRemaining={secondsRemaining} position={snapshot.actors[0].position} status={`${summary.successes} resolved · ${summary.misses} missed · 20-player raid · event ${summary.eventIndex + 1}`} playerHealth={actions.health} auraLabel={`${event.tone} aura`} actionStatus={actions.mainCast > 0 ? 'Main ability casting' : 'Main ability ready'} castSeconds={actions.mainCast} actionButton={<button type="button" onClick={actions.activateMain} disabled={gate.phase !== 'active' || actions.mainCast > 0}>Main ability <kbd>{keyLabel(keyBindings.mainAbility)}</kbd></button>} />
          <ContractPullOverlay role={gate.role} onRoleChange={chooseRole} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" />
          <RuntimeFeedback failures={stateRef.current.failures} elapsed={snapshot.time} />
        </div>
        <p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · Main {keyLabel(keyBindings.mainAbility)} · Shield {keyLabel(keyBindings.shield)} · Potion {keyLabel(keyBindings.healthPot)}{gate.role === 'tank' ? ` · Taunt / Spott ${keyLabel(keyBindings.taunt)}` : ''} · mouse-look, both-buttons-forward, wheel zoom</p>
      </div>
    </section>
    <details className="contract-lab-drawer"><summary>Lab configuration</summary><div><p>Four ground objects and their spell projectiles are simulated together.</p><p>The boss, two tanks, five healers, and thirteen mixed melee/ranged damage players make a 20-player raid including you.</p><p>{summary.successes} resolved · {summary.misses} missed · {summary.wrongGrounds} wrong rune</p></div></details>
  </main>
}
