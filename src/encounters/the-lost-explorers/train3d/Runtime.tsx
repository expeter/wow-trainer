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
import { activeLostExplorersPrompt, createLostExplorersState, interruptLostExplorersIku, lostExplorersSnapshot, nextLostExplorersTimer, prepareLostExplorersSlot, stepLostExplorersState, tauntLostExplorers, throwLostExplorersFish, turnLostExplorersPlayer } from '../simulation'

export default function LostExplorersTrain3D({ trainingDifficulty, keyBindings, actions, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createLostExplorersState('player', trainingDifficulty))
  const renderSnapshotRef = useRef(lostExplorersSnapshot(stateRef.current))
  const [view, setView] = useState(stateRef.current)
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false); const mouseForwardRef = useRef(false)
  const gate = useContractPullGate(); const pause = useRuntimePause(keyBindings.pause); const selected = contractSelectedMember(gate.selectedSlotId)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false })
  function publish() { renderSnapshotRef.current = lostExplorersSnapshot(stateRef.current); setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareLostExplorersSlot(stateRef.current, slotId); publish() }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createLostExplorersState(gate.selectedSlotId, trainingDifficulty); publish() }
  function mainAbility() { stateRef.current = throwLostExplorersFish(stateRef.current); publish() }
  function interrupt() { stateRef.current = interruptLostExplorersIku(stateRef.current); publish() }
  function taunt() { stateRef.current = tauntLostExplorers(stateRef.current); publish() }
  useEncounterActionInput({ actions, role: selected.role, mode: 'train3d', enabled: gate.phase === 'active', paused: pause.paused, handlers: { mainAbility, interrupt, taunt } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let accumulator = 0; let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1); previous = now; let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) { if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepLostExplorersState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS); accumulator -= FIXED_STEP_SECONDS; stepped = true }
      if (stepped) renderSnapshotRef.current = lostExplorersSnapshot(stateRef.current)
      if (now - lastPublish >= 100) { lastPublish = now; setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight', 'jump'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) { commandsRef.current[action] = false; return } if (action === 'forward') { keyboardForwardRef.current = active; commandsRef.current.forward = active || mouseForwardRef.current } else commandsRef.current[action] = active }
    const down = (event: KeyboardEvent) => update(event, true); const up = (event: KeyboardEvent) => update(event, false); const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const timer = nextLostExplorersTimer(view)
  return <main className="training-shell lost-explorers-runtime">
    <RuntimeStatusBar meta={`LOST EXPLORERS · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="The Lost Explorers full fight" status={`FISH ${view.cycle}/3 · ${activeLostExplorersPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className="train3d-viewport lost-explorers-viewport">
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnLostExplorersPlayer(stateRef.current, yaw); renderSnapshotRef.current = lostExplorersSnapshot(stateRef.current) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <ArenaTrainingHud settings={hudSettings} objective={activeLostExplorersPrompt(view)} timers={[timer]} status={`Fish order ${view.fedBosses.length}/3 · height ${view.vertical.height.toFixed(1)} yd`} bossLabel="Iku / Gebbo / Nama" bossHealth={Math.round((view.bosses.iku.health + view.bosses.gebbo.health + view.bosses.nama.health) / 3)} bossEnergy={view.energy} auraLabel={view.fishHeld ? 'Disgusting Fish ready' : view.elementDebuff ? `${view.elementDebuff} — cleanse opposite` : view.vertical.grounded ? 'Grounded' : `Airborne ${view.vertical.height.toFixed(1)} yd`} actionStatus={view.fishHeld ? 'Throw fish ready' : view.ikuCastStartedAt !== undefined && !view.ikuCastResolved ? 'Interrupt Iku' : 'Resolve movement mechanic'} enemyCast={view.ikuCastStartedAt !== undefined && !view.ikuCastResolved ? { label: 'Icebound Flames', seconds: Math.max(0, 4 - (view.time - view.ikuCastStartedAt)), duration: 4 } : undefined} actionButton={<EncounterActionButtons actions={actions} role={selected.role} mode="train3d" handlers={{ mainAbility, interrupt, taunt }} disabled={{ mainAbility: !view.fishHeld, interrupt: view.ikuCastStartedAt === undefined, taunt: selected.role !== 'tank' }} />} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel="Lost Explorers encounter setup" title="Choose role and council assignment" description="Your raid position locks role, interrupt availability, Frostfire mark, and Mighty Thud group." assignmentNotice="Fish order is Iku, Gebbo, Nama. Space controls the shared simulation-owned jump; Gebbo’s mushroom applies a stronger encounter launch." bossLabel="The Lost Explorers" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'All three explorers defeated together' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed all three Ultimates with synchronized boss health.' : view.failures[0]?.advice ?? 'Review the active Ultimate and retry.'} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)} · jump {keyLabel(keyBindings.jump)} · {encounterActionLegend(actions, selected.role, 'train3d')} · left orbit · right face · both buttons forward</p></div></section>
    <details className="contract-lab-drawer"><summary>Encounter evidence and configurable timing</summary><div><p><strong>Verified:</strong> one fish per explorer, Iku → Gebbo → Nama; sourced casts/radii; three Mighty Thud targets; opposite-element cleansing.</p><p><strong>Configurable pending live logs:</strong> Mor’zahi energy rate, crate count/cadence, Blast Wave speed, Aftershock lifetime, and Ultimate transition delays.</p></div></details>
  </main>
}
