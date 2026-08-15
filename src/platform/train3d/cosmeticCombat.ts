import { trainingClassColors } from '../contractRoom'
import type { ActorSnapshot, EffectSnapshot, WorldPoint } from './types'

/** Ambient raid casts are visual-only and never feed back into simulation. */
export function cosmeticClassProjectiles(actors: readonly ActorSnapshot[], target: WorldPoint, time: number): readonly EffectSnapshot[] {
  const casters = actors.filter(actor => actor.kind === 'ally' && actor.playerClass)
  return casters.map((actor, index) => ({
    id: `cosmetic-class-cast-${actor.id}`,
    kind: 'cosmetic-projectile' as const,
    position: actor.position,
    target,
    radius: .18 + index % 3 * .035,
    color: trainingClassColors[actor.playerClass!],
    progress: (time * .72 + index / Math.max(1, casters.length)) % 1,
  }))
}
