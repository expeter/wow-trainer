import { useEffect, useRef, useState } from 'react'
import { encounterActionLegend, type EncounterRuntimeProps } from '../encounters'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import EncounterActionButtons from '../EncounterActionButtons'
import RuntimeStatusBar from '../RuntimeStatusBar'
import RuntimeFeedback from '../RuntimeFeedback'
import { ArenaTrainingHud } from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { useContractActions } from '../useContractActions'
import { useRuntimePause } from '../useRuntimePause'
import { useRuntimeInputClear } from '../useRuntimeInputClear'
import { FIXED_STEP_SECONDS } from './simulation'
import { classProjectileEffects } from './cosmeticCombat'
import ThreeWorldRenderer from './ThreeWorldRenderer'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from './types'
import { activeContractEvent, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, contractRoomSnapshot, createContractRoomState, prepareContractRoomSlot, stepContractRoom, turnContractRoomPlayer } from './contractRoomSimulation'
import { beginEncounterAction } from '../encounters/timeline'

export default function ContractRoom({ keyBindings, actions: actionRegistry, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
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
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false })
  const actions = useContractActions({ enabled: gate.phase === 'active', paused: pause.paused, role: gate.role, mode: 'train3d', eventIndex: summary.eventIndex, actions: actionRegistry, onAction: action => {
    stateRef.current = { ...stateRef.current, timeline: beginEncounterAction(stateRef.current.timeline, { id: 'controlled-player', kind: 'controlled-player' }, action, action === 'mainAbility' ? 1 : 0, 'spell-dummy') }
  } })
  const healthRef = useRef(actions.health)
  healthRef.current = actions.health

  function chooseSlot(slotId: string) {
    gate.setSelectedSlotId(slotId)
    stateRef.current = prepareContractRoomSlot(stateRef.current, slotId)
    renderSnapshotRef.current = contractRoomSnapshot(stateRef.current, slotId, actions.health)
    setSnapshot(renderSnapshotRef.current)
  }

  useEffect(() => {
    const next = contractRoomSnapshot(stateRef.current, gate.selectedSlotId, actions.health)
    const player = next.actors.find(actor => actor.kind === 'player')
    const boss = next.actors.find(actor => actor.kind === 'boss')
    renderSnapshotRef.current = actions.mainProjectileAge >= 0 && player?.playerClass && boss
      ? { ...next, effects: [...next.effects, ...classProjectileEffects('contract-player-main', player.position, boss.position, player.playerClass, actions.mainProjectileAge, summary.eventIndex, 1)] }
      : next
  }, [actions.health, actions.mainProjectileAge, gate.selectedSlotId, summary.eventIndex])

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
      if (stepped) renderSnapshotRef.current = contractRoomSnapshot(stateRef.current, gate.selectedSlotId, healthRef.current)
      if (now - lastPublish >= 100) {
        lastPublish = now
        setSnapshot(renderSnapshotRef.current)
        setSummary({ successes: stateRef.current.successes, misses: stateRef.current.misses, wrongGrounds: stateRef.current.wrongGrounds, eventIndex: stateRef.current.eventIndex })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, gate.selectedSlotId, pause.pausedRef])

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
  const eventAge = stateRef.current.time - stateRef.current.eventStartedAt
  const secondsRemaining = CONTRACT_EVENT_SECONDS - eventAge

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
          <ArenaTrainingHud settings={hudSettings} objective={`Match the ${event.tone} rune`} timers={[{ label: 'React', seconds: secondsRemaining }, { label: 'Ground', seconds: CONTRACT_LANDING_SECONDS - eventAge }]} status={`${summary.successes} resolved · ${summary.misses} missed · 20-player raid · event ${summary.eventIndex + 1}`} playerHealth={actions.health} auraLabel={`${event.tone} aura`} actionStatus={actions.mainCast > 0 ? 'Main ability casting' : 'Main ability ready'} castSeconds={actions.mainCast} castSecondsSource={actions.mainCastSecondsSource} actionButton={<EncounterActionButtons actions={actionRegistry} role={gate.role} mode="train3d" handlers={{ mainAbility: actions.activateMain, shield: actions.activateShield, healthPot: actions.activatePotion, taunt: actions.activateTaunt }} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused || actions.mainCast > 0, shield: gate.phase !== 'active' || pause.paused || actions.shieldCooldown > 0, healthPot: gate.phase !== 'active' || pause.paused || actions.potionUsed, taunt: gate.phase !== 'active' || pause.paused }} />} />
          <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" />
          <RuntimeFeedback failures={stateRef.current.failures} elapsed={snapshot.time} />
        </div>
        <p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · {encounterActionLegend(actionRegistry, gate.role, 'train3d')} · mouse-look, both-buttons-forward, wheel zoom</p>
      </div>
    </section>
    <details className="contract-lab-drawer"><summary>Lab configuration</summary><div><p><strong>Reaction:</strong> four ground runes appear together; enter only the one matching your attached aura.</p><p><strong>Timing:</strong> projectiles land after {CONTRACT_LANDING_SECONDS.toFixed(1)}s and each reaction expires after {CONTRACT_EVENT_SECONDS}s.</p><p><strong>Visual checks:</strong> four dummy raid markers and continuous class-colored NPC casts are cosmetic only.</p><p><strong>Raid:</strong> two tanks, five healers, five melee, and eight ranged players including you.</p><p>{summary.successes} resolved · {summary.misses} missed · {summary.wrongGrounds} wrong rune</p></div></details>
  </main>
}
