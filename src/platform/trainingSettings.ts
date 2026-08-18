export const TRAINING_SETTINGS_STORAGE_KEY = 'midnight-s2:training-settings:v1'

export type MovementAction = 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight' | 'jump'
export type Learn2DMovementAction = 'forward' | 'backward' | 'left' | 'right'
export type CombatAction = 'mainAbility' | 'taunt' | 'healthPot' | 'shield' | 'dispel' | 'interrupt'
export type SystemAction = 'pause'
export type TrainingAction = MovementAction | CombatAction | SystemAction
export type SharedTrainingAction = CombatAction | SystemAction
export type TrainingBindingScope = 'learn2d' | 'train3d' | 'shared'
export type TrainingDifficulty = 'test' | 'easy' | 'normal' | 'hard'

export function shouldEndTrainingAttempt(difficulty: TrainingDifficulty, mistakes: number, encounterFailure: boolean) {
  if (difficulty === 'test') return false
  if (encounterFailure) return true
  if (difficulty === 'hard') return mistakes >= 1
  return difficulty === 'normal' && mistakes >= 2
}

export interface MovementKeyBindings {
  forward: string
  backward: string
  left: string
  right: string
  turnLeft: string
  turnRight: string
  jump: string
  pause: string
  mainAbility: string
  taunt: string
  healthPot: string
  shield: string
  dispel: string
  interrupt: string
}

export type Learn2DMovementKeyBindings = Pick<MovementKeyBindings, Learn2DMovementAction>
export type Train3DMovementKeyBindings = Pick<MovementKeyBindings, MovementAction>
export type SharedTrainingKeyBindings = Pick<MovementKeyBindings, SharedTrainingAction>

export interface TrainingKeyBindings {
  learn2d: Learn2DMovementKeyBindings
  train3d: Train3DMovementKeyBindings
  shared: SharedTrainingKeyBindings
}

export interface TrainingHudSettings {
  showPlayer: boolean
  showAuras: boolean
  showActions: boolean
  showBoss: boolean
  scale: number
  layout: Record<HudBox, HudPoint>
}

export type HudBox = 'objective' | 'player' | 'auras' | 'actions' | 'boss' | 'castbar'
export interface HudPoint { x: number; y: number }

export const DEFAULT_HUD_LAYOUT: Record<HudBox, HudPoint> = {
  objective: { x: 50, y: 18 },
  player: { x: 21, y: 53 },
  auras: { x: 21, y: 65 },
  boss: { x: 79, y: 53 },
  castbar: { x: 50, y: 65 },
  actions: { x: 50, y: 73 },
}

export interface TrainingSettings {
  difficulty: TrainingDifficulty
  keyBindings: TrainingKeyBindings
  hud: TrainingHudSettings
  camera: TrainingCameraSettings
}

export interface TrainingCameraSettings {
  invertX: boolean
  invertY: boolean
  sensitivity: number
  zoom: number
}

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  difficulty: 'normal',
  keyBindings: {
    learn2d: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD' },
    train3d: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', turnLeft: 'KeyQ', turnRight: 'KeyE', jump: 'Space' },
    shared: { pause: 'KeyP', mainAbility: 'KeyF', taunt: 'Numpad1', healthPot: 'NumpadDecimal', shield: 'Numpad7', dispel: 'KeyR', interrupt: 'KeyT' },
  },
  hud: { showPlayer: true, showAuras: true, showActions: true, showBoss: true, scale: 100, layout: DEFAULT_HUD_LAYOUT },
  camera: { invertX: false, invertY: true, sensitivity: 1, zoom: 22 },
}

const learn2dMovementActions = ['forward', 'backward', 'left', 'right'] as const
const train3dMovementActions = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight', 'jump'] as const
const sharedActions = ['pause', 'mainAbility', 'taunt', 'healthPot', 'shield', 'dispel', 'interrupt'] as const
const fallbackCodes = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'KeyP', 'KeyF', 'Numpad1', 'NumpadDecimal', 'Numpad7', 'KeyR', 'KeyT', 'KeyG', 'KeyH'] as const

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function normalizeTrainingSettings(value: unknown): TrainingSettings {
  if (!value || typeof value !== 'object') return DEFAULT_TRAINING_SETTINGS
  const candidate = value as Partial<TrainingSettings>
  const bindings = candidate.keyBindings as unknown as (Partial<TrainingKeyBindings> & Partial<MovementKeyBindings>) | undefined
  const hud = candidate.hud
  const legacyBindings = typeof bindings?.forward === 'string' ? bindings as Partial<MovementKeyBindings> : undefined
  const normalizeBindings = <T extends TrainingAction>(actions: readonly T[], source: Partial<Record<T, string>> | undefined, defaults: Record<T, string>, reserved = new Set<string>()) => {
    const usedCodes = new Set(reserved)
    const result = {} as Record<T, string>
    for (const action of actions) {
      const candidates = [source?.[action], defaults[action], ...fallbackCodes]
      const code = candidates.find(candidate => typeof candidate === 'string' && candidate.length > 0 && !usedCodes.has(candidate))!
      result[action] = code
      usedCodes.add(code)
    }
    return result
  }
  const shared = normalizeBindings(sharedActions, bindings?.shared ?? legacyBindings, DEFAULT_TRAINING_SETTINGS.keyBindings.shared)
  const reserved = new Set(Object.values(shared))
  const learn2d = normalizeBindings(learn2dMovementActions, bindings?.learn2d ?? legacyBindings, DEFAULT_TRAINING_SETTINGS.keyBindings.learn2d, reserved)
  const train3d = normalizeBindings(train3dMovementActions, bindings?.train3d ?? legacyBindings, DEFAULT_TRAINING_SETTINGS.keyBindings.train3d, reserved)

  return {
    difficulty: candidate.difficulty === 'test' || candidate.difficulty === 'easy' || candidate.difficulty === 'hard' ? candidate.difficulty : 'normal',
    keyBindings: { learn2d, train3d, shared },
    hud: {
      showPlayer: isBoolean(hud?.showPlayer) ? hud.showPlayer : DEFAULT_TRAINING_SETTINGS.hud.showPlayer,
      showAuras: isBoolean(hud?.showAuras) ? hud.showAuras : DEFAULT_TRAINING_SETTINGS.hud.showAuras,
      showActions: isBoolean(hud?.showActions) ? hud.showActions : DEFAULT_TRAINING_SETTINGS.hud.showActions,
      showBoss: isBoolean(hud?.showBoss) ? hud.showBoss : DEFAULT_TRAINING_SETTINGS.hud.showBoss,
      scale: typeof hud?.scale === 'number' && hud.scale >= 80 && hud.scale <= 130
        ? hud.scale
        : DEFAULT_TRAINING_SETTINGS.hud.scale,
      layout: Object.fromEntries((Object.keys(DEFAULT_HUD_LAYOUT) as HudBox[]).map(box => {
        const point = hud?.layout?.[box]
        return [box, point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 5 && point.x <= 95 && point.y >= 5 && point.y <= 95
          ? { x: point.x, y: point.y }
          : { ...DEFAULT_HUD_LAYOUT[box] }]
      })) as Record<HudBox, HudPoint>,
    },
    camera: {
      invertX: isBoolean(candidate.camera?.invertX) ? candidate.camera.invertX : DEFAULT_TRAINING_SETTINGS.camera.invertX,
      invertY: isBoolean(candidate.camera?.invertY) ? candidate.camera.invertY : DEFAULT_TRAINING_SETTINGS.camera.invertY,
      sensitivity: typeof candidate.camera?.sensitivity === 'number' && candidate.camera.sensitivity >= 0.5 && candidate.camera.sensitivity <= 2
        ? candidate.camera.sensitivity
        : DEFAULT_TRAINING_SETTINGS.camera.sensitivity,
      zoom: typeof candidate.camera?.zoom === 'number' && candidate.camera.zoom >= 10 && candidate.camera.zoom <= 38
        ? candidate.camera.zoom
        : DEFAULT_TRAINING_SETTINGS.camera.zoom,
    },
  }
}

export function runtimeKeyBindings(settings: TrainingSettings, mode: 'learn2d' | 'train3d'): MovementKeyBindings {
  return {
    ...settings.keyBindings.train3d,
    ...(mode === 'learn2d' ? settings.keyBindings.learn2d : {}),
    ...settings.keyBindings.shared,
  }
}

export function assignTrainingKeyBinding(
  settings: TrainingSettings,
  scope: TrainingBindingScope,
  action: TrainingAction,
  code: string,
): TrainingSettings {
  const keyBindings: TrainingKeyBindings = {
    learn2d: { ...settings.keyBindings.learn2d },
    train3d: { ...settings.keyBindings.train3d },
    shared: { ...settings.keyBindings.shared },
  }
  const scoped = keyBindings[scope] as Partial<Record<TrainingAction, string>>
  const previousCode = scoped[action]
  if (!previousCode || previousCode === code) return settings

  const occupiedInScope = Object.entries(scoped).find(([candidate, value]) => candidate !== action && value === code)?.[0] as TrainingAction | undefined
  if (occupiedInScope) scoped[occupiedInScope] = previousCode

  if (scope === 'shared') {
    for (const movementScope of ['learn2d', 'train3d'] as const) {
      const movement = keyBindings[movementScope] as Partial<Record<TrainingAction, string>>
      const occupied = Object.entries(movement).find(([, value]) => value === code)?.[0] as TrainingAction | undefined
      if (occupied) movement[occupied] = previousCode
    }
  } else {
    const occupiedShared = Object.entries(keyBindings.shared).find(([, value]) => value === code)?.[0] as SharedTrainingAction | undefined
    if (occupiedShared) {
      keyBindings.shared[occupiedShared] = previousCode
      const otherScope = scope === 'learn2d' ? 'train3d' : 'learn2d'
      const otherMovement = keyBindings[otherScope] as Partial<Record<TrainingAction, string>>
      const occupied = Object.entries(otherMovement).find(([, value]) => value === previousCode)?.[0] as TrainingAction | undefined
      if (occupied) otherMovement[occupied] = code
    }
  }
  scoped[action] = code
  return normalizeTrainingSettings({ ...settings, keyBindings })
}

export function loadTrainingSettings(storage: Pick<Storage, 'getItem'> = localStorage): TrainingSettings {
  try {
    return normalizeTrainingSettings(JSON.parse(storage.getItem(TRAINING_SETTINGS_STORAGE_KEY) || 'null'))
  } catch {
    return DEFAULT_TRAINING_SETTINGS
  }
}

export function saveTrainingSettings(settings: TrainingSettings, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(TRAINING_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // A private or quota-limited browser may reject storage. Keep the live
    // settings usable without turning a preference change into a runtime crash.
  }
}

export function keyLabel(code: string) {
  if (code === 'Space') return 'Space'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}
