import { useEffect, useRef, useState, type CSSProperties } from 'react'
import AuraIcons from '../AuraIcons'
import { ContractPullOverlay, useContractPullGate } from '../ContractPullGate'
import { auraToneColors, contractMemberForRole, contractRaidRoster, CONTRACT_LANDING_SECONDS, type ContractPlayerRole } from '../contractRoom'
import type { EncounterRuntimeProps } from '../encounters'
import RuntimeStatusBar from '../RuntimeStatusBar'
import { keyLabel } from '../trainingSettings'
import { useContractActions } from '../useContractActions'
import { useRuntimePause } from '../useRuntimePause'
import { activeContractEvent2D, contractGroundSlots2D, contractRaidPosition2D, createContractRoom2DState, prepareContractRoom2DRole, stepContractRoom2D } from './contractRoomSimulation'
import type { DiagramDirection } from './movement'

export default function ContractRoom2D({ keyBindings, onExit }: EncounterRuntimeProps) {
  const stateRef = useRef(createContractRoom2DState())
  const pressedRef = useRef(new Set<DiagramDirection>())
  const [view, setView] = useState(stateRef.current)
  const gate = useContractPullGate()
  const pause = useRuntimePause(keyBindings.pause)
  const actions = useContractActions({ enabled: gate.phase === 'active', role: gate.role, eventIndex: view.eventIndex, keyBindings, includeMainAndPotion: false })

  function chooseRole(role: ContractPlayerRole) {
    gate.setRole(role)
    stateRef.current = prepareContractRoom2DRole(stateRef.current, role)
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
      if (now - lastPublish >= 50) { lastPublish = now; setView(stateRef.current) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gate.phaseRef, pause.pausedRef])

  const event = activeContractEvent2D(view)
  const age = view.time - view.eventStartedAt
  const setPad = (direction: DiagramDirection, active: boolean) => { if (active && gate.phaseRef.current === 'active' && !pause.pausedRef.current) pressedRef.current.add(direction); else pressedRef.current.delete(direction) }

  return <main className="training-shell contract-room-runtime">
    <RuntimeStatusBar meta={`DEVELOPMENT · LEARN 2D LAB · ${gate.role.toUpperCase()}`} title="Top-down reaction lab" status={`Match ${event.tone} · ${view.successes} resolved · event ${view.eventIndex + 1}`} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only">
      <div className="learn2d-stage">
        <div className="learn2d-board contract-2d-board" aria-label="Top-down contract training arena" data-raid-size={contractRaidRoster.length}>
          <div className="contract-2d-boss" aria-label="Training boss"><span>BOSS</span><i className="actor-health"><b style={{ width: '100%' }} /></i></div>
          {event.groundObjects.map(object => {
            const slot = contractGroundSlots2D[object.direction]
            return <div key={object.id} className={`contract-ground ${object.tone}${age < CONTRACT_LANDING_SECONDS ? ' incoming' : ''}`} style={{ left: `${slot.x}%`, top: `${slot.y}%`, '--ground-color': auraToneColors[object.tone] } as CSSProperties} aria-label={`${object.tone} ground rune`} />
          })}
          {contractRaidRoster.filter(member => !member.controlled).map((originalMember, index) => { const member = contractMemberForRole(originalMember, gate.role); const origin = contractRaidPosition2D(member); return <div key={member.id} className={`contract-raid-member ${member.role}`} style={{ left: `${origin.x + Math.sin(view.time * .7 + index) * .6}%`, top: `${origin.y + Math.cos(view.time * .5 + index) * .35}%` }} aria-label={`${member.role} NPC`}><span /></div> })}
          <div className={`learn2d-character player ${gate.role}`} data-position-x={view.player.x.toFixed(2)} data-position-y={view.player.y.toFixed(2)} style={{ left: `${view.player.x}%`, top: `${view.player.y}%` }} aria-label={`Controlled ${gate.role} player with ${event.tone} aura`}><AuraIcons tones={[event.tone]} label={`${event.tone} aura`} /><i className="actor-health"><b style={{ width: `${actions.health}%` }} /></i><span className="character-body" aria-hidden="true" /></div>
          <ContractPullOverlay role={gate.role} onRoleChange={chooseRole} phase={gate.phase} seconds={gate.seconds} onStart={gate.start} mode="Learn 2D" />
        </div>
        <div className="learn2d-controls"><span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Shield {keyLabel(keyBindings.shield)}{gate.role === 'tank' ? ` · Taunt / Spott ${keyLabel(keyBindings.taunt)}` : ''} · no Main ability or potion in Learn 2D</span><div className="learn2d-dpad" aria-label="2D movement controls">{(['forward', 'left', 'backward', 'right'] as DiagramDirection[]).map(direction => <button type="button" key={direction} aria-label={`Move ${direction}`} disabled={gate.phase !== 'active'} onPointerDown={() => setPad(direction, true)} onPointerUp={() => setPad(direction, false)} onPointerLeave={() => setPad(direction, false)} onPointerCancel={() => setPad(direction, false)}>{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}</div></div>
      </div>
    </section>
    <details className="contract-lab-drawer"><summary>Lab configuration</summary><div><p>Four ground objects land together. Only the rune matching your attached icon is correct.</p><p>20-player raid · {view.successes} resolved · {view.misses} missed · {view.wrongGrounds} wrong rune</p></div></details>
  </main>
}
