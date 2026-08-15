import type { TrainingHudSettings } from './trainingSettings'
import type { ReactNode } from 'react'

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
  compact?: boolean
}

export default function TrainingHud({ settings, mode, objective, secondsRemaining, position, status, playerHealth = 100, bossHealth = 100, auraLabel = 'No active aura', actionStatus = 'Ready', compact = false }: TrainingHudProps) {
  return <aside className="training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    <span className="training-hud-mode">{mode}</span>
    {settings.showObjective && <div><small>Objective</small><strong>{objective}</strong></div>}
    {settings.showTimer && secondsRemaining !== undefined && <div><small>Time</small><strong>{Math.max(0, Math.ceil(secondsRemaining))}s</strong></div>}
    {settings.showPosition && position && <div><small>Position</small><strong>{position.x.toFixed(1)} · {position.z.toFixed(1)}</strong></div>}
    {!compact && settings.showPlayer && <div><small>Player</small><strong>{Math.round(playerHealth)}% · cooldowns</strong></div>}
    {!compact && settings.showAuras && <div><small>Auras</small><strong>{auraLabel}</strong></div>}
    {!compact && settings.showActions && <div><small>Actions</small><strong>{actionStatus}</strong></div>}
    {!compact && settings.showBoss && <div><small>Boss</small><strong>{Math.round(bossHealth)}%</strong></div>}
    {status && <p className="training-hud-status" role="status">{status}</p>}
  </aside>
}

interface ArenaTrainingHudProps extends Omit<TrainingHudProps, 'mode' | 'compact'> {
  castSeconds?: number
  actionButton?: ReactNode
}

/** Season 2 extraction of the reviewed v0.9.1 in-arena HUD contract. */
export function ArenaTrainingHud({ settings, objective, secondsRemaining, position, status, playerHealth = 100, bossHealth = 100, auraLabel = 'No active aura', actionStatus = 'Ready', castSeconds = 0, actionButton }: ArenaTrainingHudProps) {
  const at = (box: keyof TrainingHudSettings['layout']) => ({ left: `${settings.layout[box].x}%`, top: `${settings.layout[box].y}%` })
  return <aside className="arena-training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    {(settings.showObjective || settings.showTimer || settings.showPosition) && <div className="arena-hud-mechanic" style={at('objective')}>
      {settings.showObjective && <><small>Mechanic</small><strong>{objective}</strong></>}
      <span>{settings.showTimer && secondsRemaining !== undefined ? `${Math.max(0, Math.ceil(secondsRemaining))}s` : ''}{settings.showPosition && position ? `${settings.showTimer && secondsRemaining !== undefined ? ' · ' : ''}${position.x.toFixed(1)} · ${position.z.toFixed(1)}` : ''}</span>
      {settings.showActions && <b aria-label="Action state">{actionStatus}</b>}
      {status && <em role="status">{status}</em>}
    </div>}
    {settings.showPlayer && <div className="arena-hud-health player" style={at('player')}><small>Player</small><div><i style={{ width: `${playerHealth}%` }} /></div><strong>{Math.round(playerHealth)}%</strong></div>}
    {settings.showAuras && <div className="arena-hud-auras" style={at('auras')}><small>Status</small><strong>{auraLabel}</strong></div>}
    {settings.showBoss && <div className="arena-hud-health boss" style={at('boss')}><small>Training boss</small><div><i style={{ width: `${bossHealth}%` }} /></div><strong>{Math.round(bossHealth)}%</strong></div>}
    {settings.showActions && castSeconds > 0 && <div className="arena-hud-castbar" style={at('castbar')}><i style={{ width: `${Math.max(0, Math.min(100, (1 - castSeconds) * 100))}%` }} /><strong>Main ability · {castSeconds.toFixed(1)}s</strong></div>}
    {settings.showActions && actionButton && <div className="arena-hud-actions" style={at('actions')} aria-label="HUD action buttons">{actionButton}</div>}
  </aside>
}
