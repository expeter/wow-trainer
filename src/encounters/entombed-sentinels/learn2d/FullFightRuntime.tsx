import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import EncounterActionButtons from '../../../platform/EncounterActionButtons'
import { encounterActionLegend, useEncounterActionInput, type EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import SnapshotEffects from '../../../platform/learn2d/SnapshotEffects'
import SnapshotActors, { SnapshotActorAuras } from '../../../platform/learn2d/SnapshotActors'
import { ActorMainCastBar } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { useRuntimeInputClear } from '../../../platform/useRuntimeInputClear'
import { activeSentinelsPrompt, createSentinelsState, dispelSentinels, nextSentinelsTimer, prepareSentinelsSlot, sentinelsPlayerRole, sentinelsSnapshot, startSentinelsMainCast, stepSentinelsDiagramState } from '../simulation'
import { sentinelsArena } from '../train3d/arenas'

const RAID_PLAN = new URL('../../../../inbox/INBOX-20260815-131711-f9dac6.png', import.meta.url).href
const xPercent = (value: number) => 50 + value / sentinelsArena.width * 100
const zPercent = (value: number) => 50 + value / sentinelsArena.depth * 100

export default function SentinelsFullFight2D({ trainingDifficulty, keyBindings, actions, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createSentinelsState('player', trainingDifficulty, 'learn2d'))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } })
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareSentinelsSlot(stateRef.current, slotId); setView(stateRef.current) }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createSentinelsState(gate.selectedSlotId, trainingDifficulty, 'learn2d'); setView(stateRef.current) }
  function dispel() { stateRef.current = dispelSentinels(stateRef.current); setView(stateRef.current) }
  useEncounterActionInput({ actions, role: selected.role, mode: 'learn2d', enabled: gate.phase === 'active', paused: pause.paused, handlers: {
    mainAbility: () => { stateRef.current = startSentinelsMainCast(stateRef.current) },
    dispel,
  } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepSentinelsDiagramState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${xPercent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${zPercent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
      if (now - lastPublish >= 33) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = sentinelsSnapshot(view)
  const playerActor = snapshot.actors.find(actor => actor.kind === 'player')!
  const timer = nextSentinelsTimer(view)
  const setPad = (direction: keyof Pick<PlayerCommandState, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) => { commandsRef.current[direction] = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current }
  return <main className="training-shell sentinels-runtime">
    <RuntimeStatusBar meta={`ENTOMBED SENTINELS · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${sentinelsPlayerRole(view).toUpperCase()}`} title="Entombed Sentinels full fight" status={`CYCLE ${view.cycle} · ${view.phase.toUpperCase()} · ${activeSentinelsPrompt(view)} · ${timer.label} ${Math.max(0, timer.seconds).toFixed(timer.seconds < 5 ? 1 : 0)}s`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><div className="learn2d-board sentinels-2d-board" aria-label="Entombed Sentinels raid-plan training arena" style={{ '--sentinels-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <SnapshotEffects effects={snapshot.effects} actors={snapshot.actors} width={sentinelsArena.width} depth={sentinelsArena.depth} />
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.kind === 'enemy').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind} sentinel-${actor.id.startsWith('breath') ? 'acid' : 'blood'}`} style={{ left: `${xPercent(actor.position.x)}%`, top: `${zPercent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id}><span>{actor.id.startsWith('breath') ? 'G' : actor.id.startsWith('blood') ? 'R' : 'A'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i>{actor.kind === 'boss' && <i className="sentinel-energy"><b style={{ width: `${view.energy}%` }} /></i>}</div>)}
      <SnapshotActors actors={snapshot.actors} xPercent={xPercent} zPercent={zPercent} time={view.time} />
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} data-player-class={selected.playerClass} style={{ left: `${xPercent(view.player.x)}%`, top: `${zPercent(view.player.z)}%`, '--player-class-color': playerActor.color } as CSSProperties} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.z.toFixed(2)} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}><SnapshotActorAuras actor={playerActor} time={view.time} /><span className="character-body" /><i className="actor-health"><b style={{ width: '100%' }} /></i><ActorMainCastBar enabled={hudSettings.showActions} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} /></div>
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Entombed Sentinels encounter setup" title="Choose role for the full fight" description="Your raid position locks role, starting side, and side-specific responsibility. The raid swaps sides after Stasis." assignmentNotice={`Cycle one: ${view.assignedSide === 'acid' ? 'green side — priority add, droplet, and return lane.' : `red side — droplet, return lane, group soak${selected.role === 'healer' ? ', and Blighted Blood dispel.' : ', and delayed pool.'}`} Protovenom pairing occurs before Stasis.`} bossLabel="Two Sentinels" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'Both Sentinels defeated' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed the full-fight contract.' : view.failures[0]?.advice ?? 'Review your assignment and retry.'} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actions, selected.role, 'learn2d')}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as const).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div><EncounterActionButtons actions={actions} role={selected.role} mode="learn2d" handlers={{ dispel }} disabled={{ dispel: gate.phase !== 'active' || pause.paused || !view.blightedActive || view.blightedResolved }} /></div></div></section>
  </main>
}
