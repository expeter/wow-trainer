import { trainingClassColors } from '../contractRoom'
import { COMBAT_PROJECTILE_IMPACT_SECONDS, combatProjectileImpactPoint, combatProjectileShape, combatProjectileTravelSeconds, npcProjectileShots } from '../../projectiles'
import type { TrainingClass } from '../contractRoom'
import type { ActorSnapshot, EffectSnapshot, WorldPoint } from './types'

type CombatTarget = WorldPoint | ((actor: ActorSnapshot, index: number) => WorldPoint)

export function classProjectileEffects(id: string, origin: WorldPoint, target: WorldPoint, playerClass: TrainingClass, age: number, shotOrdinal = 0, scale = 1): readonly EffectSnapshot[] {
  const shape = combatProjectileShape(playerClass, shotOrdinal)
  const travelSeconds = combatProjectileTravelSeconds(shape)
  const from = { x: origin.x, y: origin.z }
  const centre = { x: target.x, y: target.z }
  const impact = combatProjectileImpactPoint(from, centre, .9 * scale, shotOrdinal)
  const piercedTarget = combatProjectileImpactPoint(from, centre, .12 * scale, shotOrdinal)
  if (age < travelSeconds) return [{
    id: `${id}-${shotOrdinal}-${shape}`,
    kind: 'cosmetic-projectile',
    position: origin,
    target: { x: piercedTarget.x, z: piercedTarget.y },
    radius: .3 * scale,
    color: trainingClassColors[playerClass],
    progress: Math.max(0, age / travelSeconds),
    projectileShape: shape,
    originHeight: 1.45,
    targetHeight: 2.7,
  }]
  const impactAge = age - travelSeconds
  if (impactAge > COMBAT_PROJECTILE_IMPACT_SECONDS) return []
  return [{
    id: `${id}-${shotOrdinal}-${shape}-impact`,
    kind: 'projectile-impact',
    position: { x: impact.x, z: impact.y },
    radius: (shape === 'arrow' || shape === 'spear' ? .55 : 1.1) * scale,
    color: trainingClassColors[playerClass],
    progress: impactAge / COMBAT_PROJECTILE_IMPACT_SECONDS,
    originHeight: 2.7,
    targetHeight: 2.7,
  }]
}

/** Ambient raid casts are visual-only and never feed back into simulation. */
export function cosmeticClassProjectiles(actors: readonly ActorSnapshot[], target: CombatTarget, time: number): readonly EffectSnapshot[] {
  const casters = actors.filter(actor => actor.kind === 'ally' && actor.playerClass)
  const cadenceTime = time * 1.45
  return npcProjectileShots(cadenceTime, casters.length).flatMap(shot => {
    const actor = casters[shot.npcOrdinal]
    const resolvedTarget = typeof target === 'function' ? target(actor, shot.npcOrdinal) : target
    return classProjectileEffects(`cosmetic-class-cast-${actor.id}`, actor.position, resolvedTarget, actor.playerClass!, shot.age, shot.shotOrdinal, .72 + shot.npcOrdinal % 3 * .08)
  })
}
