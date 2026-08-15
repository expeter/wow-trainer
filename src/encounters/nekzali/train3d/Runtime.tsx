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
import { activeNekzaliPrompt, createNekzaliState, interruptNekzali, nekzaliSnapshot, nextNekzaliTimer, prepareNekzaliSlot, startNekzaliMainCast, stepNekzaliState, tauntNekzali, turnNekzaliPlayer } from '../simulation'

export default function NekzaliTrain3D({ scenarioId, trainingDifficulty, keyBindings, hudSettings, cameraSettings, onCameraSettingsChange, onExit }: EncounterRuntimeProps) {
  const mythic = scenarioId === 'nekzali_mythic_full_fight'
  const stateRef = useRef(createNekzaliState('player', trainingDifficulty, mythic))
  const renderSnapshotRef = useRef(nekzaliSnapshot(stateRef.current))
  const [view, setView] = useState(stateRef.current)
  const [snapshot, setSnapshot] = useState(renderSnapshotRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const keyboardForwardRef = useRef(false)
  const mouseForwardRef = useRef(false)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) {
    gate.setSelectedSlotId(slotId)
    stateRef.current = prepareNekzaliSlot(stateRef.current, slotId)
    renderSnapshotRef.current = nekzaliSnapshot(stateRef.current)
    setView(stateRef.current); setSnapshot(renderSnapshotRef.current)
  }

  function retry() {
    stateRef.current = createNekzaliState(gate.selectedSlotId, trainingDifficulty, mythic)
    renderSnapshotRef.current = nekzaliSnapshot(stateRef.current)
    setView(stateRef.current); setSnapshot(renderSnapshotRef.current)
  }

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
    const down = (event: KeyboardEvent) => {
      if (!event.repeat && gate.phaseRef.current === 'active' && !pause.pausedRef.current) {
        if (event.code === keyBindings.mainAbility) { event.preventDefault(); stateRef.current = startNekzaliMainCast(stateRef.current) }
        if (event.code === keyBindings.taunt) { event.preventDefault(); stateRef.current = tauntNekzali(stateRef.current) }
        if (event.code === keyBindings.interrupt) { event.preventDefault(); stateRef.current = interruptNekzali(stateRef.current) }
      }
      update(event, true)
    }
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS }; keyboardForwardRef.current = false; mouseForwardRef.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const timer = nextNekzaliTimer(view)
  const ownsAggro = selected.role === 'tank' && view.aggroOwner === gate.selectedSlotId
  const phaseLabel = view.phase === 'phase-1' ? 'P1' : view.phase.startsWith('echo') ? 'INTERMISSION' : 'P2'
  const inRealm = view.realmStage !== 'none'
  const rulesLabel = mythic ? 'MYTHIC' : 'HEROIC'
  const outcomeAdvice = view.outcome === 'success' ? `You defended the Soulcoil Well through the ${mythic ? 'Mythic' : 'Heroic'} trainer profile.` : view.failures[0]?.advice ?? 'Review the mechanic and try the assignment again.'
  return <main className="training-shell nekzali-runtime">
    <RuntimeStatusBar meta={`NEK'ZALI · ${rulesLabel} RULES · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="Nek'zali the Soulcoiler" status={`${inRealm ? 'WELL REALM' : phaseLabel} · ${activeNekzaliPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="train3d-stage"><div className={`train3d-viewport nekzali-viewport${inRealm ? ' realm-active' : ''}`}>
      <ThreeWorldRenderer snapshot={snapshot} snapshotSource={() => renderSnapshotRef.current} cameraSettings={cameraSettings} onCameraSettingsChange={onCameraSettingsChange} onPlayerLook={yaw => { stateRef.current = turnNekzaliPlayer(stateRef.current, yaw) }} onBothButtonsForward={active => { mouseForwardRef.current = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current; commandsRef.current.forward = mouseForwardRef.current || keyboardForwardRef.current }} />
      <ArenaTrainingHud settings={hudSettings} objective={activeNekzaliPrompt(view)} timers={[timer]} status={inRealm ? `Well half ${view.wellGroup} · ${view.realmAddHits}/20 Main hits` : `${phaseLabel} · ${view.playerAddKills}/3 assigned adds · ${view.soakGroup === 1 ? 'First' : 'Second'} soak group`} bossLabel={inRealm ? 'Drowned Echo' : "Nek'zali"} bossHealth={inRealm ? Math.max(0, 100 - view.realmAddHits * 5) : view.bossHealth} bossThreat={inRealm ? undefined : ownsAggro ? 'owned' : 'hostile'} auraLabel={inRealm ? view.soulExhausted ? 'Soul Exhaustion' : 'Grasping Depths' : view.phase.startsWith('echo') ? `Soak group ${view.soakGroup}` : view.phase === 'phase-2' ? `Ritual energy ${view.bossEnergy}%` : `${rulesLabel[0]}${rulesLabel.slice(1).toLowerCase()} baseline`} actionStatus={view.innerCastStartedAt !== undefined && !view.innerCastInterrupted ? 'Interrupt assigned cast' : view.mainCastRemaining > 0 ? 'Main ability casting' : inRealm ? 'Main ability ready · watch disruption' : selected.role === 'tank' ? ownsAggro ? 'You have aggro' : 'Taunt available' : 'Main ability ready'} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} actionButton={<><button type="button" onClick={() => { stateRef.current = startNekzaliMainCast(stateRef.current) }} disabled={gate.phase !== 'active' || view.mainCastRemaining > 0}>Main ability <kbd>{keyLabel(keyBindings.mainAbility)}</kbd></button>{mythic && <button type="button" onClick={() => { stateRef.current = interruptNekzali(stateRef.current) }} disabled={view.realmStage !== 'inside' || view.innerCastStartedAt === undefined || view.innerCastInterrupted}>Interrupt <kbd>{keyLabel(keyBindings.interrupt)}</kbd></button>}{selected.role === 'tank' && !inRealm && <button type="button" onClick={() => { stateRef.current = tauntNekzali(stateRef.current) }}>Taunt <kbd>{keyLabel(keyBindings.taunt)}</kbd></button>}</>} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Train 3D" dialogLabel="Nek'zali encounter setup" title={`Choose role and ${mythic ? 'Mythic' : 'Heroic'} assignment`} description="Your raid position locks your role, class, and alternating intermission duty for this pull." assignmentNotice={`You are in soak group ${view.soakGroup}: ${view.soakGroup === 1 ? 'soak the first Echo, spread for the second.' : 'spread for the first Echo, soak the second.'}${mythic ? ` Well half ${view.wellGroup}: ${view.wellGroup === 1 ? 'enter during Phase 1.' : 'stay out in Phase 1 and enter during Phase 2.'}` : ''}`} bossLabel="Nek'zali" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? "Nek'zali defeated" : view.outcomeReason ?? 'The raid wiped'} advice={outcomeAdvice} onRetry={retry} onExit={onExit} />}
    </div><p className="train3d-controls">Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Main {keyLabel(keyBindings.mainAbility)}{mythic ? ` · Interrupt ${keyLabel(keyBindings.interrupt)}` : ''}{selected.role === 'tank' ? ` · Taunt / Spott ${keyLabel(keyBindings.taunt)}` : ''} · left orbit · right face · both buttons forward</p></div></section>
    <details className="contract-lab-drawer"><summary>Encounter evidence and provisional timing</summary><div><p><strong>Raid rules:</strong> {mythic ? 'Mythic' : 'Heroic'}. <strong>Trainer:</strong> {trainingDifficulty}.</p><p>Phase 1 is paced to 50% at 90s. The 15 one-second Rend trail drops are a provisional training model; the final Latent Cultist is journal-backed.</p><p>{mythic ? 'Grasping Depths alternates raid halves. The player contributes 20 Main hits, owns one five-second interrupt, avoids orbiting/outward spirits, and returns after five seconds. The readable three-second disruption cancels an active Main cast but cannot wipe.' : 'Mythic Grasping Depths is declared separately and is not active here.'}</p></div></details>
  </main>
}
