import type { WorldArena3D } from '../encounters'
import type { TrainingClass } from '../contractRoom'
import type { RaidRole } from '../contractRoom'
import type { CombatProjectileShape } from '../../projectiles'
import type { EncounterTimelineState } from '../encounters/timeline'

export interface WorldPoint {
  x: number
  z: number
}

export interface PlayerCommandState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  turnLeft: boolean
  turnRight: boolean
}

export type AuraTone = 'beneficial' | 'poison' | 'danger' | 'spectral'

export interface AuraSnapshot {
  id: string
  tone: AuraTone
  stacks: number
  label?: string
  expiresAt?: number
}

export interface ActorSnapshot {
  id: string
  kind: 'player' | 'boss' | 'ally' | 'enemy'
  position: WorldPoint
  facing: number
  color: string
  playerClass?: TrainingClass
  role?: RaidRole
  auras: readonly AuraSnapshot[]
  health?: number
}

export interface EffectSnapshot {
  id: string
  /** Player-facing meaning for accessible and contextual coaching. */
  label?: string
  intent?: 'avoid' | 'soak' | 'objective' | 'path'
  kind: 'pulse' | 'projectile' | 'cosmetic-projectile' | 'projectile-impact' | 'ground-harmful' | 'ground-soak' | 'ground-spread' | 'ground-objective' | 'lane' | 'arrow' | 'dome'
  position: WorldPoint
  target?: WorldPoint
  radius: number
  color: string
  progress: number
  filled?: boolean
  rotation?: number
  projectileShape?: CombatProjectileShape
  originHeight?: number
  targetHeight?: number
  /** Stable actor attachment. Rendering resolves the live actor position. */
  ownerId?: string
}

export type WorldMarkerKind = 'star' | 'cross' | 'diamond' | 'circle'
export interface WorldMarkerSnapshot {
  id: string
  kind: WorldMarkerKind
  label: string
  position: WorldPoint
  color: string
}

export interface Train3DSnapshot {
  time: number
  timeline: EncounterTimelineState
  arena: WorldArena3D
  actors: readonly ActorSnapshot[]
  effects: readonly EffectSnapshot[]
  markers?: readonly WorldMarkerSnapshot[]
}

export const IDLE_PLAYER_COMMANDS: PlayerCommandState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  turnLeft: false,
  turnRight: false,
}
