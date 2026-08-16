import type { WorldPoint } from '../train3d/types'
import { advanceEncounterTimeline, beginEncounterAction, type EncounterTimelineState } from './timeline'

export interface AmbientNpcMotionOptions {
  radius?: number
  speed?: number
  mechanicPosition?: WorldPoint
}

function seededUnit(id: string, salt: number) {
  let hash = 2166136261 ^ salt
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return (hash >>> 0) / 4294967295
}

/** Deterministic idle motion. Supplying a mechanic position is an unconditional override. */
export function ambientNpcPosition(id: string, origin: WorldPoint, time: number, options: AmbientNpcMotionOptions = {}): WorldPoint {
  if (options.mechanicPosition) return { ...options.mechanicPosition }
  const radius = options.radius ?? .75
  const speed = options.speed ?? .38
  const phase = seededUnit(id, 17) * Math.PI * 2
  const secondary = seededUnit(id, 53) * Math.PI * 2
  const x = Math.sin(time * speed + phase) * .68 + Math.sin(time * speed * .43 + secondary) * .32
  const z = Math.cos(time * speed * .79 + phase) * .72 + Math.sin(time * speed * .37 + secondary) * .28
  return { x: origin.x + x * radius, z: origin.z + z * radius }
}

export function advanceAmbientNpcTimeline(timeline: EncounterTimelineState, seconds: number, targetId: string): EncounterTimelineState {
  const previousTime = timeline.time
  let next = advanceEncounterTimeline(timeline, seconds)
  for (const entity of next.entities.filter(candidate => candidate.kind === 'raid-npc')) {
    const interval = 2.6 + seededUnit(entity.id, 91) * 1.8
    const phase = seededUnit(entity.id, 117) * interval
    if (Math.floor((previousTime + phase) / interval) !== Math.floor((next.time + phase) / interval)) {
      next = beginEncounterAction(next, entity, 'class-cast', .9, targetId)
    }
  }
  return next
}
