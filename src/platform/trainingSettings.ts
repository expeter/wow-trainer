export const TRAINING_SETTINGS_STORAGE_KEY = 'midnight-s2:training-settings:v1'

export type MovementAction = 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight'
export type CombatAction = 'mainAbility' | 'taunt' | 'healthPot' | 'shield'
export type SystemAction = 'pause'
export type TrainingAction = MovementAction | CombatAction | SystemAction

export interface MovementKeyBindings {
  forward: string
  backward: string
  left: string
  right: string
  turnLeft: string
  turnRight: string
  pause: string
  mainAbility: string
  taunt: string
  healthPot: string
  shield: string
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
  keyBindings: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', turnLeft: 'KeyQ', turnRight: 'KeyE', pause: 'KeyP', mainAbility: 'KeyF', taunt: 'Numpad1', healthPot: 'NumpadDecimal', shield: 'Numpad7' },
  hud: { showPlayer: true, showAuras: true, showActions: true, showBoss: true, scale: 100, layout: DEFAULT_HUD_LAYOUT },
  camera: { invertX: false, invertY: true, sensitivity: 1, zoom: 22 },
}

const bindingActions = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight', 'pause', 'mainAbility', 'taunt', 'healthPot', 'shield'] as const
const fallbackCodes = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'KeyP', 'KeyF', 'Numpad1', 'NumpadDecimal', 'Numpad7', 'KeyR', 'KeyT', 'KeyG', 'KeyH'] as const

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function normalizeTrainingSettings(value: unknown): TrainingSettings {
  if (!value || typeof value !== 'object') return DEFAULT_TRAINING_SETTINGS
  const candidate = value as Partial<TrainingSettings>
  const bindings = candidate.keyBindings
  const hud = candidate.hud
  const usedCodes = new Set<string>()
  const migratedBindings = {} as MovementKeyBindings
  for (const action of bindingActions) {
    const persisted = bindings?.[action]
    const candidates = [persisted, DEFAULT_TRAINING_SETTINGS.keyBindings[action], ...fallbackCodes]
    const code = candidates.find(candidate => typeof candidate === 'string' && candidate.length > 0 && !usedCodes.has(candidate))!
    migratedBindings[action] = code
    usedCodes.add(code)
  }

  return {
    keyBindings: migratedBindings,
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
