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
  mechanics: readonly EncounterEntityMechanic[]
  movement?: EncounterMovementIntent
}

export interface EncounterEntityMechanic {
  id: string
  kind: string
  sourceId?: string
  appliedAt: number
  expiresAt?: number
  stacks: number
  removedAt?: number
  removalReason?: string
}

export interface EncounterMovementIntent {
  destination: { x: number; z: number }
  maxSpeed: number
  setAt: number
  kind: 'move' | 'realm-transfer'
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
    entities: entities.map(entity => ({ ...entity, actions: [], mechanics: [] })),
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
  const entities = exists ? timeline.entities : [...timeline.entities, { ...entity, actions: [], mechanics: [] }]
  return {
    ...timeline,
    ordinal,
    entities: entities.map(candidate => candidate.id === entity.id
      ? { ...candidate, actions: [...candidate.actions, action].slice(-12) }
      : candidate),
  }
}

export function applyEncounterMechanic(
  timeline: EncounterTimelineState,
  entity: EncounterTimelineEntity,
  mechanic: Omit<EncounterEntityMechanic, 'appliedAt'> & { appliedAt?: number },
): EncounterTimelineState {
  const exists = timeline.entities.some(candidate => candidate.id === entity.id)
  const entities = exists ? timeline.entities : [...timeline.entities, { ...entity, actions: [], mechanics: [] }]
  const application = { ...mechanic, appliedAt: mechanic.appliedAt ?? timeline.time }
  return {
    ...timeline,
    entities: entities.map(candidate => candidate.id === entity.id ? {
      ...candidate,
      mechanics: [...candidate.mechanics.filter(active => active.id !== mechanic.id || active.removedAt !== undefined), application].slice(-16),
    } : candidate),
  }
}

export function removeEncounterMechanic(timeline: EncounterTimelineState, entityId: string, mechanicId: string, reason: string): EncounterTimelineState {
  return {
    ...timeline,
    entities: timeline.entities.map(entity => entity.id === entityId ? {
      ...entity,
      mechanics: entity.mechanics.map(mechanic => mechanic.id === mechanicId && mechanic.removedAt === undefined ? { ...mechanic, removedAt: timeline.time, removalReason: reason } : mechanic),
    } : entity),
  }
}

export function activeEncounterMechanics(timeline: EncounterTimelineState, entityId?: string) {
  return timeline.entities
    .filter(entity => !entityId || entity.id === entityId)
    .flatMap(entity => entity.mechanics.map(mechanic => ({ ...mechanic, entityId: entity.id, entityKind: entity.kind })))
    .filter(mechanic => mechanic.removedAt === undefined && (mechanic.expiresAt === undefined || mechanic.expiresAt > timeline.time))
}

export function setEncounterMovementIntent(timeline: EncounterTimelineState, entityId: string, destination: { x: number; z: number }, maxSpeed: number, kind: EncounterMovementIntent['kind'] = 'move'): EncounterTimelineState {
  return {
    ...timeline,
    entities: timeline.entities.map(entity => entity.id === entityId ? { ...entity, movement: { destination, maxSpeed, kind, setAt: timeline.time } } : entity),
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
