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
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { useRuntimeInputClear } from '../../../platform/useRuntimeInputClear'
import { activeNekzaliPrompt, createNekzaliState, dispelNekzali, interruptNekzali, isNekzaliPlayerRendTarget, nekzaliRendRemaining, nekzaliSnapshot, nextNekzaliTimer, prepareNekzaliSlot, startNekzaliMainCast, stepNekzaliState, tauntNekzali, turnNekzaliPlayer } from '../simulation'

export default function NekzaliTrain3D({ trainingDifficulty, keyBindings, actions, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createNekzaliState('player', trainingDifficulty))
  const renderSnapshotRef = useRef(nekzaliSnapshot(stateRef.current))
  const [view, setView] = useState(stateRef.current)
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false })
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) {
    gate.setSelectedSlotId(slotId)
    stateRef.current = prepareNekzaliSlot(stateRef.current, slotId)
    renderSnapshotRef.current = nekzaliSnapshot(stateRef.current)
    setView(stateRef.current); setSnapshot(renderSnapshotRef.current)
  }

  function retry() {
    pause.reset(); gate.restart()
    stateRef.current = createNekzaliState(gate.selectedSlotId, trainingDifficulty)
    renderSnapshotRef.current = nekzaliSnapshot(stateRef.current)
    setView(stateRef.current); setSnapshot(renderSnapshotRef.current)
  }

  function mainAbility() { stateRef.current = startNekzaliMainCast(stateRef.current) }
  function taunt() { stateRef.current = tauntNekzali(stateRef.current) }
  function interrupt() { stateRef.current = interruptNekzali(stateRef.current) }
  function dispel() { stateRef.current = dispelNekzali(stateRef.current) }

  useEncounterActionInput({ actions, role: selected.role, mode: 'train3d', enabled: gate.phase === 'active', paused: pause.paused, handlers: {
    mainAbility, taunt, interrupt, dispel,
  } })

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublish = 0
    const tick = (now: number) => {
      accumulator += Math.min((now - previous) / 1000, .1); previous = now
      let stepped = false
      while (accumulator >= FIXED_STEP_SECONDS) {
        if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepNekzaliState(stateRef.current, commandsRef.current, FIXED_STEP_SECONDS)
        accumulator -= FIXED_STEP_SECONDS; stepped = true
      }
      if (stepped) renderSnapshotRef.current = nekzaliSnapshot(stateRef.current)
      if (now - lastPublish >= 100) { lastPublish = now; setView(stateRef.current); setSnapshot(renderSnapshotRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight'] as const
    const update = (event: KeyboardEvent, active: boolean) => {
      const action = movement.find(candidate => keyBindings[candidate] === event.code)
      if (!action) return
      event.preventDefault()
      if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) { commandsRef.current[action] = false; return }
      if (action === 'forward') { keyboardForwardRef.current = active; commandsRef.current.forward = active || mouseForwardRef.current } else commandsRef.current[action] = active
    }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const timer = nextNekzaliTimer(view)
  const ownsAggro = selected.role === 'tank' && view.aggroOwner === gate.selectedSlotId
  const phaseLabel = view.phase === 'phase-1' ? 'P1' : view.phase.startsWith('echo') ? 'INTERMISSION' : 'P2'
  const inRealm = view.realmStage === 'inside' || view.realmStage === 'returning'
  const outcomeAdvice = view.outcome === 'success' ? 'You defended the Soulcoil Well through the full encounter contract.' : view.failures[0]?.advice ?? 'Review the mechanic and try the assignment again.'
  return <main className="training-shell nekzali-runtime">
    <RuntimeStatusBar meta={`NEK'ZALI · FULL FIGHT · ${trainingDifficulty.toUpperCase()} · ${selected.role.toUpperCase()} · REALM GROUP ${view.wellGroup}`} title="Nek'zali the Soulcoiler" status={`${inRealm ? 'WELL REALM' : phaseLabel} · ${activeNekzaliPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className={`train3d-viewport nekzali-viewport${inRealm ? ' realm-active' : ''}`}>
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnNekzaliPlayer(stateRef.current, yaw); renderSnapshotRef.current = nekzaliSnapshot(stateRef.current) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <ArenaTrainingHud settings={hudSettings} compactMechanic objective={activeNekzaliPrompt(view)} timers={view.rendStartedAt === undefined ? [timer] : []} bossLabel={inRealm ? 'Drowned Echo' : "Nek'zali"} bossHealth={inRealm ? Math.max(0, 100 - view.realmAddHits * 5) : view.bossHealth} bossThreat={inRealm ? undefined : ownsAggro ? 'owned' : 'hostile'} auraLabel={isNekzaliPlayerRendTarget(view) ? `Essence Rend ${nekzaliRendRemaining(view).toFixed(1)}s` : inRealm ? view.soulExhausted ? 'Soul Exhaustion' : 'Grasping Depths' : view.phase.startsWith('echo') ? view.cleanupDuty ? 'Cremation cleanup' : 'Pyre soak' : view.phase === 'phase-2' ? `Ritual energy ${view.bossEnergy}%` : 'No active aura'} actionStatus={view.innerCastStartedAt !== undefined && !view.innerCastInterrupted ? 'Interrupt assigned cast' : view.mainCastRemaining > 0 ? 'Main ability casting' : inRealm ? 'Main ability ready · watch disruption' : view.phase.startsWith('echo') ? 'Resolve the assigned Pyre or Cremation' : selected.role === 'tank' ? ownsAggro ? 'You have aggro' : 'Taunt available' : 'Main ability ready'} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} enemyCast={view.innerCastStartedAt !== undefined && !view.innerCastInterrupted ? { label: 'Drowned Echo · Soulcoil', seconds: Math.max(0, 10 - (view.time - view.innerCastStartedAt)), duration: 10 } : undefined} actionButton={<EncounterActionButtons actions={actions} role={selected.role} mode="train3d" handlers={{ mainAbility, interrupt, taunt, dispel }} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused || view.mainCastRemaining > 0, interrupt: gate.phase !== 'active' || pause.paused || view.innerCastStartedAt === undefined || view.innerCastInterrupted, taunt: gate.phase !== 'active' || pause.paused, dispel: gate.phase !== 'active' || pause.paused || view.rendStartedAt === undefined || view.rendTargetId === view.selectedSlotId }} />} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel="Nek'zali encounter setup" title="Choose role and assignment" description="Your raid position locks your role, class, intermission duty, and Realm Group for this pull." assignmentNotice={`REALM GROUP ${view.wellGroup}: ${view.wellGroup === 1 ? 'enter during Phase 1.' : 'stay outside in Phase 1 and enter during Phase 2.'} ${view.cleanupDuty ? 'Cremation cleanup: stay out of Pyre and burn remains.' : 'Pyre soak: join the main raid soak.'}`} bossLabel="Nek'zali" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? "Nek'zali defeated" : view.outcomeReason ?? 'The raid wiped'} advice={outcomeAdvice} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actions, selected.role, 'train3d')} · left orbit · right face · both buttons forward</p></div></section>
    <details className="contract-lab-drawer"><summary>Encounter evidence and provisional timing</summary><div><p><strong>Mechanics:</strong> one complete supplied encounter contract. <strong>Trainer:</strong> {trainingDifficulty}.</p><p>Phase 1 is paced to 50% at 90s. Essence Rend leaves movement under the target's control; removing it at the edge creates one persistent Latent Cultist there.</p><p>Grasping Depths alternates raid halves. The assigned player has seven seconds to enter the Well, contributes 20 Main hits, owns one ten-second interrupt, avoids orbiting/outward spirits, and returns after five seconds. The outer raid continues its assigned mechanics.</p></div></details>
  </main>
}
