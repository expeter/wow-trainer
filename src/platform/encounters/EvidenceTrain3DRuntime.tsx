import { useEffect, useRef, useState } from 'react'
import { contractSelectedMember } from '../contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import EncounterActionButtons from '../EncounterActionButtons'
import RuntimeFeedback from '../RuntimeFeedback'
import RuntimeOutcomeOverlay from '../RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../RuntimeStatusBar'
import { ArenaTrainingHud } from '../TrainingHud'
import { keyLabel, type CombatAction } from '../trainingSettings'
import ThreeWorldRenderer from '../train3d/ThreeWorldRenderer'
import { FIXED_STEP_SECONDS } from '../train3d/simulation'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../train3d/types'
import { useRuntimeInputClear } from '../useRuntimeInputClear'
import { useRuntimePause } from '../useRuntimePause'
import { encounterActionLegend, useEncounterActionInput } from './actions'
import { createEvidenceEncounterState, evidenceEncounterSnapshot, evidenceStep, evidenceStepRemaining, prepareEvidenceEncounterSlot, resolveEvidenceEncounterAction, stepEvidenceEncounter, turnEvidenceEncounterPlayer, type EvidenceEncounterDefinition } from './evidenceFullFight'
import type { EncounterRuntimeProps } from './types'

export default function EvidenceTrain3DRuntime({ definition, runtime }: { definition: EvidenceEncounterDefinition; runtime: EncounterRuntimeProps }) {
  const { trainingDifficulty, keyBindings, actions, hudSettings, cameraSettings, onCameraSettingsChange, onExit } = runtime
  const stateRef = useRef(createEvidenceEncounterState(definition, 'player', trainingDifficulty, 'train3d'))
  const sequenceSeedRef = useRef(0)
  const renderSnapshotRef = useRef(evidenceEncounterSnapshot(definition, stateRef.current)); const [view, setView] = useState(stateRef.current); const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS }); const keyboardForwardRef = useRef(false); const mouseForwardRef = useRef(false)
  const gate = useContractPullGate(); const pause = useRuntimePause(keyBindings.pause); const selected = contractSelectedMember(gate.selectedSlotId)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false })
  const publish = () => { renderSnapshotRef.current = evidenceEncounterSnapshot(definition, stateRef.current); setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
  const chooseSlot = (slotId: string) => { gate.setSelectedSlotId(slotId); stateRef.current = prepareEvidenceEncounterSlot(definition, stateRef.current, slotId); publish() }
  const retry = () => { pause.reset(); gate.restart(); sequenceSeedRef.current += 1; stateRef.current = createEvidenceEncounterState(definition, gate.selectedSlotId, trainingDifficulty, 'train3d', sequenceSeedRef.current); publish() }
  const resolveAction = (action: CombatAction) => { stateRef.current = resolveEvidenceEncounterAction(definition, stateRef.current, action); publish() }
  const actionHandlers = { mainAbility: () => resolveAction('mainAbility'), interrupt: () => resolveAction('interrupt'), taunt: () => resolveAction('taunt'), dispel: () => resolveAction('dispel'), shield: () => resolveAction('shield'), healthPot: () => resolveAction('healthPot') }
  useEncounterActionInput({ actions, role: selected.role, mode: 'train3d', enabled: gate.phase === 'active', paused: pause.paused, handlers: actionHandlers })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let accumulator = 0; let lastPublish = 0
    const tick = (now: number) => { accumulator += Math.min((now - previous) / 1000, .1); previous = now; let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) { if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepEvidenceEncounter(definition, stateRef.current, commandsRef.current, FIXED_STEP_SECONDS, 'train3d'); accumulator -= FIXED_STEP_SECONDS; stepped = true }
      if (stepped) renderSnapshotRef.current = evidenceEncounterSnapshot(definition, stateRef.current)
      if (now - lastPublish >= 100) { lastPublish = now; setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
      frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [definition, gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight', 'jump'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) { commandsRef.current[action] = false; return } if (action === 'forward') { keyboardForwardRef.current = active; commandsRef.current.forward = active || mouseForwardRef.current } else commandsRef.current[action] = active }
    const down = (event: KeyboardEvent) => update(event, true); const up = (event: KeyboardEvent) => update(event, false); const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const step = evidenceStep(definition, view)
  return <main className={`training-shell evidence-runtime ${definition.id}-runtime`}>
    <RuntimeStatusBar meta={`${definition.name.toUpperCase()} · FULL FIGHT · ${trainingDifficulty.toUpperCase()} · ${selected.role.toUpperCase()}`} title={`${definition.name} full fight`} status={`${definition.resource.label.toUpperCase()} ${view.resource}/${definition.resource.maximum} · ${step.label}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className="train3d-viewport">
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnEvidenceEncounterPlayer(stateRef.current, yaw); renderSnapshotRef.current = evidenceEncounterSnapshot(definition, stateRef.current) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <ArenaTrainingHud settings={hudSettings} objective={step.prompt} timers={[{ label: step.label, seconds: evidenceStepRemaining(definition, view) }]} status={`${definition.resource.label} ${view.resource}/${definition.resource.maximum} · mechanic ${view.stepIndex + 1}/${definition.steps.length}`} bossLabel={definition.bosses.map(boss => boss.name).join(' / ')} bossHealth={Math.max(0, 100 - view.stepIndex / definition.steps.length * 100)} auraLabel={`${definition.resource.label}: ${view.resource}`} actionStatus={step.requiredAction ? `${step.label}: use ${step.requiredAction}` : 'Movement responsibility active'} actionButton={<EncounterActionButtons actions={actions} role={selected.role} mode="train3d" handlers={actionHandlers} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused, interrupt: gate.phase !== 'active' || pause.paused, taunt: gate.phase !== 'active' || pause.paused }} />} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel={`${definition.name} encounter setup`} title="Choose role and full-fight assignment" description={`Practice the maintained ${definition.name} mechanic sequence with simulation-owned movement and collision.`} assignmentNotice={`${definition.steps.length} evidence-backed responsibilities run in one full-fight sequence. Jump uses ${keyLabel(keyBindings.jump)}.`} bossLabel={definition.name} />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? `${definition.name} sequence complete` : view.outcomeReason ?? 'The raid wiped'} reasonCode={view.outcome === 'success' ? 'completed' : view.failures[0]?.code} advice={view.outcome === 'success' ? 'All controlled-player responsibilities resolved.' : view.failures[0]?.advice ?? step.advice} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · jump {keyLabel(keyBindings.jump)}{actions.length ? ` · ${encounterActionLegend(actions, selected.role, 'train3d')}` : ''} · left orbit · right face · both buttons forward</p></div></section>
  </main>
}
