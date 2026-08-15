import type { TrainingHudSettings } from './trainingSettings'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface TrainingHudProps {
  settings: TrainingHudSettings
  mode: 'Learn 2D' | 'Train 3D'
  objective: string
  secondsRemaining?: number
  timers?: readonly { label: string; seconds: number }[]
  status?: string
  playerHealth?: number
  bossHealth?: number
  auraLabel?: string
  actionStatus?: string
  compact?: boolean
}

export default function TrainingHud({ settings, mode, objective, secondsRemaining, status, playerHealth = 100, bossHealth = 100, auraLabel = 'No active aura', actionStatus = 'Ready', compact = false }: TrainingHudProps) {
  return <aside className="training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    <span className="training-hud-mode">{mode}</span>
    <div><small>Objective</small><strong>{objective}</strong></div>
    {secondsRemaining !== undefined && <div><small>Time</small><strong>{Math.max(0, Math.ceil(secondsRemaining))}s</strong></div>}
    {!compact && settings.showPlayer && <div><small>Player</small><strong>{Math.round(playerHealth)}% · cooldowns</strong></div>}
    {!compact && settings.showAuras && <div><small>Auras</small><strong>{auraLabel}</strong></div>}
    {!compact && settings.showActions && <div><small>Actions</small><strong>{actionStatus}</strong></div>}
    {!compact && settings.showBoss && <div><small>Boss</small><strong>{Math.round(bossHealth)}%</strong></div>}
    {status && <p className="training-hud-status" role="status">{status}</p>}
  </aside>
}

interface ArenaTrainingHudProps extends Omit<TrainingHudProps, 'mode' | 'compact'> {
  castSeconds?: number
  castSecondsSource?: () => number
  actionButton?: ReactNode
}

function SmoothCastBar({ seconds, secondsSource, style }: { seconds: number; secondsSource?: () => number; style: CSSProperties }) {
  const fillRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let frame = 0
    const paint = () => {
      const remaining = secondsSource?.() ?? seconds
      if (fillRef.current) fillRef.current.style.width = `${Math.max(0, Math.min(100, (1 - remaining) * 100))}%`
      if (labelRef.current) labelRef.current.textContent = `Main ability · ${remaining.toFixed(1)}s`
      if (remaining > 0) frame = requestAnimationFrame(paint)
    }
    paint()
    return () => cancelAnimationFrame(frame)
  }, [seconds, secondsSource])
  return <div className="arena-hud-castbar" style={style}><i ref={fillRef} /><strong ref={labelRef}>Main ability · {seconds.toFixed(1)}s</strong></div>
}

/** Season 2 extraction of the reviewed v0.9.1 in-arena HUD contract. */
export function ArenaTrainingHud({ settings, objective, secondsRemaining, timers, status, playerHealth = 100, bossHealth = 100, auraLabel = 'No active aura', actionStatus = 'Ready', castSeconds = 0, castSecondsSource, actionButton }: ArenaTrainingHudProps) {
  const at = (box: keyof TrainingHudSettings['layout']) => ({ left: `${settings.layout[box].x}%`, top: `${settings.layout[box].y}%` })
  const countdowns = timers ?? (secondsRemaining === undefined ? [] : [{ label: 'Time', seconds: secondsRemaining }])
  return <aside className="arena-training-hud" aria-label="Training HUD" style={{ fontSize: `${settings.scale}%` }}>
    <div className="arena-hud-mechanic" style={at('objective')}>
      <><small>Mechanic</small><strong>{objective}</strong></>
      <span className="arena-hud-countdowns">{countdowns.filter((timer, index) => index === 0 || timer.seconds > .05).map(timer => <i key={timer.label}>{timer.label} {Math.max(0, timer.seconds).toFixed(timer.seconds < 5 ? 1 : 0)}s</i>)}</span>
      {settings.showActions && <b aria-label="Action state">{actionStatus}</b>}
      {status && <em role="status">{status}</em>}
    </div>
    {settings.showPlayer && <div className="arena-hud-health player" style={at('player')}><small>Player</small><div><i style={{ width: `${playerHealth}%` }} /></div><strong>{Math.round(playerHealth)}%</strong></div>}
    {settings.showAuras && <div className="arena-hud-auras" style={at('auras')}><small>Status</small><strong>{auraLabel}</strong></div>}
    {settings.showBoss && <div className="arena-hud-health boss" style={at('boss')}><small>Training boss</small><div><i style={{ width: `${bossHealth}%` }} /></div><strong>{Math.round(bossHealth)}%</strong></div>}
    {settings.showActions && castSeconds > 0 && <SmoothCastBar seconds={castSeconds} secondsSource={castSecondsSource} style={at('castbar')} />}
    {settings.showActions && actionButton && <div className="arena-hud-actions" style={at('actions')} aria-label="HUD action buttons">{actionButton}</div>}
  </aside>
}
