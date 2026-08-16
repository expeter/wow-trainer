export type EncounterEntityKind = 'controlled-player' | 'raid-npc' | 'enemy' | 'arena'

export interface EncounterTimelineAction {
  id: string
  kind: string
  startedAt: number
  duration: number
  targetId?: string
}

export interface EncounterEntityTimeline {
  id: string
  kind: EncounterEntityKind
  actions: readonly EncounterTimelineAction[]
}

export interface EncounterTimelineState {
  time: number
  ordinal: number
  entities: readonly EncounterEntityTimeline[]
}

export interface EncounterTimelineEntity {
  id: string
  kind: EncounterEntityKind
}

export function createEncounterTimeline(entities: readonly EncounterTimelineEntity[]): EncounterTimelineState {
  return {
    time: 0,
    ordinal: 0,
    entities: entities.map(entity => ({ ...entity, actions: [] })),
  }
}

export function advanceEncounterTimeline(timeline: EncounterTimelineState, seconds: number): EncounterTimelineState {
  const time = timeline.time + seconds
  return {
    ...timeline,
    time,
    entities: timeline.entities.map(entity => ({
      ...entity,
      actions: entity.actions.filter(action => action.startedAt + action.duration >= time - 2),
    })),
  }
}

export function beginEncounterAction(
  timeline: EncounterTimelineState,
  entity: EncounterTimelineEntity,
  kind: string,
  duration = 0,
  targetId?: string,
): EncounterTimelineState {
  const ordinal = timeline.ordinal + 1
  const action = { id: `${entity.id}:${kind}:${ordinal}`, kind, startedAt: timeline.time, duration, targetId }
  const exists = timeline.entities.some(candidate => candidate.id === entity.id)
  const entities = exists ? timeline.entities : [...timeline.entities, { ...entity, actions: [] }]
  return {
    ...timeline,
    ordinal,
    entities: entities.map(candidate => candidate.id === entity.id
      ? { ...candidate, actions: [...candidate.actions, action].slice(-12) }
      : candidate),
  }
}

export function activeEncounterActions(timeline: EncounterTimelineState, entityId?: string) {
  return timeline.entities
    .filter(entity => !entityId || entity.id === entityId)
    .flatMap(entity => entity.actions.map(action => ({ ...action, entityId: entity.id, entityKind: entity.kind })))
    .filter(action => action.startedAt <= timeline.time && action.startedAt + action.duration >= timeline.time)
}

export function coreEncounterEntities(playerId: string, raidIds: readonly string[], enemyIds: readonly string[], arenaId: string): readonly EncounterTimelineEntity[] {
  return [
    { id: playerId, kind: 'controlled-player' },
    ...raidIds.filter(id => id !== playerId).map(id => ({ id, kind: 'raid-npc' as const })),
    ...enemyIds.map(id => ({ id, kind: 'enemy' as const })),
    { id: arenaId, kind: 'arena' },
  ]
}
