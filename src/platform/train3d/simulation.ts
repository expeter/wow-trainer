import type { PlayerCommandState, WorldPoint } from './types'

export const FIXED_STEP_SECONDS = 1 / 60

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
  speed = 16,
  turnSpeed = 2.35,
): MovableActor {
  const turn = Number(commands.turnRight) - Number(commands.turnLeft)
  const facing = player.facing + turn * turnSpeed * seconds
  const forward = Number(commands.forward) - Number(commands.backward)
  const strafe = Number(commands.right) - Number(commands.left)
  const length = Math.hypot(forward, strafe) || 1
  const normalizedForward = forward / length
  const normalizedStrafe = strafe / length
  const dx = Math.sin(facing) * normalizedForward + Math.cos(facing) * normalizedStrafe
  const dz = -Math.cos(facing) * normalizedForward + Math.sin(facing) * normalizedStrafe
  const padding = bounds.padding ?? 1.5

  return {
    x: Math.max(-bounds.halfWidth + padding, Math.min(bounds.halfWidth - padding, player.x + dx * speed * seconds)),
    z: Math.max(-bounds.halfDepth + padding, Math.min(bounds.halfDepth - padding, player.z + dz * speed * seconds)),
    facing,
  }
}

export function distance(a: WorldPoint, b: WorldPoint) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

export function fixedStepCount(elapsedSeconds: number, stepSeconds = FIXED_STEP_SECONDS) {
  return Math.floor((elapsedSeconds + 1e-9) / stepSeconds)
}
