import type { MovableActor, MovementBounds } from '../train3d/simulation'
import type { PlayerCommandState } from '../train3d/types'

/** Moves yard-space actors in fixed screen directions at equal rendered-pixel speed. */
export function stepScreenRelativeWorldMovement(
  player: MovableActor,
  commands: PlayerCommandState,
  seconds: number,
  bounds: MovementBounds,
  displayAspectRatio: number,
  verticalWorldSpeed = 7,
  projection = { width: bounds.halfWidth * 2, depth: bounds.halfDepth * 2 },
): MovableActor {
  const horizontal = Number(commands.right) - Number(commands.left)
  const vertical = Number(commands.backward) - Number(commands.forward)
  const magnitude = Math.hypot(horizontal, vertical)
  if (!magnitude) return player

  const horizontalWorldSpeed = verticalWorldSpeed * projection.width / (displayAspectRatio * projection.depth)
  const padding = bounds.padding ?? 1.5
  return {
    ...player,
    x: Math.max(-bounds.halfWidth + padding, Math.min(bounds.halfWidth - padding, player.x + horizontal / magnitude * horizontalWorldSpeed * seconds)),
    z: Math.max(-bounds.halfDepth + padding, Math.min(bounds.halfDepth - padding, player.z + vertical / magnitude * verticalWorldSpeed * seconds)),
  }
}
