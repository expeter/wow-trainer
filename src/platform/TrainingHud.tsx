import type { TrainingHudSettings } from './trainingSettings'

interface TrainingHudProps {
  settings: TrainingHudSettings
  mode: 'Learn 2D' | 'Train 3D'
  objective: string
  secondsRemaining?: number
  position?: { x: number; z: number }
  status?: string
}

export default function TrainingHud({ settings, mode, objective, secondsRemaining, position, status }: TrainingHudProps) {
  return <aside className="training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    <span className="training-hud-mode">{mode}</span>
    {settings.showObjective && <div><small>Objective</small><strong>{objective}</strong></div>}
    {settings.showTimer && secondsRemaining !== undefined && <div><small>Time</small><strong>{Math.max(0, Math.ceil(secondsRemaining))}s</strong></div>}
    {settings.showPosition && position && <div><small>Position</small><strong>{position.x.toFixed(1)} · {position.z.toFixed(1)}</strong></div>}
    {status && <p className="training-hud-status" role="status">{status}</p>}
  </aside>
}
