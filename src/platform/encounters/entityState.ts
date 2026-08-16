import type { ActorSnapshot, EffectSnapshot, WorldPoint } from '../train3d/types'

export interface EntityMotionState {
  position: WorldPoint
}

export interface CircularExclusion {
  centre: WorldPoint
  radius: number
}

export interface MotionBounds {
  halfWidth: number
  halfDepth: number
}

export interface EntityMotionOptions {
  speed: number
  bounds?: MotionBounds
  exclusions?: readonly CircularExclusion[]
}

function clamp(point: WorldPoint, bounds?: MotionBounds): WorldPoint {
  if (!bounds) return point
  return {
    x: Math.max(-bounds.halfWidth, Math.min(bounds.halfWidth, point.x)),
    z: Math.max(-bounds.halfDepth, Math.min(bounds.halfDepth, point.z)),
  }
}

function segmentDistance(point: WorldPoint, start: WorldPoint, end: WorldPoint) {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  const amount = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared))
    : 0
  return Math.hypot(point.x - (start.x + dx * amount), point.z - (start.z + dz * amount))
}

function routeTarget(position: WorldPoint, destination: WorldPoint, exclusions: readonly CircularExclusion[]) {
  for (const exclusion of exclusions) {
    const startRadius = Math.hypot(position.x - exclusion.centre.x, position.z - exclusion.centre.z)
    const endRadius = Math.hypot(destination.x - exclusion.centre.x, destination.z - exclusion.centre.z)
    if (startRadius <= exclusion.radius || endRadius <= exclusion.radius || segmentDistance(exclusion.centre, position, destination) >= exclusion.radius) continue
    const angle = Math.atan2(position.z - exclusion.centre.z, position.x - exclusion.centre.x)
    const destinationAngle = Math.atan2(destination.z - exclusion.centre.z, destination.x - exclusion.centre.x)
    const direction = Math.sin(destinationAngle - angle) >= 0 ? 1 : -1
    const waypointAngle = angle + direction * .42
    const radius = exclusion.radius + 1.5
    return { x: exclusion.centre.x + Math.cos(waypointAngle) * radius, z: exclusion.centre.z + Math.sin(waypointAngle) * radius }
  }
  return destination
}

/** Advances a persistent actor position toward intent without renderer-owned interpolation. */
export function advanceEntityMotion(position: WorldPoint, destination: WorldPoint, seconds: number, options: EntityMotionOptions): WorldPoint {
  const target = routeTarget(position, clamp(destination, options.bounds), options.exclusions ?? [])
  const dx = target.x - position.x
  const dz = target.z - position.z
  const distance = Math.hypot(dx, dz)
  const step = Math.max(0, options.speed * seconds)
  if (!distance || distance <= step) return clamp({ ...target }, options.bounds)
  return clamp({ x: position.x + dx / distance * step, z: position.z + dz / distance * step }, options.bounds)
}

export function advanceEntityMotions(
  positions: Readonly<Record<string, WorldPoint>>,
  destinations: Readonly<Record<string, WorldPoint>>,
  seconds: number,
  options: EntityMotionOptions | ((id: string) => EntityMotionOptions),
): Record<string, WorldPoint> {
  return Object.fromEntries(Object.entries(positions).map(([id, position]) => {
    const destination = destinations[id] ?? position
    return [id, advanceEntityMotion(position, destination, seconds, typeof options === 'function' ? options(id) : options)]
  }))
}

/** Resolves actor-bound visuals late so they cannot drift away from their owner. */
export function resolveAttachedEffect(effect: EffectSnapshot, actors: readonly ActorSnapshot[]): EffectSnapshot {
  if (!effect.ownerId) return effect
  const owner = actors.find(actor => actor.id === effect.ownerId)
  return owner ? { ...effect, position: owner.position } : effect
}

export function resolveAttachedEffects(effects: readonly EffectSnapshot[], actors: readonly ActorSnapshot[]): readonly EffectSnapshot[] {
  return effects.map(effect => resolveAttachedEffect(effect, actors))
}
