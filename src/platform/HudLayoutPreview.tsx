import { useRef, type PointerEvent } from 'react'
import { DEFAULT_HUD_LAYOUT, type HudBox, type TrainingHudSettings } from './trainingSettings'

const labels: Record<HudBox, string> = { objective: 'Objective + timer', player: 'Player health + cooldowns', auras: 'Buff / debuff state', actions: 'Action state', boss: 'Boss health' }

export default function HudLayoutPreview({ settings, onChange }: { settings: TrainingHudSettings; onChange: (settings: TrainingHudSettings) => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const visible: Record<HudBox, boolean> = { objective: settings.showObjective || settings.showTimer, player: settings.showPlayer, auras: settings.showAuras, actions: settings.showActions, boss: settings.showBoss }
  function move(box: HudBox, event: PointerEvent<HTMLButtonElement>) {
    if (!(event.buttons & 1) || !stageRef.current) return
    const bounds = stageRef.current.getBoundingClientRect()
    const point = { x: Math.max(5, Math.min(95, (event.clientX - bounds.left) / bounds.width * 100)), y: Math.max(5, Math.min(95, (event.clientY - bounds.top) / bounds.height * 100)) }
    onChange({ ...settings, layout: { ...settings.layout, [box]: point } })
  }
  return <div className="hud-layout-editor">
    <div className="hud-layout-preview" ref={stageRef} aria-label="Draggable HUD preview">
      {(Object.keys(labels) as HudBox[]).filter(box => visible[box]).map(box => <button type="button" key={box} className={`hud-preview-box ${box}`} style={{ left: `${settings.layout[box].x}%`, top: `${settings.layout[box].y}%` }} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={event => move(box, event)}>{labels[box]}</button>)}
    </div>
    <button type="button" className="secondary" onClick={() => onChange({ ...settings, layout: structuredClone(DEFAULT_HUD_LAYOUT) })}>Reset HUD positions</button>
  </div>
}
