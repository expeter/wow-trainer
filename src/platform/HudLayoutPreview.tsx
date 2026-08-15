import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { DEFAULT_HUD_LAYOUT, type HudBox, type TrainingHudSettings } from './trainingSettings'

const labels: Record<HudBox, string> = { objective: 'Mechanic / action display', player: 'Player health + cooldowns', auras: 'Buff / debuff state', actions: 'Action buttons', boss: 'Boss health', castbar: 'Player cast bar' }

export default function HudLayoutPreview({ settings, onChange }: { settings: TrainingHudSettings; onChange: (settings: TrainingHudSettings) => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<HudBox | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const draftRef = useRef(settings.layout)
  const [draft, setDraft] = useState(settings.layout)
  const visible: Record<HudBox, boolean> = { objective: true, player: settings.showPlayer, auras: settings.showAuras, actions: settings.showActions, boss: settings.showBoss, castbar: settings.showActions }
  useEffect(() => {
    if (draggingRef.current) return
    draftRef.current = settings.layout
    setDraft(settings.layout)
  }, [settings.layout])

  function setPoint(box: HudBox, x: number, y: number, element?: HTMLButtonElement) {
    const point = { x: Math.round(Math.max(5, Math.min(95, x))), y: Math.round(Math.max(5, Math.min(95, y))) }
    const layout = { ...draftRef.current, [box]: point }
    draftRef.current = layout
    if (element) {
      element.style.left = `${point.x}%`
      element.style.top = `${point.y}%`
    } else setDraft(layout)
  }

  function move(box: HudBox, event: PointerEvent<HTMLButtonElement>) {
    if (draggingRef.current !== box || !stageRef.current) return
    const bounds = stageRef.current.getBoundingClientRect()
    setPoint(box, (event.clientX - dragOffsetRef.current.x - bounds.left) / bounds.width * 100, (event.clientY - dragOffsetRef.current.y - bounds.top) / bounds.height * 100, event.currentTarget)
  }
  function finish(box: HudBox, event: PointerEvent<HTMLButtonElement>) {
    if (draggingRef.current !== box) return
    draggingRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDraft(draftRef.current)
    onChange({ ...settings, layout: draftRef.current })
  }
  function nudge(box: HudBox, event: KeyboardEvent<HTMLButtonElement>) {
    const delta = event.shiftKey ? 5 : 1
    const point = draftRef.current[box]
    const next = event.key === 'ArrowLeft' ? { x: point.x - delta, y: point.y }
      : event.key === 'ArrowRight' ? { x: point.x + delta, y: point.y }
        : event.key === 'ArrowUp' ? { x: point.x, y: point.y - delta }
          : event.key === 'ArrowDown' ? { x: point.x, y: point.y + delta }
            : null
    if (!next) return
    event.preventDefault()
    setPoint(box, next.x, next.y)
    onChange({ ...settings, layout: draftRef.current })
  }
  return <div className="hud-layout-editor">
    <div className="hud-layout-preview" ref={stageRef} aria-label="Draggable HUD preview">
      {(Object.keys(labels) as HudBox[]).filter(box => visible[box]).map(box => <button type="button" key={box} className={`hud-preview-box ${box}`} style={{ left: `${draft[box].x}%`, top: `${draft[box].y}%` }} onPointerDown={event => {
        event.preventDefault()
        const bounds = stageRef.current?.getBoundingClientRect()
        if (!bounds) return
        draggingRef.current = box
        dragOffsetRef.current = {
          x: event.clientX - (bounds.left + draftRef.current[box].x / 100 * bounds.width),
          y: event.clientY - (bounds.top + draftRef.current[box].y / 100 * bounds.height),
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }} onPointerMove={event => move(box, event)} onPointerUp={event => finish(box, event)} onPointerCancel={event => finish(box, event)} onKeyDown={event => nudge(box, event)}>{labels[box]}</button>)}
    </div>
    <button type="button" className="secondary" onClick={() => onChange({ ...settings, layout: structuredClone(DEFAULT_HUD_LAYOUT) })}>Reset HUD positions</button>
  </div>
}
