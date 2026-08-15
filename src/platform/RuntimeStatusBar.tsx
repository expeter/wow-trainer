import { keyLabel } from './trainingSettings'

export default function RuntimeStatusBar({ meta, title, status, performance, paused, pauseKey, onTogglePause, onExit }: {
  meta: string
  title: string
  status: string
  performance?: string
  paused: boolean
  pauseKey: string
  onTogglePause: () => void
  onExit: () => void
}) {
  return <header className="runtime-status-bar">
    <div className="runtime-status-meta"><span>{meta}</span></div>
    <div className="runtime-status-center"><h1>{title}</h1><p role="status">{paused ? 'Paused' : status}</p></div>
    <div className="runtime-status-actions">
      {performance && <span className="runtime-performance">{performance}</span>}
      <button type="button" disabled title="Music service pending FR-078">♫ Music —</button>
      <button type="button" disabled title="Encounter-sound service pending FR-078">🔇 Sounds —</button>
      <button type="button" disabled title="Raidlead service pending FR-078">♟ Raidlead —</button>
      <button type="button" onClick={onTogglePause}>{paused ? 'Resume' : 'Pause'} <kbd>{keyLabel(pauseKey)}</kbd></button>
      <button type="button" onClick={onExit}>Exit</button>
    </div>
  </header>
}
