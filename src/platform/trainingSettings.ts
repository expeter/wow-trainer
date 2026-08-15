export const TRAINING_SETTINGS_STORAGE_KEY = 'midnight-s2:training-settings:v1'

export type MovementAction = 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight'
export type CombatAction = 'mainAbility' | 'taunt' | 'healthPot' | 'shield'
export type TrainingAction = MovementAction | CombatAction

export interface MovementKeyBindings {
  forward: string
  backward: string
  left: string
  right: string
  turnLeft: string
  turnRight: string
  mainAbility: string
  taunt: string
  healthPot: string
  shield: string
}

export interface TrainingHudSettings {
  showObjective: boolean
  showTimer: boolean
  showPosition: boolean
  showPlayer: boolean
  showAuras: boolean
  showActions: boolean
  showBoss: boolean
  scale: number
  layout: Record<HudBox, HudPoint>
}

export type HudBox = 'objective' | 'player' | 'auras' | 'actions' | 'boss'
export interface HudPoint { x: number; y: number }

export const DEFAULT_HUD_LAYOUT: Record<HudBox, HudPoint> = {
  objective: { x: 50, y: 14 },
  boss: { x: 50, y: 35 },
  auras: { x: 72, y: 55 },
  player: { x: 50, y: 77 },
  actions: { x: 50, y: 91 },
}

export interface TrainingSettings {
  keyBindings: MovementKeyBindings
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
  keyBindings: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', turnLeft: 'KeyQ', turnRight: 'KeyE', mainAbility: 'KeyF', taunt: 'Numpad1', healthPot: 'NumpadDecimal', shield: 'Numpad7' },
  hud: { showObjective: true, showTimer: true, showPosition: true, showPlayer: true, showAuras: true, showActions: true, showBoss: true, scale: 100, layout: DEFAULT_HUD_LAYOUT },
  camera: { invertX: false, invertY: true, sensitivity: 1, zoom: 22 },
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
    ? (['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight', 'mainAbility', 'taunt', 'healthPot', 'shield'] as const).map(action => bindings[action])
    : []
  const validKeys = keys.length === 10 && keys.every(key => typeof key === 'string' && key.length > 0) && new Set(keys).size === 10

  return {
    keyBindings: validKeys ? { ...bindings } as MovementKeyBindings : { ...DEFAULT_TRAINING_SETTINGS.keyBindings },
    hud: {
      showObjective: isBoolean(hud?.showObjective) ? hud.showObjective : DEFAULT_TRAINING_SETTINGS.hud.showObjective,
      showTimer: isBoolean(hud?.showTimer) ? hud.showTimer : DEFAULT_TRAINING_SETTINGS.hud.showTimer,
      showPosition: isBoolean(hud?.showPosition) ? hud.showPosition : DEFAULT_TRAINING_SETTINGS.hud.showPosition,
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
