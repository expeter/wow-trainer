import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import EncounterActionButtons from '../../../platform/EncounterActionButtons'
import { encounterActionLegend, useEncounterActionInput, type EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import RaidLeadTelegraph from '../../../platform/learn2d/RaidLeadTelegraph'
import SnapshotActors, { SnapshotActorAuras } from '../../../platform/learn2d/SnapshotActors'
import SnapshotEffects from '../../../platform/learn2d/SnapshotEffects'
import { ActorMainCastBar } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimeInputClear } from '../../../platform/useRuntimeInputClear'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import VashnikEffectLegend from '../EffectLegend'
import { activeVashnikPrompt, createVashnikState, nextVashnikTimer, prepareVashnikSlot, startVashnikMainCast, stepVashnikDiagramState, tauntVashnik, vashnikSnapshot } from '../simulation'

const RAID_PLAN = new URL('../../../../inbox/INBOX-20260815-133633-4706bd.png', import.meta.url).href
const percent = (value: number) => 50 + value / 96 * 100

export default function VashnikLearn2D({ trainingDifficulty, keyBindings, actions, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createVashnikState('player', trainingDifficulty, 'learn2d'))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } })
  const selected = contractSelectedMember(gate.selectedSlotId)

  function publish() { setView(stateRef.current) }
  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareVashnikSlot(stateRef.current, slotId); publish() }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createVashnikState(gate.selectedSlotId, trainingDifficulty, 'learn2d'); publish() }
  function mainAbility() { stateRef.current = startVashnikMainCast(stateRef.current) }
  function taunt() { stateRef.current = tauntVashnik(stateRef.current); publish() }
  useEncounterActionInput({ actions, role: selected.role, mode: 'learn2d', enabled: gate.phase === 'active', paused: pause.paused, handlers: { mainAbility, taunt } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepVashnikDiagramState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${percent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${percent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
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

  const snapshot = vashnikSnapshot(view)
  const playerActor = snapshot.actors.find(actor => actor.kind === 'player')!
  const timer = nextVashnikTimer(view)
  const setPad = (direction: keyof Pick<PlayerCommandState, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) => { commandsRef.current[direction] = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current }
  return <main className="training-shell vashnik-runtime">
    <RuntimeStatusBar meta={`VASHNIK · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="Vashnik the Malignant full fight" status={`CYCLE ${view.cycle}/3 · ${activeVashnikPrompt(view)} · ${timer.label} ${Math.max(0, timer.seconds).toFixed(timer.seconds < 5 ? 1 : 0)}s`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><RaidLeadTelegraph current={activeVashnikPrompt(view)} nextLabel={timer.label} nextSeconds={timer.seconds} /><VashnikEffectLegend state={view} /><div className="learn2d-board vashnik-2d-board" aria-label="Vashnik three-fountain raid-plan training arena" style={{ '--vashnik-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <SnapshotEffects effects={snapshot.effects} actors={snapshot.actors} width={96} depth={96} />
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.kind === 'enemy').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind} vashnik-${actor.id}`} style={{ left: `${percent(actor.position.x)}%`, top: `${percent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id}><span>{actor.kind === 'boss' ? 'V' : actor.id.startsWith('blood') ? 'B' : actor.id.startsWith('flame') ? 'F' : 'S'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i></div>)}
      <SnapshotActors actors={snapshot.actors} xPercent={percent} zPercent={percent} time={view.time} />
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} data-player-class={selected.playerClass} style={{ left: `${percent(view.player.x)}%`, top: `${percent(view.player.z)}%`, '--player-class-color': playerActor.color } as CSSProperties} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.z.toFixed(2)} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}><SnapshotActorAuras actor={playerActor} time={view.time} /><span className="character-body" /><i className="actor-health"><b style={{ width: '100%' }} /></i><ActorMainCastBar enabled={hudSettings.showActions} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} /></div>
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Vashnik encounter setup" title="Choose role and fountain assignment" description="Your raid position locks role, Blood support camp, and player-owned mechanics for this pull." assignmentNotice={`Cycle order: Flame + Shadow, Shadow + Blood, Blood + Flame. ${selected.role === 'tank' ? 'Swap after Dripping Fangs without losing the intended pair.' : 'Resolve your infection, Bile, and Tumor line while reliable NPCs cover the rest.'}`} bossLabel="Vashnik" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'Vashnik defeated' : view.outcomeReason ?? 'The raid wiped'} reasonCode={view.outcome === 'success' ? 'completed' : view.failures[0]?.code} advice={view.outcome === 'success' ? 'You completed all three fountain packages.' : view.failures[0]?.advice ?? 'Review the active fountain mapping and retry.'} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actions, selected.role, 'learn2d')}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as const).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div><EncounterActionButtons actions={actions} role={selected.role} mode="learn2d" handlers={{ mainAbility, taunt }} disabled={{ mainAbility: gate.phase !== 'active' || pause.paused || view.mainCastRemaining > 0, taunt: gate.phase !== 'active' || pause.paused || selected.role !== 'tank' }} /></div></div></section>
  </main>
}
