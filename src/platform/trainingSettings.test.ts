import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TRAINING_SETTINGS,
  TRAINING_SETTINGS_STORAGE_KEY,
  keyLabel,
  loadTrainingSettings,
  normalizeTrainingSettings,
  saveTrainingSettings,
  shouldEndTrainingAttempt,
} from './trainingSettings'

describe('shared Season 2 training settings', () => {
  it('repairs only malformed or duplicate bindings without discarding valid custom keys', () => {
    expect(normalizeTrainingSettings({ keyBindings: { forward: 'ArrowUp', backward: 'ArrowUp', left: 'KeyZ', right: 'KeyD' } }).keyBindings)
      .toMatchObject({ forward: 'ArrowUp', backward: 'KeyS', left: 'KeyZ', right: 'KeyD', turnLeft: 'KeyQ', turnRight: 'KeyE' })
  })

  it('adds the pause binding without discarding an older Season 2 custom binding', () => {
    const legacy = { ...DEFAULT_TRAINING_SETTINGS.keyBindings, forward: 'ArrowUp' } as Partial<typeof DEFAULT_TRAINING_SETTINGS.keyBindings>
    delete legacy.pause
    expect(normalizeTrainingSettings({ keyBindings: legacy }).keyBindings).toMatchObject({ forward: 'ArrowUp', pause: 'KeyP' })
  })

  it('adds and persists the encounter Dispel binding during settings migration', () => {
    const legacy = { ...DEFAULT_TRAINING_SETTINGS.keyBindings } as Partial<typeof DEFAULT_TRAINING_SETTINGS.keyBindings>
    delete legacy.dispel
    expect(normalizeTrainingSettings({ keyBindings: legacy }).keyBindings.dispel).toBe('KeyR')
  })

  it('adds the encounter Interrupt binding without resetting older custom keys', () => {
    const legacy = { ...DEFAULT_TRAINING_SETTINGS.keyBindings, forward: 'ArrowUp' } as Partial<typeof DEFAULT_TRAINING_SETTINGS.keyBindings>
    delete legacy.interrupt
    expect(normalizeTrainingSettings({ keyBindings: legacy }).keyBindings).toMatchObject({ forward: 'ArrowUp', interrupt: 'KeyT' })
  })

  it('uses the reviewed WoW movement defaults', () => {
    expect(DEFAULT_TRAINING_SETTINGS.keyBindings).toMatchObject({
      forward: 'KeyW', backward: 'KeyS', turnLeft: 'KeyQ', turnRight: 'KeyE', left: 'KeyA', right: 'KeyD',
    })
  })

  it('keeps trainer difficulty independent and migrates unknown values to Normal', () => {
    expect(normalizeTrainingSettings({ difficulty: 'test' }).difficulty).toBe('test')
    expect(normalizeTrainingSettings({ difficulty: 'hard' }).difficulty).toBe('hard')
    expect(normalizeTrainingSettings({ difficulty: 'heroic' }).difficulty).toBe('normal')
  })

  it('applies one shared Test, Easy, Normal, and Hard failure-tolerance contract', () => {
    expect(shouldEndTrainingAttempt('test', 99, true)).toBe(false)
    expect(shouldEndTrainingAttempt('easy', 99, false)).toBe(false)
    expect(shouldEndTrainingAttempt('easy', 1, true)).toBe(true)
    expect(shouldEndTrainingAttempt('normal', 1, false)).toBe(false)
    expect(shouldEndTrainingAttempt('normal', 2, false)).toBe(true)
    expect(shouldEndTrainingAttempt('hard', 1, false)).toBe(true)
  })

  it('round-trips shell settings through the isolated Season 2 storage key', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const settings = { ...DEFAULT_TRAINING_SETTINGS, hud: { ...DEFAULT_TRAINING_SETTINGS.hud, scale: 115, showBoss: false } }
    saveTrainingSettings(settings, storage)

    expect(values.has(TRAINING_SETTINGS_STORAGE_KEY)).toBe(true)
    expect(loadTrainingSettings(storage)).toEqual(settings)
  })

  it('renders readable labels for keyboard codes', () => {
    expect(keyLabel('KeyW')).toBe('W')
    expect(keyLabel('Digit4')).toBe('4')
    expect(keyLabel('ArrowUp')).toBe('ArrowUp')
  })
})
