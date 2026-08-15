import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TRAINING_SETTINGS,
  TRAINING_SETTINGS_STORAGE_KEY,
  keyLabel,
  loadTrainingSettings,
  normalizeTrainingSettings,
  saveTrainingSettings,
} from './trainingSettings'

describe('shared Season 2 training settings', () => {
  it('normalizes malformed or duplicate bindings back to the safe defaults', () => {
    expect(normalizeTrainingSettings({ keyBindings: { forward: 'KeyW', backward: 'KeyW', left: 'KeyA', right: 'KeyD' } }).keyBindings)
      .toEqual(DEFAULT_TRAINING_SETTINGS.keyBindings)
  })

  it('round-trips shell settings through the isolated Season 2 storage key', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const settings = { ...DEFAULT_TRAINING_SETTINGS, hud: { ...DEFAULT_TRAINING_SETTINGS.hud, scale: 115, showTimer: false } }
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
