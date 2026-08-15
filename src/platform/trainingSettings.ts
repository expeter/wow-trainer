export const TRAINING_SETTINGS_STORAGE_KEY = 'midnight-s2-training-settings-v1'

export type MovementAction = 'forward' | 'backward' | 'left' | 'right'

export interface MovementKeyBindings {
  forward: string
  backward: string
  left: string
  right: string
}

export interface TrainingHudSettings {
  showObjective: boolean
  showTimer: boolean
  showPosition: boolean
  scale: number
}

export interface TrainingSettings {
  keyBindings: MovementKeyBindings
  hud: TrainingHudSettings
}

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  keyBindings: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD' },
  hud: { showObjective: true, showTimer: true, showPosition: true, scale: 100 },
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function normalizeTrainingSettings(value: unknown): TrainingSettings {
  if (!value || typeof value !== 'object') return DEFAULT_TRAINING_SETTINGS
  const candidate = value as Partial<TrainingSettings>
  const bindings = candidate.keyBindings
  const hud = candidate.hud
  const keys = bindings && typeof bindings === 'object'
    ? (['forward', 'backward', 'left', 'right'] as const).map(action => bindings[action])
    : []
  const validKeys = keys.length === 4 && keys.every(key => typeof key === 'string' && key.length > 0) && new Set(keys).size === 4

  return {
    keyBindings: validKeys ? { ...bindings } as MovementKeyBindings : { ...DEFAULT_TRAINING_SETTINGS.keyBindings },
    hud: {
      showObjective: isBoolean(hud?.showObjective) ? hud.showObjective : DEFAULT_TRAINING_SETTINGS.hud.showObjective,
      showTimer: isBoolean(hud?.showTimer) ? hud.showTimer : DEFAULT_TRAINING_SETTINGS.hud.showTimer,
      showPosition: isBoolean(hud?.showPosition) ? hud.showPosition : DEFAULT_TRAINING_SETTINGS.hud.showPosition,
      scale: typeof hud?.scale === 'number' && hud.scale >= 80 && hud.scale <= 130
        ? hud.scale
        : DEFAULT_TRAINING_SETTINGS.hud.scale,
    },
  }
}

export function loadTrainingSettings(storage: Pick<Storage, 'getItem'> = localStorage): TrainingSettings {
  try {
    return normalizeTrainingSettings(JSON.parse(storage.getItem(TRAINING_SETTINGS_STORAGE_KEY) || 'null'))
  } catch {
    return DEFAULT_TRAINING_SETTINGS
  }
}

export function saveTrainingSettings(settings: TrainingSettings, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(TRAINING_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function keyLabel(code: string) {
  if (code === 'Space') return 'Space'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}
