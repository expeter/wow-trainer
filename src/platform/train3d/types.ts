import type { WorldArena3D } from '../encounters'
import type { TrainingClass } from '../contractRoom'

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
}

export interface ActorSnapshot {
  id: string
  kind: 'player' | 'boss' | 'ally'
  position: WorldPoint
  facing: number
  color: string
  playerClass?: TrainingClass
  auras: readonly AuraSnapshot[]
  health?: number
}

export interface EffectSnapshot {
  id: string
  kind: 'pulse' | 'projectile'
  position: WorldPoint
  target?: WorldPoint
  radius: number
  color: string
  progress: number
}

export interface Train3DSnapshot {
  time: number
  arena: WorldArena3D
  actors: readonly ActorSnapshot[]
  effects: readonly EffectSnapshot[]
}

export const IDLE_PLAYER_COMMANDS: PlayerCommandState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  turnLeft: false,
  turnRight: false,
}
