import type { TrainingHudSettings } from './trainingSettings'

interface TrainingHudProps {
  settings: TrainingHudSettings
  mode: 'Learn 2D' | 'Train 3D'
  objective: string
  secondsRemaining?: number
  position?: { x: number; z: number }
  status?: string
  playerHealth?: number
  bossHealth?: number
  auraLabel?: string
  actionStatus?: string
}

export default function TrainingHud({ settings, mode, objective, secondsRemaining, position, status, playerHealth = 100, bossHealth = 100, auraLabel = 'No active aura', actionStatus = 'Ready' }: TrainingHudProps) {
  return <aside className="training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    <span className="training-hud-mode">{mode}</span>
    {settings.showObjective && <div><small>Objective</small><strong>{objective}</strong></div>}
    {settings.showTimer && secondsRemaining !== undefined && <div><small>Time</small><strong>{Math.max(0, Math.ceil(secondsRemaining))}s</strong></div>}
    {settings.showPosition && position && <div><small>Position</small><strong>{position.x.toFixed(1)} · {position.z.toFixed(1)}</strong></div>}
    {settings.showPlayer && <div><small>Player</small><strong>{Math.round(playerHealth)}% · cooldowns</strong></div>}
    {settings.showAuras && <div><small>Auras</small><strong>{auraLabel}</strong></div>}
    {settings.showActions && <div><small>Actions</small><strong>{actionStatus}</strong></div>}
    {settings.showBoss && <div><small>Boss</small><strong>{Math.round(bossHealth)}%</strong></div>}
    {status && <p className="training-hud-status" role="status">{status}</p>}
  </aside>
}
