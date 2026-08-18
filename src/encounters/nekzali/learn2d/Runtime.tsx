import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import { encounterActionLegend, useEncounterActionInput, type EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import RaidLeadTelegraph from '../../../platform/learn2d/RaidLeadTelegraph'
import SnapshotEffects from '../../../platform/learn2d/SnapshotEffects'
import SnapshotActors, { SnapshotActorAuras } from '../../../platform/learn2d/SnapshotActors'
import { ActorMainCastBar, EncounterCastBars } from '../../../platform/TrainingHud'
import { keyLabel } from '../../../platform/trainingSettings'
import type { PlayerCommandState } from '../../../platform/train3d/types'
import { IDLE_PLAYER_COMMANDS } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { useRuntimeInputClear } from '../../../platform/useRuntimeInputClear'
import { activeNekzaliPrompt, createNekzaliState, dispelNekzali, interruptNekzali, nekzaliSnapshot, nextNekzaliTimer, prepareNekzaliSlot, startNekzaliMainCast, stepNekzaliDiagramState, tauntNekzali } from '../simulation'

const RAID_PLAN = new URL('../../../../inbox/INBOX-20260815-124454-f3a9e1.png', import.meta.url).href
const percent = (value: number) => 50 + value / 90 * 100

export default function NekzaliLearn2D({ trainingDifficulty, keyBindings, actions, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createNekzaliState('player', trainingDifficulty, 'learn2d'))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } })
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareNekzaliSlot(stateRef.current, slotId); setView(stateRef.current) }
  function retry() { pause.reset(); gate.restart(); stateRef.current = createNekzaliState(gate.selectedSlotId, trainingDifficulty, 'learn2d'); setView(stateRef.current) }
  useEncounterActionInput({ actions, role: selected.role, mode: 'learn2d', enabled: gate.phase === 'active', paused: pause.paused, handlers: {
    mainAbility: () => { stateRef.current = startNekzaliMainCast(stateRef.current) },
    taunt: () => { stateRef.current = tauntNekzali(stateRef.current) },
    interrupt: () => { stateRef.current = interruptNekzali(stateRef.current) },
    dispel: () => { stateRef.current = dispelNekzali(stateRef.current) },
  } })

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepNekzaliDiagramState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${percent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${percent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
      if (now - lastPublish >= 33) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const actions = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = actions.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = nekzaliSnapshot(view)
  const playerActor = snapshot.actors.find(actor => actor.kind === 'player')!
  const timer = nextNekzaliTimer(view)
  const phaseLabel = view.phase === 'phase-1' ? 'P1' : view.phase.startsWith('echo') ? 'INTERMISSION' : 'P2'
  const ownsAggro = selected.role === 'tank' && view.aggroOwner === gate.selectedSlotId
  const inRealm = view.realmStage === 'inside' || view.realmStage === 'returning'
  return <main className="training-shell nekzali-runtime">
    <RuntimeStatusBar meta={`NEK'ZALI · FULL FIGHT · ${trainingDifficulty.toUpperCase()} · ${selected.role.toUpperCase()} · REALM GROUP ${view.wellGroup}`} title="Nek'zali tactical full fight" status={`${inRealm ? 'WELL REALM' : phaseLabel} · ${activeNekzaliPrompt(view)} · ${timer.label} ${Math.max(0, Math.ceil(timer.seconds))}s`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><RaidLeadTelegraph current={activeNekzaliPrompt(view)} nextLabel={timer.label} nextSeconds={timer.seconds} /><div className={`learn2d-board nekzali-2d-board${inRealm ? ' realm-active' : ''}`} aria-label="Nek'zali raid-plan training arena" style={{ '--nekzali-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <SnapshotEffects effects={snapshot.effects} actors={snapshot.actors} width={90} depth={90} />
      {view.corpses.filter(corpse => !corpse.cremated).map(corpse => <div key={corpse.id} className="nekzali-2d-corpse" aria-label="Amani remains" style={{ left: `${percent(corpse.position.x)}%`, top: `${percent(corpse.position.z)}%` }}>☠</div>)}
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.kind === 'enemy').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind}${actor.id === 'nekzali-boss' ? actor.auras.some(aura => aura.id === 'unavailable') ? ' unavailable' : ownsAggro ? ' owned' : ' hostile' : ''}`} style={{ left: `${percent(actor.position.x)}%`, top: `${percent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id === 'nekzali-boss' ? `Nek'zali · ${actor.auras.some(aura => aura.id === 'unavailable') ? 'unavailable' : ownsAggro ? 'your aggro' : 'no aggro'}` : actor.id}><span>{actor.id === 'nekzali-boss' ? 'N' : actor.id.startsWith('echo') ? 'E' : 'A'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i></div>)}
      <SnapshotActors actors={snapshot.actors} xPercent={percent} zPercent={percent} time={view.time} />
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} data-player-class={selected.playerClass} style={{ left: `${percent(view.player.x)}%`, top: `${percent(view.player.z)}%`, '--player-class-color': playerActor.color } as CSSProperties} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.z.toFixed(2)} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}><span className="character-body" /><SnapshotActorAuras actor={playerActor} time={view.time} /><i className="actor-health"><b style={{ width: '100%' }} /></i><ActorMainCastBar enabled={hudSettings.showActions} castSeconds={view.mainCastRemaining} castSecondsSource={() => stateRef.current.mainCastRemaining} /></div>
      <EncounterCastBars settings={hudSettings} enemyCast={view.innerCastStartedAt !== undefined && !view.innerCastInterrupted ? { label: 'Drowned Echo · Soulcoil', seconds: Math.max(0, 10 - (view.time - view.innerCastStartedAt)), duration: 10 } : undefined} />
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Nek'zali encounter setup" title="Choose role and assignment" description="Your raid position locks your role, class, intermission duty, and Realm Group for this pull." assignmentNotice={`REALM GROUP ${view.wellGroup}: ${view.wellGroup === 1 ? 'enter during Phase 1' : 'stay outside in Phase 1 and enter during Phase 2'}. ${view.cleanupDuty ? 'Cremation cleanup: stay out of Pyre and burn remains.' : 'Pyre soak: join the main raid soak.'}`} bossLabel="Nek'zali" />
    </div><RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? "Nek'zali defeated" : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed the encounter contract.' : view.failures[0]?.advice ?? 'Review the mechanic and retry.'} onRetry={retry} onExit={onExit} />}
    </div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actions, selected.role, 'learn2d')}</span></div></div></section>
  </main>
}
