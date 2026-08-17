import { keyLabel } from './trainingSettings'
import { playTrainerCue, setMusicPaused, speakTrainerCue, useRuntimeAudioCue, useTrainerAudioSettings } from './trainerAudio'

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
  const [audio, setAudio] = useTrainerAudioSettings()
  useRuntimeAudioCue(status, paused, audio)
  const toggle = (channel: 'music' | 'sounds' | 'raidlead') => {
    const next = { ...audio, [channel]: !audio[channel] }
    setAudio(next)
    if (channel === 'sounds' && next.sounds) playTrainerCue(next.soundsVolume, 'preview')
    if (channel === 'raidlead' && next.raidlead) speakTrainerCue('Raid lead ready', next.raidleadVolume)
  }
  const togglePause = () => { setMusicPaused(!paused, audio); onTogglePause() }
  return <header className="runtime-status-bar">
    <div className="runtime-status-meta"><span>{meta}</span></div>
    <div className="runtime-status-center"><h1>{title}</h1><p role="status">{paused ? 'Paused' : status}</p></div>
    <div className="runtime-status-actions">
      {performance && <span className="runtime-performance">{performance}</span>}
      <button type="button" aria-pressed={audio.music} onClick={() => toggle('music')}>♫ Music {audio.music ? 'on' : 'off'}</button>
      <button type="button" aria-pressed={audio.sounds} onClick={() => toggle('sounds')}>◖ Sounds {audio.sounds ? 'on' : 'off'}</button>
      <button type="button" aria-pressed={audio.raidlead} onClick={() => toggle('raidlead')}>♟ Raidlead {audio.raidlead ? 'on' : 'off'}</button>
      <button type="button" onClick={togglePause}>{paused ? 'Resume' : 'Pause'} <kbd>{keyLabel(pauseKey)}</kbd></button>
      <button type="button" onClick={onExit}>Exit</button>
    </div>
  </header>
}
