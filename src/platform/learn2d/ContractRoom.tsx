import { useEffect, useRef, useState, type CSSProperties } from 'react'
import AuraIcons from '../AuraIcons'
import ContractActionBar from '../ContractActionBar'
import { auraToneColors, contractRaidRoster, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS } from '../contractRoom'
import type { EncounterRuntimeProps } from '../encounters'
import TrainingHud from '../TrainingHud'
import { keyLabel } from '../trainingSettings'
import { activeContractEvent2D, contractGroundSlots2D, contractRaidPosition2D, createContractRoom2DState, stepContractRoom2D } from './contractRoomSimulation'
import type { DiagramDirection } from './movement'

export default function ContractRoom2D({ keyBindings, hudSettings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoom2DState())
  const pressedRef = useRef(new Set<DiagramDirection>())
  const [view, setView] = useState(stateRef.current)

  useEffect(() => {
    const codes = { forward: keyBindings.forward, backward: keyBindings.backward, left: keyBindings.left, right: keyBindings.right } as const
    const update = (event: KeyboardEvent, active: boolean) => {
      const direction = (Object.keys(codes) as DiagramDirection[]).find(candidate => codes[candidate] === event.code)
      if (!direction) return
      event.preventDefault()
      if (active) pressedRef.current.add(direction); else pressedRef.current.delete(direction)
    }
    const down = (event: KeyboardEvent) => update(event, true)
    const up = (event: KeyboardEvent) => update(event, false)
    const clear = () => pressedRef.current.clear()
    const visibility = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility); clear() }
  }, [keyBindings])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05)
      previous = now
      stateRef.current = stepContractRoom2D(stateRef.current, pressedRef.current, seconds)
      if (now - lastPublish >= 50) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const event = activeContractEvent2D(view)
  const age = view.time - view.eventStartedAt
  const setPad = (direction: DiagramDirection, active: boolean) => { if (active) pressedRef.current.add(direction); else pressedRef.current.delete(direction) }

  return <main className="training-shell contract-room-runtime">
    <header className="training-header"><div><p className="eyebrow">DEVELOPMENT · LEARN 2D CONTRACT ROOM</p><h1>Top-down reaction lab</h1><p className="lede">Read your attached icon, then move onto the one matching ground rune while the full raid continues its role formation.</p></div><button type="button" className="secondary" onClick={onExit}>Back to setup</button></header>
    <section className="training-runtime-layout">
      <div className="learn2d-stage">
        <div className="learn2d-board contract-2d-board" aria-label="Top-down contract training arena" data-raid-size={contractRaidRoster.length}>
          <div className="contract-2d-boss" aria-label="Training boss">BOSS</div>
          {event.groundObjects.map(object => {
            const slot = contractGroundSlots2D[object.direction]
            return <div key={object.id} className={`contract-ground ${object.tone}${age < CONTRACT_LANDING_SECONDS ? ' incoming' : ''}`} style={{ left: `${slot.x}%`, top: `${slot.y}%`, '--ground-color': auraToneColors[object.tone] } as CSSProperties} aria-label={`${object.tone} ground rune`} />
          })}
          {contractRaidRoster.filter(member => !member.controlled).map((member, index) => { const origin = contractRaidPosition2D(member); return <div key={member.id} className={`contract-raid-member ${member.role}`} style={{ left: `${origin.x + Math.sin(view.time * .7 + index) * .6}%`, top: `${origin.y + Math.cos(view.time * .5 + index) * .35}%` }} aria-label={`${member.role} NPC`}><span /></div> })}
          <div className="learn2d-character player" data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.y.toFixed(2)} style={{ left: `${view.player.x}%`, top: `${view.player.y}%` }} aria-label={`Controlled player with ${event.tone} aura`}><AuraIcons tones={[event.tone]} label={`${event.tone} aura`} /><span className="character-body" aria-hidden="true" /></div>
        </div>
        <div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)}</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as DiagramDirection[]).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div></div>
      </div>
      <div className="training-sidecar"><TrainingHud settings={hudSettings} mode="Learn 2D" objective={`Match the ${event.tone} ground rune`} secondsRemaining={CONTRACT_EVENT_SECONDS - age} position={{ x: view.player.x, z: view.player.y }} status={`${view.successes} resolved · ${view.misses} missed (${view.wrongGrounds} wrong rune) · 20-player raid`} /><ContractActionBar keyBindings={keyBindings} eventIndex={view.eventIndex} /><p className="contract-room-note">Four ground objects land together. Only the one matching the icon attached to your character is correct; the other three deliberately test rejection.</p></div>
    </section>
  </main>
}
