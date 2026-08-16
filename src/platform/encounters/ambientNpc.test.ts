import { describe, expect, it } from 'vitest'
import { ambientNpcPosition } from './ambientNpc'
import { advanceAmbientNpcTimeline } from './ambientNpc'
import { coreEncounterEntities, createEncounterTimeline } from './timeline'

describe('ambient NPC motion', () => {
  it('is seeded, moving, and bounded around formation duty', () => {
    const origin = { x: 12, z: -4 }
    const first = ambientNpcPosition('healer-1', origin, 2, { radius: 1.2 })
    expect(ambientNpcPosition('healer-1', origin, 2, { radius: 1.2 })).toEqual(first)
    expect(ambientNpcPosition('healer-1', origin, 3, { radius: 1.2 })).not.toEqual(first)
    expect(Math.hypot(first.x - origin.x, first.z - origin.z)).toBeLessThanOrEqual(1.7)
  })

  it('always yields to an encounter mechanic position', () => {
    expect(ambientNpcPosition('tank-1', { x: 0, z: 0 }, 99, { mechanicPosition: { x: 40, z: -20 } })).toEqual({ x: 40, z: -20 })
  })

  it('schedules independent seeded class activity on the encounter clock', () => {
    let timeline = createEncounterTimeline(coreEncounterEntities('player', ['player', 'mage-1', 'hunter-1'], ['boss'], 'arena'))
    for (let index = 0; index < 20; index += 1) timeline = advanceAmbientNpcTimeline(timeline, .25, 'boss')
    expect(timeline.entities.filter(entity => entity.kind === 'raid-npc').every(entity => entity.actions.some(action => action.kind === 'class-cast' && action.targetId === 'boss'))).toBe(true)
  })
})
