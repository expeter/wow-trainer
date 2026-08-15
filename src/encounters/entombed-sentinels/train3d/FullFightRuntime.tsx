import { useEffect, useRef, useState } from 'react'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import { ArenaTrainingHud } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import ThreeWorldRenderer from '../../../platform/train3d/ThreeWorldRenderer'
import { FIXED_STEP_SECONDS } from '../../../platform/train3d/simulation'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { activeSentinelsPrompt, createSentinelsState, dispelSentinels, nextSentinelsTimer, prepareSentinelsSlot, sentinelsPlayerRole, sentinelsSnapshot, stepSentinelsState, turnSentinelsPlayer } from '../simulation'

export default function SentinelsFullFight3D({ scenarioId, trainingDifficulty, keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const mythic = scenarioId === 'sentinels_mythic_full_fight'
  const stateRef = useRef(createSentinelsState('player', trainingDifficulty, mythic))
  const renderSnapshotRef = useRef(sentinelsSnapshot(stateRef.current))
  const [view, setView] = useState(stateRef.current)
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const selected = contractSelectedMember(gate.selectedSlotId)

  function publish() { renderSnapshotRef.current = sentinelsSnapshot(stateRef.current); setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareSentinelsSlot(stateRef.current, slotId); publish() }
  function retry() { stateRef.current = createSentinelsState(gate.selectedSlotId, trainingDifficulty, mythic); publish() }
  function dispel() { stateRef.current = dispelSentinels(stateRef.current); publish() }

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let accumulator = 0; let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1); previous = now; let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) { if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepSentinelsState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS); accumulator -= FIXED_STEP_SECONDS; stepped = true }
      if (stepped) renderSnapshotRef.current = sentinelsSnapshot(stateRef.current)
      if (now - lastPublish >= 100) { lastPublish = now; setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) { commandsRef.current[action] = false; return } if (action === 'forward') { keyboardForwardRef.current = active; commandsRef.current.forward = active || mouseForwardRef.current } else commandsRef.current[action] = active }
    const down = (event: KeyboardEvent) => { if (!event.repeat && event.code === keyBindings.dispel) { event.preventDefault(); dispel() } update(event, true) }
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const timer = nextSentinelsTimer(view)
  const marks = view.phase === 'stasis' ? 'Helical: 1 green · 3 red' : `Acid ${view.acidMarks} · Blood ${view.bloodMarks}${view.protovenomActive ? ' · Protovenom marked' : ''}`
  return <main className="training-shell sentinels-runtime">
    <RuntimeStatusBar meta={`ENTOMBED SENTINELS · ${mythic ? 'MYTHIC' : 'HEROIC'} RULES · ${trainingDifficulty.toUpperCase()} TRAINER · ${sentinelsPlayerRole(view).toUpperCase()}`} title="Entombed Sentinels full fight" status={`CYCLE ${view.cycle} · ${view.phase.toUpperCase()} · ${activeSentinelsPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className="train3d-viewport sentinels-viewport">
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnSentinelsPlayer(stateRef.current, yaw) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <ArenaTrainingHud settings={hudSettings} objective={activeSentinelsPrompt(view)} timers={[timer]} status={`Cycle ${view.cycle} · ${view.assignedSide} side · boss distance ${Math.round(Math.hypot(view.acidBoss.x - view.bloodBoss.x, view.acidBoss.z - view.bloodBoss.z))} yd`} bossLabel="Breath of Ula'tek" bossHealth={view.acidHealth} bossEnergy={view.energy} secondaryBoss={{ label: "Blood of Ula'tek", health: view.bloodHealth, energy: view.energy }} auraLabel={marks} actionStatus={view.blightedActive && !view.blightedResolved && selected.role === 'healer' ? 'Dispel ready' : selected.role === 'tank' ? 'Lead your boss' : 'Read your side assignment'} actionButton={selected.role === 'healer' ? <button type="button" onClick={dispel} disabled={!view.blightedActive || view.blightedResolved}>Dispel <kbd>{keyLabel(keyBindings.dispel)}</kbd></button> : undefined} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel="Entombed Sentinels encounter setup" title={`Choose role for the ${mythic ? 'Mythic' : 'Heroic'} full fight`} description="Your raid position locks role, starting side, and side-specific responsibility. The raid swaps sides after Stasis." assignmentNotice={`Cycle one: ${view.assignedSide === 'acid' ? 'green side — droplets and return beams.' : `red side — group soak${selected.role === 'healer' ? ' and Blighted Blood dispel.' : ' and delayed pool.'}`}`} bossLabel="Two Sentinels" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'Both Sentinels defeated' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? `You completed the ${mythic ? 'Mythic' : 'Heroic'} full-fight contract.` : view.failures[0]?.advice ?? 'Review your assignment and retry.'} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · turn {keyLabel(keyBindings.turnLeft)} {keyLabel(keyBindings.turnRight)}{selected.role === 'healer' ? ` · Dispel ${keyLabel(keyBindings.dispel)}` : ''} · left orbit · right face · both buttons forward</p></div></section>
    <details className="contract-lab-drawer"><summary>Encounter evidence and provisional timing</summary><div><p><strong>Raid rules:</strong> {mythic ? 'Mythic' : 'Heroic'}. <strong>Trainer:</strong> {trainingDifficulty}.</p><p>Dominance resolves at the journal-backed 40-yard threshold. The bosses begin approximately 100 yards apart in this trainer room.</p><p>Energy and mechanic cadence remain PTR-labelled; Mythic Protovenom is active only in the Mythic scenario.</p></div></details>
  </main>
}
