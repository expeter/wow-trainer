import { describe, expect, it } from 'vitest'
import { activeEncounterActions, advanceEncounterTimeline, beginEncounterAction, coreEncounterEntities, createEncounterTimeline } from './timeline'

describe('encounter entity timeline', () => {
  it('keeps independent entity tracks on one deterministic clock', () => {
    const entities = coreEncounterEntities('player', ['player', 'healer-1'], ['boss'], 'arena')
    let timeline = createEncounterTimeline(entities)
    timeline = beginEncounterAction(timeline, { id: 'player', kind: 'controlled-player' }, 'main', 1, 'boss')
    timeline = beginEncounterAction(timeline, { id: 'boss', kind: 'enemy' }, 'cast', 2, 'player')
    timeline = advanceEncounterTimeline(timeline, .5)

    expect(new Set(timeline.entities.map(entity => entity.kind))).toEqual(new Set(['controlled-player', 'raid-npc', 'enemy', 'arena']))
    expect(activeEncounterActions(timeline).map(action => action.kind)).toEqual(['main', 'cast'])
    expect(timeline.time).toBe(.5)
  })

  it('registers dynamically spawned entities without disturbing existing tracks', () => {
    let timeline = createEncounterTimeline(coreEncounterEntities('player', [], ['boss'], 'arena'))
    timeline = beginEncounterAction(timeline, { id: 'spawned-add', kind: 'enemy' }, 'advance', 4, 'arena')
    expect(timeline.entities.find(entity => entity.id === 'spawned-add')?.actions[0].targetId).toBe('arena')
  })
})
