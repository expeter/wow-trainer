import { useEffect, useRef, useState } from 'react'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import EncounterActionButtons from '../../../platform/EncounterActionButtons'
import { encounterActionLegend, useEncounterActionInput, type EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import { ArenaTrainingHud } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import ThreeWorldRenderer from '../../../platform/train3d/ThreeWorldRenderer'
import { FIXED_STEP_SECONDS } from '../../../platform/train3d/simulation'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimeInputClear } from '../../../platform/useRuntimeInputClear'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import VashnikEffectLegend from '../EffectLegend'
import { activeVashnikPrompt, createVashnikState, nextVashnikTimer, prepareVashnikSlot, startVashnikMainCast, stepVashnikState, tauntVashnik, turnVashnikPlayer, vashnikSnapshot } from '../simulation'

export default function VashnikTrain3D({ trainingDifficulty, keyBindings, actions, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createVashnikState('player', trainingDifficulty))
  const renderSnapshotRef = useRef(vashnikSnapshot(stateRef.current))
  const [view, setView] = useState(stateRef.current)
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false })
  const selected = contractSelectedMember(gate.selectedSlotId)

  function publish() { renderSnapshotRef.current = vashnikSnapshot(stateRef.current); setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareVashnikSlot(stateRef.current, slotId); publish() }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createVashnikState(gate.selectedSlotId, trainingDifficulty); publish() }
  function mainAbility() { stateRef.current = startVashnikMainCast(stateRef.current) }
  function taunt() { stateRef.current = tauntVashnik(stateRef.current); publish() }
  useEncounterActionInput({ actions, role: selected.role, mode: 'train3d', enabled: gate.phase === 'active', paused: pause.paused, handlers: { mainAbility, taunt } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let accumulator = 0; let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1); previous = now; let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) { if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepVashnikState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS); accumulator -= FIXED_STEP_SECONDS; stepped = true }
      if (stepped) renderSnapshotRef.current = vashnikSnapshot(stateRef.current)
      if (now - lastPublish >= 100) { lastPublish = now; setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) { commandsRef.current[action] = false; return } if (action === 'forward') { keyboardForwardRef.current = active; commandsRef.current.forward = active || mouseForwardRef.current } else commandsRef.current[action] = active }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const timer = nextVashnikTimer(view)
  const infusionLabel = view.activePair ? `${view.activePair} · Toxic Vapor ${view.toxicVaporStacks}` : 'No active Infusions'
  const actionStatus = view.mainCastRemaining > 0 ? 'Main ability casting' : view.fangsStartedAt !== undefined && selected.role === 'tank' ? 'Tank swap pending' : view.adds.some(add => add.assignedToPlayer && add.health > 0) ? 'Marked add is your priority' : 'Main ability ready'
  return <main className="training-shell vashnik-runtime">
    <RuntimeStatusBar meta={`VASHNIK · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="Vashnik the Malignant full fight" status={`CYCLE ${view.cycle}/3 · ${activeVashnikPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className="train3d-viewport vashnik-viewport">
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnVashnikPlayer(stateRef.current, yaw); renderSnapshotRef.current = vashnikSnapshot(stateRef.current) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <VashnikEffectLegend state={view} />
      <ArenaTrainingHud settings={hudSettings} objective={activeVashnikPrompt(view)} timers={[timer]} status={`Cycle ${view.cycle} · ${view.pairHistory.length}/3 Imbibes resolved`} bossLabel="Vashnik" bossHealth={view.bossHealth} bossEnergy={view.bossEnergy} bossThreat={selected.role === 'tank' ? view.aggroOwner === view.selectedSlotId ? 'owned' : 'hostile' : undefined} auraLabel={view.infection ? `${view.infection.kind} ${Math.max(0, view.infection.expiresAt - view.time).toFixed(1)}s` : infusionLabel} actionStatus={actionStatus} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} enemyCast={view.fangsStartedAt !== undefined ? { label: 'Dripping Fangs', seconds: Math.max(0, 2 - (view.time - view.fangsStartedAt)), duration: 2 } : undefined} actionButton={<EncounterActionButtons actions={actions} role={selected.role} mode="train3d" handlers={{ mainAbility, taunt }} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused || view.mainCastRemaining > 0, taunt: gate.phase !== 'active' || pause.paused || selected.role !== 'tank' || view.aggroOwner === view.selectedSlotId }} />} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel="Vashnik encounter setup" title="Choose role and fountain assignment" description="Your raid position locks role, Blood support camp, and player-owned mechanics for this pull." assignmentNotice={`Cycle order: Flame + Shadow, Shadow + Blood, Blood + Flame. ${selected.role === 'tank' ? 'Swap after Dripping Fangs without losing the intended pair.' : 'Resolve your infection, Bile, and Tumor line while reliable NPCs cover the rest.'}`} bossLabel="Vashnik" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'Vashnik defeated' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed all three fountain packages.' : view.failures[0]?.advice ?? 'Review the active fountain mapping and retry.'} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · {encounterActionLegend(actions, selected.role, 'train3d')} · left orbit · right face · both buttons forward</p></div></section>
    <details className="contract-lab-drawer"><summary>Encounter evidence and provisional timing</summary><div><p><strong>Mechanics:</strong> one reconciled pre-live encounter contract. <strong>Trainer:</strong> {trainingDifficulty}.</p><p>Fountain mapping, sourced durations, and yard radii are shared. Learn 2D and Train 3D own explicit schedules; trainer difficulty changes guidance and tolerance only.</p><p>Tumor destroy-on-wave behavior and cadence remain visibly pre-live pending combat-log validation.</p></div></details>
  </main>
}
