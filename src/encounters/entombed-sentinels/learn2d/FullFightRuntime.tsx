import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { contractRosterForSlot, contractSelectedMember } from '../../../platform/contractRoom'
import { ContractPullOverlay, useContractPullGate } from '../../../platform/ContractPullGate'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import RuntimeFeedback from '../../../platform/RuntimeFeedback'
import RuntimeOutcomeOverlay from '../../../platform/RuntimeOutcomeOverlay'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import { keyLabel } from '../../../platform/trainingSettings'
import { IDLE_PLAYER_COMMANDS, type PlayerCommandState } from '../../../platform/train3d/types'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import ToxinIcons from '../ToxinIcons'
import { activeSentinelsPrompt, createSentinelsState, dispelSentinels, nextSentinelsTimer, prepareSentinelsSlot, sentinelsPlayerRole, sentinelsSnapshot, stepSentinelsDiagramState } from '../simulation'

const RAID_PLAN = new URL('../../../../inbox/INBOX-20260815-131711-f9dac6.png', import.meta.url).href
const xPercent = (value: number) => 50 + value / 120 * 100
const zPercent = (value: number) => 50 + value / 70 * 100

export default function SentinelsFullFight2D({ trainingDifficulty, keyBindings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createSentinelsState('player', trainingDifficulty))
  const commandsRef = useRef<PlayerCommandState>({ ...IDLE_PLAYER_COMMANDS })
  const playerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const selected = contractSelectedMember(gate.selectedSlotId)

  function chooseSlot(slotId: string) { gate.setSelectedSlotId(slotId); stateRef.current = prepareSentinelsSlot(stateRef.current, slotId); setView(stateRef.current) }
  function retry() { stateRef.current = createSentinelsState(gate.selectedSlotId, trainingDifficulty); setView(stateRef.current) }
  function dispel() { stateRef.current = dispelSentinels(stateRef.current); setView(stateRef.current) }

  useEffect(() => {
    let frame = 0; let previous = performance.now(); let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05); previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepSentinelsDiagramState(stateRef.current, commandsRef.current, seconds)
      if (playerRef.current) { playerRef.current.style.left = `${xPercent(stateRef.current.player.x)}%`; playerRef.current.style.top = `${zPercent(stateRef.current.player.z)}%`; playerRef.current.dataset.positionX = stateRef.current.player.x.toFixed(2); playerRef.current.dataset.positionY = stateRef.current.player.z.toFixed(2) }
      if (now - lastPublish >= 70) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  useEffect(() => {
    const movement = ['forward', 'backward', 'left', 'right'] as const
    const update = (event: KeyboardEvent, active: boolean) => { const action = movement.find(candidate => keyBindings[candidate] === event.code); if (!action) return; event.preventDefault(); commandsRef.current[action] = gate.phaseRef.current === 'active' && !pause.pausedRef.current ? active : false }
    const down = (event: KeyboardEvent) => { if (!event.repeat && event.code === keyBindings.dispel) { event.preventDefault(); dispel() } update(event, true) }
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => { commandsRef.current = { ...IDLE_PLAYER_COMMANDS } }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  const snapshot = sentinelsSnapshot(view)
  const timer = nextSentinelsTimer(view)
  const roster = contractRosterForSlot(gate.selectedSlotId)
  const showToxins = view.phase === 'stasis'
  const setPad = (direction: keyof Pick<PlayerCommandState, 'forward' | 'backward' | 'left' | 'right'>, active: boolean) => { commandsRef.current[direction] = active && gate.phaseRef.current === 'active' && !pause.pausedRef.current }
  return <main className="training-shell sentinels-runtime">
    <RuntimeStatusBar meta={`ENTOMBED SENTINELS · FULL FIGHT · ${trainingDifficulty.toUpperCase()} TRAINER · ${sentinelsPlayerRole(view).toUpperCase()}`} title="Entombed Sentinels full fight" status={`CYCLE ${view.cycle} · ${view.phase.toUpperCase()} · ${activeSentinelsPrompt(view)}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only"><div className="learn2d-stage"><div className="learn2d-arena-frame"><div className="learn2d-board sentinels-2d-board" aria-label="Entombed Sentinels raid-plan training arena" style={{ '--sentinels-plan': `url(${RAID_PLAN})` } as CSSProperties}>
      <div className="nekzali-2d-callout"><strong>{activeSentinelsPrompt(view)}</strong><span>{timer.label} {Math.max(0, timer.seconds).toFixed(timer.seconds < 5 ? 1 : 0)}s</span></div>
      {snapshot.effects.filter(effect => effect.kind !== 'cosmetic-projectile').map(effect => <div key={effect.id} className={`nekzali-2d-effect ${effect.kind === 'ground-soak' ? 'soak' : effect.kind === 'ground-spread' ? 'spread' : 'harmful'}${effect.filled === false ? ' outline' : ''}`} style={{ left: `${xPercent(effect.position.x)}%`, top: `${zPercent(effect.position.z)}%`, width: `${effect.radius / 120 * 200}%`, aspectRatio: '1', '--effect-color': effect.color } as CSSProperties} />)}
      {snapshot.actors.filter(actor => actor.kind === 'boss' || actor.kind === 'enemy').map(actor => <div key={actor.id} className={`nekzali-2d-enemy ${actor.kind} sentinel-${actor.id.startsWith('breath') ? 'acid' : 'blood'}`} style={{ left: `${xPercent(actor.position.x)}%`, top: `${zPercent(actor.position.z)}%`, '--enemy-color': actor.color } as CSSProperties} aria-label={actor.id}><span>{actor.id.startsWith('breath') ? 'G' : actor.id.startsWith('blood') ? 'R' : 'A'}</span><i className="actor-health"><b style={{ width: `${actor.health ?? 100}%` }} /></i><i className="sentinel-energy"><b style={{ width: `${view.energy}%` }} /></i></div>)}
      {roster.filter(member => !member.controlled).map(member => { const actor = snapshot.actors.find(item => item.id === member.id); if (!actor) return null; return <div key={member.id} className={`contract-raid-member ${member.role}`} style={{ left: `${xPercent(actor.position.x)}%`, top: `${zPercent(actor.position.z)}%` }} aria-label={`${member.role} NPC`}><span />{actor.auras.length > 0 && <ToxinIcons green={actor.auras.find(aura => aura.tone === 'poison')?.stacks ?? 0} red={actor.auras.find(aura => aura.tone === 'danger')?.stacks ?? 0} />}</div> })}
      <div ref={playerRef} className={`learn2d-character player ${selected.role}`} style={{ left: `${xPercent(view.player.x)}%`, top: `${zPercent(view.player.z)}%` }} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.z.toFixed(2)} aria-label={`Controlled ${selected.playerClass.replace('-', ' ')} ${selected.role} player`}>{showToxins && <ToxinIcons green={1} red={3} />}<span className="character-body" /><i className="actor-health"><b style={{ width: '100%' }} /></i></div>
      <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" dialogLabel="Entombed Sentinels encounter setup" title="Choose role for the full fight" description="Your raid position locks role, starting side, and side-specific responsibility. The raid swaps sides after Stasis." assignmentNotice={`Cycle one: ${view.assignedSide === 'acid' ? 'green side — droplets and return beams.' : `red side — group soak${selected.role === 'healer' ? ' and Blighted Blood dispel.' : ' and delayed pool.'}`} Protovenom pairing occurs before Stasis.`} bossLabel="Two Sentinels" />
      <RuntimeFeedback failures={view.failures} elapsed={view.time} />
      {view.outcome !== 'active' && <RuntimeOutcomeOverlay resultKey={`${view.time}-${view.outcome}`} kind={view.outcome === 'success' ? 'success' : 'wipe'} reason={view.outcome === 'success' ? 'Both Sentinels defeated' : view.outcomeReason ?? 'The raid wiped'} advice={view.outcome === 'success' ? 'You completed the full-fight contract.' : view.failures[0]?.advice ?? 'Review your assignment and retry.'} onRetry={retry} onExit={onExit} />}
    </div></div><div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)}{selected.role === 'healer' ? ` · Dispel ${keyLabel(keyBindings.dispel)}` : ''}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as const).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div>{selected.role === 'healer' && <button type="button" onClick={dispel} disabled={!view.blightedActive || view.blightedResolved}>Dispel</button>}</div></div></section>
  </main>
}
