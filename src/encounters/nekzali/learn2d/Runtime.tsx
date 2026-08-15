import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractRosterForSlot, contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import { keyLabel } from '../../../platform/trainingSettings'
import type { PlayerCommandState } from '../../../platform/train3d/types'
import { IDLE_PLAYER_COMMANDS } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import { activeNekzaliPrompt, createNekzaliState, nekzaliMemberPosition, nekzaliSnapshot, nextNekzaliTimer, prepareNekzaliSlot, startNekzaliMainCast, stepNekzaliState, tauntNekzali } from '../simulation'

const RAID_PLAN = new URL('../../../../inbox/INBOX-20260815-124454-f3a9e1.png', import.meta.url).href
const percent = (value: number) => 50 + value / 90 * 100

export default function NekzaliLearn2D({ trainingDifficulty, keyBindings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createNekzaliState('player', trainingDifficulty))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareNekzaliSlot(stateRef.current, slotId); setView(stateRef.current) }
  function retry() { stateRef.current = createNekzaliState(gate.selectedSlotId, trainingDifficulty); setView(stateRef.current) }

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepNekzaliState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${percent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${percent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
      if (now - lastPublish >= 70) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const actions = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = actions.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => { if (!event.repeat && gate.phaseRef.current === 'active') { if (event.code === keyBindings.mainAbility) stateRef.current = startNekzaliMainCast(stateRef.current); if (event.code === keyBindings.taunt) stateRef.current = tauntNekzali(stateRef.current) } update(event, true) }
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = nekzaliSnapshot(view)
  const timer = nextNekzaliTimer(view)
  const roster = contractRosterForSlot(gate.selectedSlotId)
  const effectClass = (kind: string) => kind === 'ground-soak' ? 'soak' : kind === 'ground-spread' ? 'spread' : kind === 'arrow' ? 'arrow' : 'harmful'
  const phaseLabel = view.phase === 'phase-1' ? 'P1' : view.phase.startsWith('echo') ? 'INTERMISSION' : 'P2'
  const ownsAggro = selected.role === 'tank' && view.aggroOwner === gate.selectedSlotId
  return <main className="training-shell nekzali-runtime">
    <RuntimeStatusBar meta={`NEK'ZALI · HEROIC RULES · ${trainingDifficulty.toUpperCase()} TRAINER · ${selected.role.toUpperCase()}`} title="Nek'zali tactical full fight" status={`${phaseLabel} · ${activeNekzaliPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><div className="learn2d-board nekzali-2d-board" aria-label="Nek'zali raid-plan training arena" style={{ '--nekzali-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <div className="nekzali-2d-callout"><strong>{activeNekzaliPrompt(view)}</strong><span>{timer.label} {Math.max(0, timer.seconds).toFixed(timer.seconds < 5 ? 1 : 0)}s</span></div>
      {snapshot.effects.map(effect => <div key={effect.id} className={`nekzali-2d-effect ${effectClass(effect.kind)}${effect.filled === false ? ' outline' : ''}`} style={{ left: `${percent(effect.position.x)}%`, top: `${percent(effect.position.z)}%`, width: `${effect.radius / 90 * 200}%`, aspectRatio: '1', '--effect-color': effect.color, '--effect-rotation': effect.target ? `${Math.atan2(effect.target.z - effect.position.z, effect.target.x - effect.position.x)}rad` : '0rad' } as CSSProperties}>{effect.kind === 'arrow' ? '➜' : ''}</div>)}
      {view.corpses.filter(corpse => !corpse.cremated).map(corpse => <div key={corpse.id} className="nekzali-2d-corpse" style={{ left: `${percent(corpse.position.x)}%`, top: `${percent(corpse.position.z)}%` }}>✦</div>)}
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.kind === 'enemy').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind}${actor.id === 'nekzali-boss' ? ownsAggro ? ' owned' : ' hostile' : ''}`} style={{ left: `${percent(actor.position.x)}%`, top: `${percent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id === 'nekzali-boss' ? `Nek'zali · ${ownsAggro ? 'your aggro' : 'no aggro'}` : actor.id}><span>{actor.id === 'nekzali-boss' ? 'N' : actor.id.startsWith('echo') ? 'E' : 'A'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i></div>)}
      {roster.filter(member => !member.controlled).map(member => { const actor = snapshot.actors.find(item => item.id === member.id); const position = actor?.position ?? nekzaliMemberPosition(member); return <div key={member.id} className={`contract-raid-member ${member.role}`} style={{ left: `${percent(position.x)}%`, top: `${percent(position.z)}%` }} aria-label={`${member.role} NPC`}><span /></div> })}
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} style={{ left: `${percent(view.player.x)}%`, top: `${percent(view.player.z)}%` }} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.z.toFixed(2)} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}><span className="character-body" /><i className="actor-health"><b style={{ width: '100%' }} /></i></div>
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Nek'zali encounter setup" title="Choose role and Heroic assignment" description="Your raid position locks your role, class, and alternating intermission duty for this pull." assignmentNotice={`You are in soak group ${view.soakGroup}: ${view.soakGroup === 1 ? 'soak the first Echo, spread for the second.' : 'spread for the first Echo, soak the second.'}`} bossLabel="Nek'zali" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? "Nek'zali defeated" : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed the Heroic encounter contract.' : view.failures[0]?.advice ?? 'Review the mechanic and retry.'} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Main {keyLabel(keyBindings.mainAbility)}{selected.role === 'tank' ? ` · Taunt / Spott ${keyLabel(keyBindings.taunt)}` : ''}</span><button type="button" onClick={() => { stateRef.current = startNekzaliMainCast(stateRef.current) }}>Main ability</button>{selected.role === 'tank' && <button type="button" onClick={() => { stateRef.current = tauntNekzali(stateRef.current) }}>Taunt</button>}</div></div></section>
  </main>
}
