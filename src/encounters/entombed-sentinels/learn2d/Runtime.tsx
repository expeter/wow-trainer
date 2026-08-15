import { useEffect, useMemo, useRef, useState } from 'react'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { stepDiagramMovement, type DiagramDirection } from '../../../platform/learn2d/movement'
import RuntimeStatusBar from '../../../platform/RuntimeStatusBar'
import RuntimeFeedback, { type RuntimeFailure } from '../../../platform/RuntimeFeedback'
import { keyLabel } from '../../../platform/trainingSettings'
import { useRuntimePause } from '../../../platform/useRuntimePause'
import ToxinIcons from '../ToxinIcons'
import { learn2dScenarios } from './scenarios'

type Direction = DiagramDirection
type LessonOutcome = 'active' | 'success' | 'wrong-partner' | 'expired'
const startPosition = { x: 27, y: 62 }
const partners = [
  { id: 'compatible', x: 50, y: 18, green: 3, red: 1 },
  { id: 'wrong-south', x: 50, y: 82, green: 2, red: 2 },
  { id: 'wrong-east', x: 76, y: 58, green: 1, red: 3 },
] as const

export default function SentinelsLearn2D({ scenarioId, keyBindings, onExit }: EncounterRuntimeProps) {
  const scenario = useMemo(() => learn2dScenarios.find(item => item.id === scenarioId) ?? learn2dScenarios[0], [scenarioId])
  const playerRef = useRef({ ...startPosition })
  const pressedRef = useRef(new Set<Direction>())
  const elapsedRef = useRef(0)
  const outcomeRef = useRef<LessonOutcome>('active')
  const [player, setPlayer] = useState({ ...startPosition })
  const [secondsRemaining, setSecondsRemaining] = useState(28)
  const [outcome, setOutcome] = useState<LessonOutcome>('active')
  const [attempt, setAttempt] = useState(0)
  const [failures, setFailures] = useState<RuntimeFailure[]>([])
  const pause = useRuntimePause(keyBindings.pause)

  useEffect(() => {
    const codes: Record<Direction, string> = {
      forward: keyBindings.forward,
      backward: keyBindings.backward,
      left: keyBindings.left,
      right: keyBindings.right,
    }
    const updateKey = (event: KeyboardEvent, active: boolean) => {
      const direction = (Object.keys(codes) as Direction[]).find(candidate => codes[candidate] === event.code)
      if (!direction) return
      event.preventDefault()
      if (active && !pause.pausedRef.current) pressedRef.current.add(direction)
      else pressedRef.current.delete(direction)
    }
    const down = (event: KeyboardEvent) => updateKey(event, true)
    const up = (event: KeyboardEvent) => updateKey(event, false)
    const clear = () => pressedRef.current.clear()
    const visibility = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', visibility)
      clear()
    }
  }, [keyBindings, pause.pausedRef])

  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let lastPublish = 0
    const tick = (now: number) => {
      const seconds = Math.min((now - previous) / 1000, .05)
      previous = now
      if (outcomeRef.current === 'active' && !pause.pausedRef.current) {
        elapsedRef.current += seconds
        playerRef.current = stepDiagramMovement(playerRef.current, pressedRef.current, seconds)
        const contacted = partners.find(partner => Math.hypot(playerRef.current.x - partner.x, playerRef.current.y - partner.y) < 6)
        if (contacted) outcomeRef.current = contacted.id === 'compatible' ? 'success' : 'wrong-partner'
        else if (elapsedRef.current >= 28) outcomeRef.current = 'expired'
        if (now - lastPublish > 50 || outcomeRef.current !== 'active') {
          lastPublish = now
          setPlayer({ ...playerRef.current })
          setSecondsRemaining(Math.max(0, 28 - elapsedRef.current))
          setOutcome(outcomeRef.current)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [attempt, pause.pausedRef])

  function setPad(direction: Direction, active: boolean) {
    if (active && !pause.pausedRef.current) pressedRef.current.add(direction)
    else pressedRef.current.delete(direction)
  }

  function restart() {
    playerRef.current = { ...startPosition }
    pressedRef.current.clear()
    elapsedRef.current = 0
    outcomeRef.current = 'active'
    setPlayer({ ...startPosition })
    setSecondsRemaining(28)
    setOutcome('active')
    setAttempt(value => value + 1)
  }

  const status = outcome === 'active'
    ? 'Read the four icons attached to you, then move into exactly one compatible character in the north sector.'
    : outcome === 'success'
      ? 'Resolved: your pair combines to exactly four green.'
      : outcome === 'wrong-partner'
        ? 'Wrong partner. Compare the attached icons and try a composition that totals four green.'
        : 'The matching window expired before you reached a partner.'

  useEffect(() => {
    if (outcome !== 'wrong-partner' && outcome !== 'expired') return
    setFailures(current => [{
      id: `helical-2d-${attempt}-${outcome}`,
      code: outcome,
      time: elapsedRef.current,
      label: outcome === 'wrong-partner' ? 'Joined an incompatible toxin partner' : 'Toxin matching window expired',
      advice: outcome === 'wrong-partner' ? 'Add the green icons on both characters and choose the pair that totals exactly four.' : 'Read the attached icons first, then move toward the compatible northern character before the timer expires.',
    }, ...current].slice(0, 5))
  }, [attempt, outcome])

  return <main className="training-shell learn2d-runtime">
    <RuntimeStatusBar meta={`ENTOMBED SENTINELS · LEARN 2D · ${Math.ceil(secondsRemaining)}S`} title={scenario.name} status={status} paused={pause.paused} pauseKey={keyBindings.pause} onTogglePause={pause.toggle} onExit={onExit} />
    <section className="training-runtime-layout arena-only">
      <div className="learn2d-stage">
        <div className="learn2d-arena-frame"><div className="learn2d-board" aria-label="Movable Helical Toxins tactical diagram">
          <div className="learn2d-side acid-side"><span>ACID SIDE</span><b>Ula’tek</b></div>
          <div className="learn2d-sector north" aria-label="North meeting sector" />
          <div className="learn2d-corridor"><span>KEEP CLEAR</span></div>
          <div className="learn2d-sector south" aria-label="South meeting sector" />
          <div className="learn2d-side blood-side"><span>BLOOD SIDE</span><b>Lothraxion</b></div>
          {partners.map(partner => <div className="learn2d-character ally" key={partner.id} style={{ left: `${partner.x}%`, top: `${partner.y}%` }} aria-label={`Character with ${partner.green} green and ${partner.red} red toxins`}>
            <ToxinIcons green={partner.green} red={partner.red} />
            <span className="character-body" aria-hidden="true" />
          </div>)}
          <div className="learn2d-character player" data-position-x={player.x.toFixed(2)} data-position-y={player.y.toFixed(2)} style={{ left: `${player.x}%`, top: `${player.y}%` }} aria-label="Controlled character with 1 green and 3 red toxins">
            <ToxinIcons green={1} red={3} />
            <span className="character-body" aria-hidden="true" />
          </div>
          <RuntimeFeedback failures={failures} elapsed={elapsedRef.current} />
        </div></div>
        <div className="learn2d-controls">
          <span>Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)}</span>
          <div className="learn2d-dpad" aria-label="2D movement controls">
            {(['forward', 'left', 'backward', 'right'] as Direction[]).map(direction => <button
              type="button"
              key={direction}
              aria-label={`Move ${direction}`}
              onPointerDown={() => setPad(direction, true)}
              onPointerUp={() => setPad(direction, false)}
              onPointerLeave={() => setPad(direction, false)}
              onPointerCancel={() => setPad(direction, false)}
            >{direction === 'forward' ? '↑' : direction === 'backward' ? '↓' : direction === 'left' ? '←' : '→'}</button>)}
          </div>
        </div>
        {outcome !== 'active' && <button type="button" className="training-restart" onClick={restart}>Practice again</button>}
      </div>
    </section>
  </main>
}
