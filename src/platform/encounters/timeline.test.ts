import { describe, expect, it } from 'vitest'
import { activeEncounterActions, activeEncounterMechanics, advanceEncounterTimeline, applyEncounterMechanic, beginEncounterAction, coreEncounterEntities, createEncounterTimeline, removeEncounterMechanic, setEncounterMovementIntent } from './timeline'

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

  it('owns timed mechanics, removal reasons, and movement intent per entity', () => {
    let timeline = createEncounterTimeline(coreEncounterEntities('player', ['npc'], ['boss'], 'arena'))
    timeline = applyEncounterMechanic(timeline, { id: 'npc', kind: 'raid-npc' }, { id: 'pool', kind: 'delayed-drop', sourceId: 'boss', expiresAt: 6, stacks: 1 })
    timeline = setEncounterMovementIntent(timeline, 'npc', { x: 20, z: -4 }, 7)
    expect(activeEncounterMechanics(timeline, 'npc')[0]).toMatchObject({ id: 'pool', sourceId: 'boss', stacks: 1 })
    expect(timeline.entities.find(entity => entity.id === 'npc')?.movement).toMatchObject({ destination: { x: 20, z: -4 }, maxSpeed: 7 })
    timeline = removeEncounterMechanic(timeline, 'npc', 'pool', 'dispel')
    expect(activeEncounterMechanics(timeline, 'npc')).toHaveLength(0)
    expect(timeline.entities.find(entity => entity.id === 'npc')?.mechanics[0]).toMatchObject({ removalReason: 'dispel' })
  })

  it('registers dynamically spawned entities without disturbing existing tracks', () => {
    let timeline = createEncounterTimeline(coreEncounterEntities('player', [], ['boss'], 'arena'))
    timeline = beginEncounterAction(timeline, { id: 'spawned-add', kind: 'enemy' }, 'advance', 4, 'arena')
    expect(timeline.entities.find(entity => entity.id === 'spawned-add')?.actions[0].targetId).toBe('arena')
  })
})
