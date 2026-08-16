import { useEffect, useRef, useState, type CSSProperties } from 'react'
import AuraIcons from '../AuraIcons'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import { auraToneColors, contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, CONTRACT_LANDING_SECONDS } from '../contractRoom'
import { encounterActionLegend, type EncounterRuntimeProps } from '../encounters'
import RuntimeStatusBar from '../RuntimeStatusBar'
import RuntimeFeedback from '../RuntimeFeedback'
import { ActorMainCastBar } from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { classProjectileEffects, cosmeticClassProjectiles } from '../train3d/cosmeticCombat'
import type { ActorSnapshot } from '../train3d/types'
import { useContractActions } from '../useContractActions'
import { useRuntimePause } from '../useRuntimePause'
import { useRuntimeInputClear } from '../useRuntimeInputClear'
import { activeContractEvent2D, contractGroundSlots2D, contractRaidPosition2D, createContractRoom2DState, prepareContractRoom2DSlot, stepContractRoom2D } from './contractRoomSimulation'
import type { DiagramDirection } from './movement'
import SnapshotEffects from './SnapshotEffects'
import { beginEncounterAction } from '../encounters/timeline'
import { ambientNpcPosition } from '../encounters/ambientNpc'

export default function ContractRoom2D({ keyBindings, actions: actionRegistry, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoom2DState())
  const playerElementRef = useRef<HTMLDivElement>(null)
  const pressedRef = useRef(new Set<DiagramDirection>())
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  useRuntimeInputClear(() => pressedRef.current.clear())
  const actions = useContractActions({ enabled: gate.phase === 'active', paused: pause.paused, role: gate.role, mode: 'learn2d', eventIndex: view.eventIndex, actions: actionRegistry, onAction: action => {
    stateRef.current = { ...stateRef.current, timeline: beginEncounterAction(stateRef.current.timeline, { id: 'controlled-player', kind: 'controlled-player' }, action, action === 'mainAbility' ? 1 : 0, 'spell-dummy') }
  } })

  function chooseSlot(slotId: string) {
    gate.setSelectedSlotId(slotId)
    stateRef.current = prepareContractRoom2DSlot(stateRef.current, slotId)
    pressedRef.current.clear()
    setView(stateRef.current)
  }

  useEffect(() => {
    const codes = { forward: keyBindings.forward, backward: keyBindings.backward, left: keyBindings.left, right: keyBindings.right } as const
    const update = (event: KeyboardEvent, active: boolean) => {
      const direction = (Object.keys(codes) as DiagramDirection[]).find(candidate => codes[candidate] === event.code)
      if (!direction) return
      event.preventDefault()
      if (gate.phaseRef.current !== 'active' || pause.pausedRef.current) return
      if (active) pressedRef.current.add(direction); else pressedRef.current.delete(direction)
    }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => pressedRef.current.clear()
    const visibility = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility); clear() }
  }, [gate.phaseRef, keyBindings, pause.pausedRef])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05)
      previous = now
      if (gate.phaseRef.current === 'active' && !pause.pausedRef.current) stateRef.current = stepContractRoom2D(stateRef.current, pressedRef.current, seconds)
      const playerElement = playerElementRef.current
      if (playerElement) {
        playerElement.style.left = `${stateRef.current.player.x}%`
        playerElement.style.top = `${stateRef.current.player.y}%`
        playerElement.dataset.positionX = stateRef.current.player.x.toFixed(2)
        playerElement.dataset.positionY = stateRef.current.player.y.toFixed(2)
      }
      if (now - lastPublish >= 33) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  const event = activeContractEvent2D(view)
  const roster = contractRosterForSlot(gate.selectedSlotId)
  const controlled = contractSelectedMember(gate.selectedSlotId)
  const age = view.time - view.eventStartedAt
  const actorPoint = (member: (typeof roster)[number]) => { const point = member.controlled ? { x: view.player.x, y: view.player.y } : contractRaidPosition2D(member); return { x: point.x - 50, z: (point.y - 50) * .6 } }
  const combatActors: ActorSnapshot[] = roster.map(member => ({ id: member.controlled ? 'player' : member.id, kind: member.controlled ? 'player' : 'ally', playerClass: member.playerClass, position: actorPoint(member), facing: 0, color: trainingClassColors[member.playerClass], auras: [] }))
  const bossPoint = { x: 0, z: -4.8 }
  const combatEffects = [...cosmeticClassProjectiles(combatActors, bossPoint, view.time), ...(actions.mainProjectileAge >= 0 ? classProjectileEffects('contract-player-main', actorPoint(roster.find(member => member.controlled)!), bossPoint, controlled.playerClass, actions.mainProjectileAge, view.eventIndex, 1) : [])]
  const setPad = (direction: DiagramDirection, active: boolean) => { if (active && gate.phaseRef.current === 'active' && !pause.pausedRef.current) pressedRef.current.add(direction); else pressedRef.current.delete(direction) }

  return <main className="training-shell contract-room-runtime">
    <RuntimeStatusBar meta={`DEVELOPMENT · LEARN 2D LAB · ${gate.role.toUpperCase()}`} title="Top-down reaction lab" status={`Match ${event.tone} · ${view.successes} resolved · event ${view.eventIndex + 1}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only">
      <div className="learn2d-stage">
        <div className="learn2d-arena-frame"><div className="learn2d-board contract-2d-board" aria-label="Top-down contract training arena" data-raid-size={contractRaidRoster.length}>
          <div className="contract-2d-boss" aria-label="Training boss"><span>BOSS</span><i className="actor-health"><b style={{ width: '100%' }} /></i></div>
          <SnapshotEffects effects={combatEffects} width={100} depth={60} />
          {event.groundObjects.map(object => {
            const slot = contractGroundSlots2D[object.direction]
            return <div key={object.id} className={`contract-ground ${object.tone}${age < CONTRACT_LANDING_SECONDS ? ' incoming' : ''}`} style={{ left: `${slot.x}%`, top: `${slot.y}%`, '--ground-color': auraToneColors[object.tone] } as CSSProperties} aria-label={`${object.tone} ground rune`} />
          })}
          {roster.filter(member => !member.controlled).map(member => { const origin = contractRaidPosition2D(member); const position = ambientNpcPosition(member.id, { x: origin.x, z: origin.y }, view.time, { radius: member.role === 'tank' || member.role === 'melee' ? .45 : .8 }); return <div key={member.id} className={`contract-raid-member ${member.role}`} style={{ left: `${position.x}%`, top: `${position.z}%` }} aria-label={`${member.role} NPC`}><span /></div> })}
          <div ref={playerElementRef} className={`learn2d-character player ${gate.role}`} data-player-class={controlled.playerClass} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.y.toFixed(2)} style={{ left: `${view.player.x}%`, top: `${view.player.y}%`, '--player-class-color': trainingClassColors[controlled.playerClass] } as CSSProperties} aria-label={`Controlled ${controlled.playerClass.replace('-', ' ')} ${gate.role} player with ${event.tone} aura`}><AuraIcons tones={[event.tone]} label={`${event.tone} aura`} /><i className="actor-health"><b style={{ width: `${actions.health}%` }} /></i><span className="character-body" aria-hidden="true" /><ActorMainCastBar enabled={hudSettings.showActions} castSeconds={actions.mainCast} castSecondsSource={actions.mainCastSecondsSource} /></div>
          <ContractPullOverlay selectedSlotId={gate.selectedSlotId} onSlotChange={chooseSlot} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" />
          <RuntimeFeedback failures={view.failures} elapsed={view.time} />
        </div></div>
        <div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · {encounterActionLegend(actionRegistry, gate.role, 'learn2d')}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as DiagramDirection[]).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div></div>
      </div>
    </section>
    <details className="contract-lab-drawer"><summary>Lab configuration</summary><div><p>Four ground objects land together. Only the rune matching your attached icon is correct.</p><p>20-player raid · {view.successes} resolved · {view.misses} missed · {view.wrongGrounds} wrong rune</p></div></details>
  </main>
}
