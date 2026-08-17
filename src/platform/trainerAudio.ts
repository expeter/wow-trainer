import { useEffect, useState } from 'react'

export interface TrainerAudioSettings {
  music: boolean
  sounds: boolean
  raidlead: boolean
  musicVolume: number
  soundsVolume: number
  raidleadVolume: number
}

export const DEFAULT_TRAINER_AUDIO: TrainerAudioSettings = { music: false, sounds: false, raidlead: false, musicVolume: .22, soundsVolume: .55, raidleadVolume: .8 }
const STORAGE_KEY = 'midnight-s2:audio:v1'
const EVENT = 'midnight-s2-audio-change'
let context: AudioContext | undefined
let ambient: { gain: GainNode; oscillators: OscillatorNode[] } | undefined

function normalize(value: unknown): TrainerAudioSettings {
  if (!value || typeof value !== 'object') return DEFAULT_TRAINER_AUDIO
  const candidate = value as Partial<TrainerAudioSettings>
  const volume = (entry: unknown, fallback: number) => typeof entry === 'number' && Number.isFinite(entry) ? Math.max(0, Math.min(1, entry)) : fallback
  return {
    music: candidate.music === true, sounds: candidate.sounds === true, raidlead: candidate.raidlead === true,
    musicVolume: volume(candidate.musicVolume, DEFAULT_TRAINER_AUDIO.musicVolume),
    soundsVolume: volume(candidate.soundsVolume, DEFAULT_TRAINER_AUDIO.soundsVolume),
    raidleadVolume: volume(candidate.raidleadVolume, DEFAULT_TRAINER_AUDIO.raidleadVolume),
  }
}

export function loadTrainerAudio() {
  try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')) } catch { return DEFAULT_TRAINER_AUDIO }
}

function audioContext() {
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return
  context ??= new AudioContextConstructor()
  if (context.state === 'suspended') void context.resume()
  return context
}

function stopAmbient() {
  if (!ambient) return
  const now = context?.currentTime ?? 0
  ambient.gain.gain.cancelScheduledValues(now); ambient.gain.gain.setTargetAtTime(0, now, .08)
  for (const oscillator of ambient.oscillators) oscillator.stop(now + .4)
  ambient = undefined
}

function syncAmbient(settings: TrainerAudioSettings) {
  if (!settings.music) { stopAmbient(); return }
  const ctx = audioContext(); if (!ctx) return
  if (!ambient) {
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination)
    const oscillators = [55, 82.41].map((frequency, index) => { const oscillator = ctx.createOscillator(); oscillator.type = index ? 'triangle' : 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = index ? -7 : 0; oscillator.connect(gain); oscillator.start(); return oscillator })
    ambient = { gain, oscillators }
  }
  ambient.gain.gain.setTargetAtTime(settings.musicVolume * .09, ctx.currentTime, .12)
}

export function saveTrainerAudio(settings: TrainerAudioSettings) {
  const normalized = normalize(settings)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); syncAmbient(normalized)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: normalized }))
}

export function useTrainerAudioSettings() {
  const [settings, setSettings] = useState(loadTrainerAudio)
  useEffect(() => {
    const update = (event: Event) => setSettings(normalize((event as CustomEvent).detail))
    window.addEventListener(EVENT, update); return () => window.removeEventListener(EVENT, update)
  }, [])
  useEffect(() => {
    if (!settings.music || ambient) return
    const unlock = () => syncAmbient(settings)
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [settings])
  const update = (next: TrainerAudioSettings) => { setSettings(next); saveTrainerAudio(next) }
  return [settings, update] as const
}

export function playTrainerCue(volume: number, tone: 'preview' | 'mechanic' = 'mechanic') {
  const ctx = audioContext(); if (!ctx) return
  const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); const now = ctx.currentTime
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(tone === 'preview' ? 660 : 520, now); oscillator.frequency.exponentialRampToValueAtTime(tone === 'preview' ? 880 : 390, now + .13)
  gain.gain.setValueAtTime(Math.max(.001, volume * .12), now); gain.gain.exponentialRampToValueAtTime(.001, now + .18)
  oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(now); oscillator.stop(now + .2)
}

export function speakTrainerCue(text: string, volume: number) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text.replace(/[·→]/g, ' ')); utterance.lang = 'en'; utterance.volume = volume; utterance.rate = 1.05; window.speechSynthesis.speak(utterance)
}

export function useRuntimeAudioCue(status: string, paused: boolean, settings: TrainerAudioSettings) {
  const cue = status.replace(/\b\d+(?:\.\d+)?s?\b/g, '').replace(/\s+/g, ' ').trim()
  useEffect(() => {
    if (paused) { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); return }
    if (settings.sounds) playTrainerCue(settings.soundsVolume)
    if (settings.raidlead) speakTrainerCue(cue, settings.raidleadVolume)
  }, [cue, paused, settings.raidlead, settings.raidleadVolume, settings.sounds, settings.soundsVolume])
}

export function setMusicPaused(paused: boolean, settings: TrainerAudioSettings) {
  syncAmbient({ ...settings, music: settings.music && !paused })
}
