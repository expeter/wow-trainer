import { useEffect, useRef, useState, type CSSProperties } from 'react'
import RAID_PLAN from '../../../../inbox/INBOX-20260815-135414-bba2f7.png'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import EncounterActionButtons from '../../../platform/EncounterActionButtons'
import { encounterActionLegend, useEncounterActionInput, type EncounterRuntimeProps } from '../../../platform/encounters'
import RaidLeadTelegraph from '../../../platform/learn2d/RaidLeadTelegraph'
import SnapshotActors, { SnapshotActorAuras } from '../../../platform/learn2d/SnapshotActors'
import SnapshotEffects from '../../../platform/learn2d/SnapshotEffects'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import { ActorMainCastBar } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { activeLostExplorersPrompt, createLostExplorersState, interruptLostExplorersIku, lostExplorersSnapshot, nextLostExplorersTimer, prepareLostExplorersSlot, stepLostExplorersDiagramState, tauntLostExplorers, throwLostExplorersFish } from '../simulation'

const percent = (value: number) => (value + 48) / 96 * 100

export default function LostExplorersLearn2D({ trainingDifficulty, keyBindings, actions, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createLostExplorersState('player', trainingDifficulty, 'learn2d'))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const selected = contractSelectedMember(gate.selectedSlotId)
  function publish() { setView(stateRef.current) }
  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareLostExplorersSlot(stateRef.current, slotId); publish() }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createLostExplorersState(gate.selectedSlotId, trainingDifficulty, 'learn2d'); publish() }
  function mainAbility() { stateRef.current = throwLostExplorersFish(stateRef.current); publish() }
  function interrupt() { stateRef.current = interruptLostExplorersIku(stateRef.current); publish() }
  function taunt() { stateRef.current = tauntLostExplorers(stateRef.current); publish() }
  useEncounterActionInput({ actions, role: selected.role, mode: 'learn2d', enabled: gate.phase === 'active', paused: pause.paused, handlers: { mainAbility, interrupt, taunt } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepLostExplorersDiagramState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${percent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${percent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
      if (now - lastPublish >= 50) { lastPublish = now; publish() }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => update(event, true); const up = (event: KeyboardEvent) => update(event, false); const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = lostExplorersSnapshot(view)
  const playerActor = snapshot.actors.find(actor => actor.kind === 'player')!
  const timer = nextLostExplorersTimer(view)
  const setPad = (direction: keyof Pick<PlayerCommandState, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) => { commandsRef.current[direction] = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current }
  return <main className="training-shell lost-explorers-runtime">
    <RuntimeStatusBar meta={`LOST EXPLORERS · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="The Lost Explorers full fight" status={`FISH ${view.cycle}/3 · ${activeLostExplorersPrompt(view)} · ${timer.label} ${Math.max(0, timer.seconds).toFixed(1)}s`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><RaidLeadTelegraph current={activeLostExplorersPrompt(view)} nextLabel={timer.label} nextSeconds={timer.seconds} /><div className="learn2d-board lost-explorers-2d-board" aria-label="Lost Explorers octagonal raid-plan training arena" style={{ '--lost-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <SnapshotEffects effects={snapshot.effects} actors={snapshot.actors} width={96} depth={96} />
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.id === 'lost-morzahi').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind} ${actor.id}`} style={{ left: `${percent(actor.position.x)}%`, top: `${percent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id}><span>{actor.id === 'lost-iku' ? 'I' : actor.id === 'lost-gebbo' ? 'G' : actor.id === 'lost-nama' ? 'N' : 'M'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i></div>)}
      <SnapshotActors actors={snapshot.actors} xPercent={percent} zPercent={percent} time={view.time} />
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} data-player-class={selected.playerClass} style={{ left: `${percent(view.player.x)}%`, top: `${percent(view.player.z)}%`, '--player-class-color': playerActor.color } as CSSProperties} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}><SnapshotActorAuras actor={playerActor} time={view.time} /><span className="character-body" /><i className="actor-health"><b style={{ width: '100%' }} /></i><ActorMainCastBar enabled={hudSettings.showActions} castSeconds={0} /></div>
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Lost Explorers encounter setup" title="Choose role and council assignment" description="Your raid position locks role, interrupt availability, Frostfire mark, and Mighty Thud group." assignmentNotice="Fish order is Iku, Gebbo, Nama. Open one crate, throw one fish, then resolve that explorer’s Ultimate." bossLabel="The Lost Explorers" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'All three explorers defeated together' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed Iku, Gebbo, and Nama in the planned fish order.' : view.failures[0]?.advice ?? 'Review the active Ultimate and retry.'} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actions, selected.role, 'learn2d')}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as const).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div><EncounterActionButtons actions={actions} role={selected.role} mode="learn2d" handlers={{ mainAbility, interrupt, taunt }} disabled={{ mainAbility: gate.phase !== 'active' || !view.fishHeld, interrupt: gate.phase !== 'active' || view.ikuCastStartedAt === undefined, taunt: selected.role !== 'tank' }} /></div></div></section>
  </main>
}
