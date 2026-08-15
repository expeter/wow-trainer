import type { PlayerCommandState, WorldPoint } from './types'

export const FIXED_STEP_SECONDS = 1 / 60
export const WOW_MOVEMENT_PROFILE = {
  unit: 'yard',
  runSpeed: 7,
  backwardSpeed: 4.5,
  strafeSpeed: 7,
  keyboardTurnRadiansPerSecond: 2.35,
} as const

export interface MovableActor extends WorldPoint {
  facing: number
}

export interface MovementBounds {
  halfWidth: number
  halfDepth: number
  padding?: number
}

export function stepPlayerMovement(
  player: MovableActor,
  commands: PlayerCommandState,
  seconds: number,
  bounds: MovementBounds,
  profile = WOW_MOVEMENT_PROFILE,
): MovableActor {
  const turn = Number(commands.turnRight) - Number(commands.turnLeft)
  const facing = player.facing + turn * profile.keyboardTurnRadiansPerSecond * seconds
  const forwardVelocity = commands.forward ? profile.runSpeed : commands.backward ? -profile.backwardSpeed : 0
  const strafeVelocity = (Number(commands.right) - Number(commands.left)) * profile.strafeSpeed
  const localMagnitude = Math.hypot(forwardVelocity, strafeVelocity)
  const diagonalScale = localMagnitude > profile.runSpeed ? profile.runSpeed / localMagnitude : 1
  const dx = (Math.sin(facing) * forwardVelocity + Math.cos(facing) * strafeVelocity) * diagonalScale
  const dz = (-Math.cos(facing) * forwardVelocity + Math.sin(facing) * strafeVelocity) * diagonalScale
  const padding = bounds.padding ?? 1.5

  return {
    x: Math.max(-bounds.halfWidth + padding, Math.min(bounds.halfWidth - padding, player.x + dx * seconds)),
    z: Math.max(-bounds.halfDepth + padding, Math.min(bounds.halfDepth - padding, player.z + dz * seconds)),
    facing,
  }
}

export function distance(a: WorldPoint, b: WorldPoint) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

export function fixedStepCount(elapsedSeconds: number, stepSeconds = FIXED_STEP_SECONDS) {
  return Math.floor((elapsedSeconds + 1e-9) / stepSeconds)
}
