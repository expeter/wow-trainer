import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractSelectedMember } from '../contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import EncounterActionButtons from '../EncounterActionButtons'
import RaidLeadTelegraph from '../learn2d/RaidLeadTelegraph'
import SnapshotActors from '../learn2d/SnapshotActors'
import SnapshotEffects from '../learn2d/SnapshotEffects'
import RuntimeFeedback from '../RuntimeFeedback'
import RuntimeOutcomeOverlay from '../RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../RuntimeStatusBar'
import { keyLabel, type CombatAction } from '../trainingSettings'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../train3d/types'
import { useRuntimePause } from '../useRuntimePause'
import { encounterActionLegend, useEncounterActionInput } from './actions'
import { createEvidenceEncounterState, evidenceEncounterSnapshot, evidenceStep, evidenceStepRemaining, prepareEvidenceEncounterSlot, resolveEvidenceEncounterAction, stepEvidenceEncounter, type EvidenceEncounterDefinition } from './evidenceFullFight'
import type { EncounterRuntimeProps } from './types'

export default function EvidenceLearn2DRuntime({ definition, runtime }: { definition: EvidenceEncounterDefinition; runtime: EncounterRuntimeProps }) {
  const { trainingDifficulty, keyBindings, actions, onExit } = runtime
  const stateRef = useRef(createEvidenceEncounterState(definition, 'player', trainingDifficulty, 'learn2d'))
  const sequenceSeedRef = useRef(0)
  const [view, setView] = useState(stateRef.current)
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const gate = useContractPullGate(); const pause = useRuntimePause(keyBindings.pause); const selected = contractSelectedMember(gate.selectedSlotId)
  const publish = () => setView(stateRef.current)
  const chooseSlot = (slotId: string) => { gate.setSelectedSlotId(slotId); stateRef.current = prepareEvidenceEncounterSlot(definition, stateRef.current, slotId); publish() }
  const retry = () => { pause.reset(); gate.restart(); sequenceSeedRef.current += 1; stateRef.current = createEvidenceEncounterState(definition, gate.selectedSlotId, trainingDifficulty, 'learn2d', sequenceSeedRef.current); publish() }
  const resolveAction = (action: CombatAction) => { stateRef.current = resolveEvidenceEncounterAction(definition, stateRef.current, action); publish() }
  const actionHandlers = { mainAbility: () => resolveAction('mainAbility'), interrupt: () => resolveAction('interrupt'), taunt: () => resolveAction('taunt'), dispel: () => resolveAction('dispel'), shield: () => resolveAction('shield'), healthPot: () => resolveAction('healthPot') }
  useEncounterActionInput({ actions, role: selected.role, mode: 'learn2d', enabled: gate.phase === 'active', paused: pause.paused, handlers: actionHandlers })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepEvidenceEncounter(definition, stateRef.current, commandsRef.current, seconds, 'learn2d')
      if (now - lastPublish >= 50) { lastPublish = now; publish() }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [definition, gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => update(event, true); const up = (event: KeyboardEvent) => update(event, false); const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = evidenceEncounterSnapshot(definition, view); const step = evidenceStep(definition, view)
  const xPercent = (value: number) => (value + definition.arena3d.width / 2) / definition.arena3d.width * 100
  const zPercent = (value: number) => (value + definition.arena3d.depth / 2) / definition.arena3d.depth * 100
  const setPad = (direction: keyof Pick<PlayerCommandState, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) => { commandsRef.current[direction] = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current }
  return <main className={`training-shell evidence-runtime ${definition.id}-runtime`}>
    <RuntimeStatusBar meta={`${definition.name.toUpperCase()} · FULL FIGHT · ${trainingDifficulty.toUpperCase()} · ${selected.role.toUpperCase()}`} title={`${definition.name} full fight`} status={`${definition.resource.label.toUpperCase()} ${view.resource}/${definition.resource.maximum} · ${step.label}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><RaidLeadTelegraph current={step.prompt} nextLabel={step.label} nextSeconds={evidenceStepRemaining(definition, view)} /><div className={`learn2d-board evidence-2d-board ${definition.boardClass}`} aria-label={`${definition.name} raid-plan training arena`} style={{ '--evidence-plan': definition.learn2dBackground ? `url(${definition.learn2dBackground})` : 'none' } as CSSProperties}>
      <SnapshotEffects effects={snapshot.effects} actors={snapshot.actors} width={definition.arena3d.width} depth={definition.arena3d.depth} />
      <SnapshotActors actors={snapshot.actors} xPercent={xPercent} zPercent={zPercent} time={view.time} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel={`${definition.name} encounter setup`} title="Choose role and full-fight assignment" description={`Practice the maintained ${definition.name} mechanic sequence with simulation-owned movement and collision.`} assignmentNotice={`${definition.steps.length} evidence-backed responsibilities run in one full-fight sequence.`} bossLabel={definition.name} />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? `${definition.name} sequence complete` : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'All controlled-player responsibilities resolved.' : view.failures[0]?.advice ?? step.advice} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)}{actions.length ? ` · ${encounterActionLegend(actions, selected.role, 'learn2d')}` : ''}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as const).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div><EncounterActionButtons actions={actions} role={selected.role} mode="learn2d" handlers={actionHandlers} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused, interrupt: gate.phase !== 'active' || pause.paused, taunt: gate.phase !== 'active' || pause.paused }} /></div></div></section>
  </main>
}
