import type { WorldPoint } from './train3d/types'

export interface MainActionState {
  mainCastRemaining: number
  mainTargetId?: string
  mainProjectileFiredAt?: number
  mainProjectileOrigin?: WorldPoint
  mainProjectileTarget?: WorldPoint
  mainProjectileOrdinal: number
  time: number
  player: WorldPoint
}

export function beginMainAction<T extends MainActionState>(state: T, targetId: string | undefined, duration = 1): T {
  if (state.mainCastRemaining > 0 || !targetId) return state
  return { ...state, mainCastRemaining: duration, mainTargetId: targetId }
}

export function advanceMainAction<T extends MainActionState>(state: T, seconds: number): { state: T; completedTargetId?: string } {
  if (state.mainCastRemaining <= 0) return { state }
  const remaining = Math.max(0, state.mainCastRemaining - seconds)
  if (remaining > 0) return { state: { ...state, mainCastRemaining: remaining } }
  return { state: { ...state, mainCastRemaining: 0, mainTargetId: undefined }, completedTargetId: state.mainTargetId }
}

export function publishMainProjectile<T extends MainActionState>(state: T, target: WorldPoint): T {
  return { ...state, mainProjectileFiredAt: state.time, mainProjectileOrigin: state.player, mainProjectileTarget: target, mainProjectileOrdinal: state.mainProjectileOrdinal + 1 }
}
