import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceMainAction, beginMainAction, publishMainProjectile } from '../../platform/combatActions'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { classProjectileEffects, cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { nekzaliArena } from './train3d/arenas'
import { applyEncounterMechanic, beginEncounterAction, coreEncounterEntities, createEncounterTimeline, removeEncounterMechanic, setEncounterMovementIntent, type EncounterTimelineState } from '../../platform/encounters/timeline'
import { advanceAmbientNpcTimeline, ambientNpcPosition } from '../../platform/encounters/ambientNpc'
import { activeApplications, radialKnockback, rotateAround, type EncounterProjection, type TimedApplication } from '../../platform/encounters/mechanicState'
import { advanceEntityMotions } from '../../platform/encounters/entityState'
import { nekzaliTiming } from './timing/projections'

export type NekzaliPhase = 'phase-1' | 'echo-1' | 'echo-2' | 'phase-2'
export type NekzaliOutcome = 'active' | 'success' | 'wipe'
export type NekzaliRealmStage = 'none' | 'pull' | 'inside' | 'returning'

export interface NekzaliHazard { id: string; position: WorldPoint; radius: number; direction: WorldPoint; kind: 'cultist' | 'burning'; createdAt?: number }
export interface NekzaliAdd { id: string; position: WorldPoint; health: number; shield: number; crowdControlled: boolean; assignedToPlayer: boolean; playerDamage: number; corpseGroup: 1 | 2 }
export interface NekzaliCorpse { id: string; position: WorldPoint; group: 1 | 2; cremated: boolean }
export interface AnguishedImpact { id: string; position: WorldPoint; createdAt: number }

export interface NekzaliState {
  time: number
  timeline: EncounterTimelineState
  phase: NekzaliPhase
  phaseStartedAt: number
  player: { x: number; z: number; facing: number }
  npcPositions: Readonly<Record<string, WorldPoint>>
  boss: WorldPoint
  bossHealth: number
  bossEnergy: number
  ritualBurnApplications: readonly TimedApplication[]
  soulcoilPulseIds: readonly string[]
  anguishedImpacts: readonly AnguishedImpact[]
  uncoiledRageStartedAt?: number
  hollowingApplications: readonly TimedApplication[]
  hollowingHitIds: readonly string[]
  selectedSlotId: string
  projection: EncounterProjection
  soakGroup: 1 | 2
  cleanupDuty: boolean
  aggroOwner: string
  addsSpawned: boolean
  adds: readonly NekzaliAdd[]
  corpses: readonly NekzaliCorpse[]
  hazards: readonly NekzaliHazard[]
  rendEventIndex: number
  rendTargetId?: string
  rendStartedAt?: number
  rendDrops: number
  rendKnockbackApplied: boolean
  rendLastUpdatedAt?: number
  barrageStarted: boolean
  barrageResolved: boolean
  barrageTargetId?: string
  barrageStartedAt?: number
  playerAddKills: number
  mainCastRemaining: number
  mainTargetId?: string
  mainProjectileFiredAt?: number
  mainProjectileOrigin?: WorldPoint
  mainProjectileTarget?: WorldPoint
  mainProjectileOrdinal: number
  invokes: number
  outcome: NekzaliOutcome
  outcomeReason?: string
  mistakes: number
  failures: readonly RuntimeFailure[]
  trainingDifficulty: TrainingDifficulty
  wellGroup: 1 | 2
  wellEventIndex: number
  realmStage: NekzaliRealmStage
  realmStartedAt: number
  realmAddHits: number
  innerCastStartedAt?: number
  innerCastInterrupted: boolean
  disruptionIndex: number
  soulExhausted: boolean
  soulExhaustedUntil?: number
  npcRealmGroup?: 1 | 2
  npcRealmStartedAt?: number
}

const WELL_RADIUS = 6
const REALM_RADIUS = 22
const ROOM_RADIUS = 45
const SOUL_TRANSFER_SECONDS = 15
const bossHome = { x: 0, z: 18 }
const npcBarrageDestination = { x: 40, z: 8 }
const echoPositions = { 1: { x: 0, z: -34 }, 2: { x: 0, z: 34 } } as const

function moveToward(point: WorldPoint, target: WorldPoint, speed: number, seconds: number): WorldPoint {
  const length = distance(point, target)
  if (length <= speed * seconds || length === 0) return { ...target }
  const scale = speed * seconds / length
  return { x: point.x + (target.x - point.x) * scale, z: point.z + (target.z - point.z) * scale }
}

function clampCircle(point: { x: number; z: number; facing: number }) {
  const radius = Math.hypot(point.x, point.z)
  if (radius <= ROOM_RADIUS - 1.5) return point
  const scale = (ROOM_RADIUS - 1.5) / radius
  return { ...point, x: point.x * scale, z: point.z * scale }
}

export function nekzaliMemberPosition(member: ContractRaidMember): WorldPoint {
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  if (member.role === 'tank') return { x: index ? 2.4 : -2.4, z: 23 }
  if (member.role === 'melee') { const angle = .25 + index / peers.length * 2.3; return { x: Math.cos(angle) * 7, z: 18 + Math.sin(angle) * 7 } }
  const angle = .18 + index / peers.length * 2.75
  const radius = member.role === 'healer' ? 22 : 28
  return { x: Math.cos(angle) * radius, z: 10 + Math.sin(angle) * radius * .55 }
}

function groupForSlot(slotId: string): 1 | 2 {
  return contractRaidRoster.findIndex(member => member.id === slotId) % 2 === 0 ? 1 : 2
}

function cleanupForSlot(slotId: string) {
  return Math.max(0, contractRaidRoster.findIndex(member => member.id === slotId)) % 5 === 0
}

function rendTargetForEvent(state: NekzaliState, eventIndex: number) {
  const selectedIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  if ((selectedIndex + eventIndex) % 2 === 0 && state.realmStage !== 'inside' && state.realmStage !== 'returning') return state.selectedSlotId
  return contractRaidRoster[(selectedIndex + 5 + eventIndex * 3) % contractRaidRoster.length].id
}

function rendNpcPositionAt(targetId: string, age: number, projection: EncounterProjection): WorldPoint {
  const member = contractRaidRoster.find(candidate => candidate.id === targetId) ?? contractRaidRoster[0]
  const targetIndex = Math.max(0, contractRaidRoster.findIndex(candidate => candidate.id === targetId))
  const baseAngle = targetIndex / contractRaidRoster.length * Math.PI * 2
  const start = nekzaliMemberPosition(member)
  const pullSeconds = nekzaliTiming(projection).essenceRendPullSeconds
  if (age < pullSeconds) return moveToward(start, { x: 0, z: 0 }, .8, age)
  const progress = Math.min(1, (age - pullSeconds) / 4)
  const entry = { x: Math.cos(baseAngle) * 40, z: Math.sin(baseAngle) * 40 }
  const pulled = moveToward(start, { x: 0, z: 0 }, .8, pullSeconds)
  return { x: pulled.x + (entry.x - pulled.x) * progress, z: pulled.z + (entry.z - pulled.z) * progress }
}

function removeEssenceRend(state: NekzaliState, reason: 'auto-dispel' | 'healer-dispel' | 'expiry'): NekzaliState {
  if (state.rendStartedAt === undefined || !state.rendTargetId) return state
  const age = state.time - state.rendStartedAt
  const position = state.rendTargetId === state.selectedSlotId ? { x: state.player.x, z: state.player.z } : state.npcPositions[state.rendTargetId] ?? rendNpcPositionAt(state.rendTargetId, age, state.projection)
  const hazard: NekzaliHazard = { id: `rend-${state.rendEventIndex}`, position, radius: 6, direction: { x: 0, z: 0 }, kind: 'cultist', createdAt: state.time }
  const targetEntityId = state.rendTargetId === state.selectedSlotId ? 'controlled-player' : state.rendTargetId
  let next: NekzaliState = { ...state, timeline: removeEncounterMechanic(state.timeline, targetEntityId, 'essence-rend', reason), hazards: [...state.hazards, hazard], rendTargetId: undefined, rendStartedAt: undefined, rendDrops: 1, rendKnockbackApplied: false, rendLastUpdatedAt: undefined }
  if (reason === 'expiry' && Math.hypot(position.x, position.z) < 34) next = addFailure(next, 'rend-inside', 'Essence Rend created a Latent Cultist inside the raid', 'Reach a clear edge lane before the Magic debuff is removed.', true)
  return next
}

function stepEssenceRend(state: NekzaliState, eventIndex: number): NekzaliState {
  let next = state
  if (next.rendEventIndex === eventIndex && next.rendStartedAt === undefined) {
    const rendTargetId = rendTargetForEvent(next, eventIndex)
    const targetEntity = { id: rendTargetId === next.selectedSlotId ? 'controlled-player' : rendTargetId, kind: rendTargetId === next.selectedSlotId ? 'controlled-player' as const : 'raid-npc' as const }
    const timing = nekzaliTiming(next.projection)
    next = { ...next, timeline: applyEncounterMechanic(next.timeline, targetEntity, { id: 'essence-rend', kind: 'timed-magic-drop', sourceId: 'nekzali-boss', expiresAt: next.time + timing.essenceRendPullSeconds + timing.essenceRendDebuffSeconds, stacks: 1 }), rendEventIndex: eventIndex + 1, rendTargetId, rendStartedAt: next.time, rendDrops: 0, rendKnockbackApplied: false, rendLastUpdatedAt: next.time }
  }
  if (next.rendStartedAt === undefined) return next
  const timing = nekzaliTiming(next.projection)
  const age = next.time - next.rendStartedAt
  if (next.rendTargetId === next.selectedSlotId && age < timing.essenceRendPullSeconds) {
    const delta = Math.max(0, next.time - (next.rendLastUpdatedAt ?? next.time))
    const pulled = moveToward(next.player, { x: 0, z: 0 }, .8, delta)
    next = { ...next, player: { ...next.player, ...pulled }, rendLastUpdatedAt: next.time }
  }
  if (age >= timing.essenceRendPullSeconds && !next.rendKnockbackApplied) {
    const knocked = radialKnockback(next.player, { x: 0, z: 0 }, 4.5)
    const player = next.rendTargetId === next.selectedSlotId ? clampCircle({ ...next.player, ...knocked }) : next.player
    next = { ...next, player, rendKnockbackApplied: true }
  }
  if (age < timing.essenceRendPullSeconds) return next
  if (next.rendTargetId === next.selectedSlotId && Math.hypot(next.player.x, next.player.z) >= 36) return removeEssenceRend(next, 'auto-dispel')
  if (next.rendTargetId !== next.selectedSlotId && age >= timing.essenceRendPullSeconds + 4 && contractSelectedMember(next.selectedSlotId).role !== 'healer') return removeEssenceRend(next, 'auto-dispel')
  if (age >= timing.essenceRendPullSeconds + timing.essenceRendDebuffSeconds) return removeEssenceRend(next, 'expiry')
  return next
}

function stepScheduledRend(state: NekzaliState, phaseAge: number, starts: readonly number[], eventOffset: number): NekzaliState {
  if (state.rendStartedAt !== undefined) return stepEssenceRend(state, Math.max(eventOffset, state.rendEventIndex - 1))
  const localIndex = state.rendEventIndex - eventOffset
  if (localIndex < 0 || localIndex >= starts.length || phaseAge < starts[localIndex]) return state
  return stepEssenceRend(state, state.rendEventIndex)
}

export function nekzaliRendRemaining(state: NekzaliState) {
  if (state.rendStartedAt === undefined) return 0
  const timing = nekzaliTiming(state.projection)
  return Math.max(0, timing.essenceRendPullSeconds + timing.essenceRendDebuffSeconds - (state.time - state.rendStartedAt))
}

export function isNekzaliPlayerRendTarget(state: NekzaliState) {
  return state.rendStartedAt !== undefined && state.rendTargetId === state.selectedSlotId
}

export function createNekzaliState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal', projection: EncounterProjection = 'train3d'): NekzaliState {
  const member = contractSelectedMember(selectedSlotId)
  const start = nekzaliMemberPosition(member)
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(candidate => candidate.id !== selectedSlotId).map(candidate => candidate.id), ['nekzali-boss'], nekzaliArena.id))
  const npcPositions = Object.fromEntries(contractRaidRoster.filter(candidate => candidate.id !== selectedSlotId).map(candidate => [candidate.id, nekzaliMemberPosition(candidate)]))
  return { time: 0, timeline, phase: 'phase-1', phaseStartedAt: 0, player: { ...start, facing: 0 }, npcPositions, boss: { ...bossHome }, bossHealth: 100, bossEnergy: 0, ritualBurnApplications: [], soulcoilPulseIds: [], anguishedImpacts: [], hollowingApplications: [], hollowingHitIds: [],
    selectedSlotId, projection, soakGroup: groupForSlot(selectedSlotId), cleanupDuty: cleanupForSlot(selectedSlotId), aggroOwner: member.role === 'tank' ? selectedSlotId : 'tank-1', addsSpawned: false, adds: [], corpses: [], hazards: [], rendEventIndex: 0, rendDrops: 0, rendKnockbackApplied: false,
    barrageStarted: false, barrageResolved: false, playerAddKills: 0, mainCastRemaining: 0, mainProjectileOrdinal: 0, invokes: 0, outcome: 'active', mistakes: 0, failures: [], trainingDifficulty,
    wellGroup: groupForSlot(selectedSlotId), wellEventIndex: 0, realmStage: 'none', realmStartedAt: 0, realmAddHits: 0, innerCastInterrupted: false, disruptionIndex: 0, soulExhausted: false }
}

export function prepareNekzaliSlot(state: NekzaliState, selectedSlotId: string): NekzaliState {
  return createNekzaliState(selectedSlotId, state.trainingDifficulty, state.projection)
}

export function turnNekzaliPlayer(state: NekzaliState, yawDelta: number): NekzaliState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export function startNekzaliMainCast(state: NekzaliState): NekzaliState {
  if (state.outcome !== 'active' || state.mainCastRemaining > 0) return state
  if (state.realmStage === 'inside' && state.realmAddHits < 20) {
    const next = beginMainAction(state, 'drowned-echo')
    return next === state ? state : { ...next, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'main-ability', 1, 'drowned-echo') }
  }
  if (state.realmStage !== 'none') return state
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const targetId = `echo-${state.phase === 'echo-1' ? 1 : 2}`
    const next = beginMainAction(state, targetId)
    return next === state ? state : { ...next, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'main-ability', 1, targetId) }
  }
  const closestAdd = state.adds.filter(add => add.health > 0).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
  const targetId = closestAdd?.id ?? 'nekzali-boss'
  const next = beginMainAction(state, targetId)
  return next === state ? state : { ...next, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'main-ability', 1, targetId) }
}

export function tauntNekzali(state: NekzaliState): NekzaliState {
  if (contractSelectedMember(state.selectedSlotId).role !== 'tank' || state.phase === 'echo-1' || state.phase === 'echo-2') return state
  return { ...state, aggroOwner: state.selectedSlotId, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'taunt', 0, 'nekzali-boss') }
}

export function dispelNekzali(state: NekzaliState): NekzaliState {
  if (contractSelectedMember(state.selectedSlotId).role !== 'healer' || state.rendStartedAt === undefined || !state.rendTargetId || state.rendTargetId === state.selectedSlotId) return state
  const age = state.time - state.rendStartedAt
  const timing = nekzaliTiming(state.projection)
  if (age < timing.essenceRendPullSeconds) return state
  const position = rendNpcPositionAt(state.rendTargetId, age, state.projection)
  if (Math.hypot(position.x, position.z) < 34) return state
  return removeEssenceRend({ ...state, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'dispel', 0, state.rendTargetId) }, 'healer-dispel')
}

function addFailure(state: NekzaliState, code: string, label: string, advice: string, terminal = false): NekzaliState {
  if (state.failures.some(failure => failure.code === code && state.time - failure.time < 4)) return state
  const failure = { id: `nekzali-${code}-${state.time.toFixed(2)}`, code, time: state.time, label, advice }
  const mistakes = state.mistakes + 1
  const wipe = shouldEndTrainingAttempt(state.trainingDifficulty, mistakes, terminal)
  return { ...state, mistakes, failures: [failure, ...state.failures].slice(0, 5), outcome: wipe ? 'wipe' : state.outcome, outcomeReason: wipe ? label : state.outcomeReason }
}

function addPerformanceRecord(state: NekzaliState, code: string, label: string, advice: string): NekzaliState {
  if (state.failures.some(failure => failure.code === code && state.time - failure.time < 5)) return state
  const failure = { id: `nekzali-${code}-${state.time.toFixed(2)}`, code, time: state.time, label, advice }
  return { ...state, failures: [failure, ...state.failures].slice(0, 5) }
}

export function interruptNekzali(state: NekzaliState): NekzaliState {
  if (state.realmStage !== 'inside' || state.innerCastStartedAt === undefined || state.innerCastInterrupted) return state
  if (state.time - state.innerCastStartedAt >= nekzaliTiming(state.projection).drownedEchoInterruptSeconds) return state
  return { ...state, innerCastInterrupted: true, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'interrupt', 0, 'drowned-echo') }
}

function maybeStartRealm(state: NekzaliState): NekzaliState {
  if (state.realmStage !== 'none') return state
  const phaseAge = state.time - state.phaseStartedAt
  const eventGroup = state.phase === 'phase-1' && state.wellEventIndex === 0 && phaseAge >= 55 ? 1
    : state.phase === 'phase-2' && state.wellEventIndex === 1 && phaseAge >= 8 ? 2
      : undefined
  if (!eventGroup) return state
  if (state.wellGroup !== eventGroup) {
    const assigned = contractRosterForSlot(state.selectedSlotId).filter(member => !member.controlled && groupForSlot(member.id) === eventGroup)
    const timeline = assigned.reduce((current, member) => beginEncounterAction(current, { id: member.id, kind: 'raid-npc' }, 'realm-transfer', 25, 'drowned-echo'), state.timeline)
    return { ...state, timeline, wellEventIndex: state.wellEventIndex + 1, npcRealmGroup: eventGroup, npcRealmStartedAt: state.time }
  }
  const selected = contractSelectedMember(state.selectedSlotId)
  const aggroOwner = selected.role === 'tank' && state.aggroOwner === state.selectedSlotId ? (state.selectedSlotId === 'tank-1' ? 'tank-2' : 'tank-1') : state.aggroOwner
  return { ...state, wellEventIndex: state.wellEventIndex + 1, realmStage: 'pull', realmStartedAt: state.time, realmAddHits: 0, innerCastStartedAt: undefined, innerCastInterrupted: false, disruptionIndex: 0, aggroOwner }
}

function otherTank(tankId: string) {
  return tankId === 'tank-2' ? 'tank-1' : 'tank-2'
}

function beginBarrage(state: NekzaliState): NekzaliState {
  const targetId = state.aggroOwner
  return { ...state, barrageStarted: true, barrageStartedAt: state.time, barrageTargetId: targetId, aggroOwner: otherTank(targetId) }
}

function barrageTargetPosition(state: NekzaliState): WorldPoint {
  const selected = contractSelectedMember(state.selectedSlotId)
  if (selected.role === 'tank' && state.barrageTargetId === state.selectedSlotId) return state.player
  return state.barrageTargetId ? state.npcPositions[state.barrageTargetId] ?? npcBarrageDestination : npcBarrageDestination
}

function pointToSegmentDistance(point: WorldPoint, start: WorldPoint, end: WorldPoint) {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  if (!lengthSquared) return distance(point, start)
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared))
  return distance(point, { x: start.x + dx * t, z: start.z + dz * t })
}

function realmHazards(age: number): readonly WorldPoint[] {
  const orbiting = Array.from({ length: 8 }, (_, index) => {
    const ring = index % 2
    const angle = age * (ring ? -.42 : .56) + index * Math.PI / 4
    const radius = ring ? 15 : 9
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
  })
  const waveAge = age % 6
  const radius = Math.min(REALM_RADIUS - 1, waveAge * 3.5)
  const outward = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3 + Math.floor(age / 6) * .31
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
  })
  return [...orbiting, ...outward]
}

function disruptionStarts(state: NekzaliState): readonly [number, number] {
  const slotIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  const first = 9 + (slotIndex * 3 + state.wellEventIndex) % 5
  return [first, first + 13 + (slotIndex + state.wellGroup) % 4]
}

function stepRealm(state: NekzaliState, commands: PlayerCommandState, seconds: number, screenRelative = false): NekzaliState {
  let next = state.phase === 'phase-1' ? stepPhaseOne(state, seconds, false) : state.phase === 'phase-2' ? stepPhaseTwo(state, seconds, false) : state
  if (next.outcome !== 'active') return next
  const timing = nekzaliTiming(next.projection)
  const age = next.time - next.realmStartedAt
  if (next.realmStage === 'pull') {
    const roomBounds = { halfWidth: ROOM_RADIUS, halfDepth: ROOM_RADIUS }
    const moved = screenRelative ? stepScreenRelativeWorldMovement(next.player, commands, seconds, roomBounds, 1, 9) : stepPlayerMovement(next.player, commands, seconds, roomBounds)
    next = { ...next, player: clampCircle(moved) }
    if (distance(next.player, { x: 0, z: 0 }) <= WELL_RADIUS) return { ...next, realmStage: 'inside', realmStartedAt: next.time, player: { x: 0, z: 9, facing: Math.PI } }
    if (age >= timing.wellEntrySeconds) {
      next = addFailure(next, 'missed-realm-entry', 'Missed the Grasping Depths assignment', 'Enter the central Well before the seven-second realm countdown expires.', true)
      return { ...next, realmStage: 'none', mainCastRemaining: 0, mainTargetId: undefined }
    }
    return next
  }
  if (next.realmStage === 'returning') {
    next = resolveMainCast(next, seconds)
    if (age >= 5) return { ...next, realmStage: 'none', realmStartedAt: next.time, player: { x: 0, z: 9, facing: 0 }, soulExhausted: true, soulExhaustedUntil: next.time + 60, mainCastRemaining: 0, mainTargetId: undefined }
    return next
  }

  const realmBounds = { halfWidth: REALM_RADIUS - .5, halfDepth: REALM_RADIUS - .5 }
  const moved = screenRelative ? stepScreenRelativeWorldMovement(next.player, commands, seconds, realmBounds, 1, 9) : stepPlayerMovement(next.player, commands, seconds, realmBounds)
  const radius = Math.hypot(moved.x, moved.z)
  const player = radius > REALM_RADIUS - .5 ? { ...moved, x: moved.x / radius * (REALM_RADIUS - .5), z: moved.z / radius * (REALM_RADIUS - .5) } : moved
  next = { ...next, player }
  if (age >= 4 && next.innerCastStartedAt === undefined) next = { ...next, innerCastStartedAt: next.time }
  if (next.innerCastStartedAt !== undefined && !next.innerCastInterrupted && next.time - next.innerCastStartedAt >= timing.drownedEchoInterruptSeconds) return addFailure({ ...next, innerCastInterrupted: true }, 'missed-well-interrupt', 'Drowned Echo completed its assigned cast', 'Use the Interrupt binding during the ten-second cast inside the Well.', true)

  const activeDisruption = disruptionStarts(next)[next.disruptionIndex]
  if (activeDisruption !== undefined && age >= activeDisruption + 3) {
    if (next.mainCastRemaining > 0) next = addPerformanceRecord({ ...next, mainCastRemaining: 0, mainTargetId: undefined }, 'realm-main-interrupted', 'Nek\'zali interrupted your Main cast', 'Watch the three-second disruption cast and avoid beginning Main just before it completes.')
    next = { ...next, disruptionIndex: next.disruptionIndex + 1 }
  }
  const hazard = realmHazards(age).find(point => distance(player, point) < 1.45)
  if (hazard) next = addFailure(next, 'well-spirit-contact', 'Touched a spirit inside Grasping Depths', 'Keep between the orbiting spirits and sidestep each cardinal outward wave.', true)
  if (age >= 50 && next.realmAddHits < 20) next = addFailure(next, 'drowned-echo-alive', 'Drowned Echo survived the well assignment', 'Complete 20 Main casts while moving and interrupt the assigned spell.', true)
  return resolveMainCast(next, seconds)
}

function spawnAdds(assignToPlayer = true): readonly NekzaliAdd[] {
  return Array.from({ length: 9 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 9
    return { id: `amani-${index + 1}`, position: { x: Math.cos(angle) * 41, z: Math.sin(angle) * 41 }, health: 100, shield: 25, crowdControlled: false, assignedToPlayer: assignToPlayer && index % 3 === 1, playerDamage: 0, corpseGroup: index % 2 ? 2 : 1 } as NekzaliAdd
  })
}

function resolveMainCast(state: NekzaliState, seconds: number): NekzaliState {
  const advanced = advanceMainAction(state, seconds)
  if (!advanced.completedTargetId) return advanced.state
  state = advanced.state
  if (advanced.completedTargetId === 'drowned-echo') {
    const realmAddHits = Math.min(20, state.realmAddHits + 1)
    return { ...publishMainProjectile(state, { x: 0, z: 0 }), realmAddHits,
      ...(realmAddHits >= 20 ? { realmStage: 'returning' as const, realmStartedAt: state.time } : {}),
    }
  }
  if (advanced.completedTargetId === 'echo-1' || advanced.completedTargetId === 'echo-2') return publishMainProjectile(state, echoPositions[advanced.completedTargetId === 'echo-1' ? 1 : 2])
  if (advanced.completedTargetId === 'nekzali-boss') return publishMainProjectile(state, state.boss)
  let targetIndex = state.adds.findIndex(add => add.id === advanced.completedTargetId && add.health > 0)
  if (targetIndex < 0) {
    const replacement = state.adds.filter(add => add.health > 0).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
    if (!replacement) return state.phase === 'phase-1' || state.phase === 'phase-2' ? publishMainProjectile(state, state.boss) : state
    targetIndex = state.adds.findIndex(add => add.id === replacement.id)
  }
  const target = state.adds[targetIndex]
  const shieldDamage = Math.min(target.shield, 55)
  const targetShield = target.shield - shieldDamage
  const healthDamage = 55 - shieldDamage
  const targetHealth = Math.max(0, target.health - healthDamage)
  const killed = targetHealth === 0
  const adds = state.adds.map((add, index) => index === targetIndex ? { ...add, health: targetHealth, shield: targetShield, crowdControlled: targetShield === 0, playerDamage: add.playerDamage + 55 } : add)
  return { ...publishMainProjectile(state, target.position), adds,
    playerAddKills: state.playerAddKills + Number(killed && target.assignedToPlayer),
    corpses: killed ? [...state.corpses, { id: `corpse-${target.id}`, position: target.position, group: target.corpseGroup, cremated: false }] : state.corpses,
  }
}

function stepAdds(state: NekzaliState, seconds: number): NekzaliState {
  let next = state
  let playerAddKills = state.playerAddKills
  let corpses = [...state.corpses]
  const adds = state.adds.map(add => {
    if (add.health <= 0) return add
    const shield = Math.max(0, add.shield - (add.assignedToPlayer ? 1 : 4) * seconds)
    const crowdControlled = shield === 0
    const moved = moveToward(add.position, { x: 0, z: 0 }, crowdControlled ? .5 : 1.25, seconds)
    const npcDps = add.assignedToPlayer ? 2.2 : 7.5
    const health = shield > 0 ? add.health : Math.max(0, add.health - npcDps * seconds)
    if (health <= 0 && add.health > 0) {
      if (add.assignedToPlayer && add.playerDamage > 0) playerAddKills += 1
      corpses.push({ id: `corpse-${add.id}`, position: moved, group: add.corpseGroup, cremated: false })
    }
    return { ...add, position: moved, health, shield, crowdControlled }
  })
  next = { ...next, adds, corpses, playerAddKills }
  const leaked = adds.find(add => add.health > 0 && distance(add.position, { x: 0, z: 0 }) <= WELL_RADIUS)
  if (leaked) next = addFailure(next, 'amani-leak', 'A Restless Amani reached the Soulcoil Well', 'Switch targets earlier and use Main ability on each of your three marked adds.', true)
  return next
}

function transitionToIntermission(state: NekzaliState): NekzaliState {
  if (state.adds.some(add => add.health > 0)) return addFailure(state, 'amani-wave-alive', 'Restless Amani remained at intermission', 'Finish the complete add wave before Nek\'zali reaches 50%.', true)
  if (state.adds.some(add => add.assignedToPlayer) && state.playerAddKills < 3) return addFailure(state, 'assigned-adds-alive', 'Your three assigned Amani were not defeated', 'Use Main ability on the nearest living Amani until all three marked targets are dead.', true)
  return { ...state, phase: 'echo-1', phaseStartedAt: state.time, boss: { x: 0, z: 0 }, bossHealth: 50, hazards: state.hazards.filter(hazard => hazard.kind === 'cultist') }
}

function stepSoulcoilIgnition(state: NekzaliState, phaseAge: number, starts: readonly number[], playerPresent: boolean): NekzaliState {
  let next: NekzaliState = { ...state, ritualBurnApplications: activeApplications(state.ritualBurnApplications, state.time), anguishedImpacts: state.anguishedImpacts.filter(impact => state.time - impact.createdAt < 2) }
  for (let event = 0; event < starts.length; event += 1) {
    for (let pulse = 1; pulse <= 4; pulse += 1) {
      const at = starts[event] + pulse
      const key = `${state.phase}-${event}-${pulse}`
      if (phaseAge < at || next.soulcoilPulseIds.includes(key)) continue
      const angle = (event * 2.41 + pulse * 1.37 + (state.phase === 'phase-2' ? .7 : 0)) % (Math.PI * 2)
      const radius = 12 + ((event * 4 + pulse * 7) % 24)
      const impact = { id: `anguished-${key}`, position: { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }, createdAt: state.time }
      next = {
        ...next,
        soulcoilPulseIds: [...next.soulcoilPulseIds, key],
        bossEnergy: Math.min(100, next.bossEnergy + 5),
        ritualBurnApplications: [...next.ritualBurnApplications, { id: `ritual-burn-${key}`, appliedAt: state.time, duration: 44 }],
        anguishedImpacts: [...next.anguishedImpacts, impact],
      }
      if (playerPresent && distance(next.player, impact.position) < 5) next = addFailure(next, 'anguished-echo', 'Hit by Anguished Echo', 'Move out of each impact circle during Soulcoil Ignition.', true)
    }
  }
  if (next.bossEnergy >= 100 && next.uncoiledRageStartedAt === undefined) next = { ...next, uncoiledRageStartedAt: next.time }
  if (next.uncoiledRageStartedAt !== undefined && next.time - next.uncoiledRageStartedAt >= 5) next = addFailure(next, 'uncoiled-rage', 'Uncoiled Rage completed', 'Prevent the Soulcoil Well from reaching 100 energy.', true)
  return next
}

function stepHollowingStrikes(state: NekzaliState, phaseAge: number, playerPresent: boolean): NekzaliState {
  let next: NekzaliState = { ...state, hollowingApplications: activeApplications(state.hollowingApplications, state.time) }
  for (const at of [12, 24, 36, 48]) {
    const key = `${state.phase}-${at}`
    if (phaseAge < at || next.hollowingHitIds.includes(key)) continue
    const appliesToPlayer = playerPresent && contractSelectedMember(state.selectedSlotId).role === 'tank' && state.aggroOwner === state.selectedSlotId
    next = { ...next, hollowingHitIds: [...next.hollowingHitIds, key], hollowingApplications: appliesToPlayer ? [...next.hollowingApplications, { id: `hollowing-${key}`, appliedAt: state.time, duration: 15 }] : next.hollowingApplications }
  }
  return next
}

function resolveEcho(state: NekzaliState, echo: 1 | 2): NekzaliState {
  const playerSoaks = !state.cleanupDuty
  const echoPosition = echoPositions[echo]
  let next = state
  if (playerSoaks && distance(state.player, echoPosition) > 7.5) {
    return addFailure(next, 'missed-pyre', `Missed soak group ${echo}`, 'Move into the large filled Hungering Pyre circle assigned before pull.', true)
  }
  const spreadGroup = echo
  const groupCorpses = next.corpses.filter(corpse => corpse.group === spreadGroup && !corpse.cremated)
  if (!playerSoaks) {
    const contacted = groupCorpses.find(corpse => distance(next.player, corpse.position) <= 4)
    if (groupCorpses.length && !contacted) return addFailure(next, 'uncleared-corpse', 'Amani corpse survived Cremation', 'Place your spread circle over any remaining corpse before Slithering Flame expires.', true)
    const spreadPlayers = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled && groupForSlot(member.id) === spreadGroup)
    if (spreadPlayers.some((member, index) => distance(next.player, npcPosition(member, next, index)) < 6)) return addFailure(next, 'spread-overlap', 'Slithering Flame hit another player', 'Find an unoccupied corpse lane before the red circle expires.', true)
  }
  const corpses = next.corpses.map(corpse => corpse.group === spreadGroup ? { ...corpse, cremated: true } : corpse)
  const burning = groupCorpses.map((corpse, index) => ({ id: `burn-${echo}-${index}`, position: corpse.position, radius: 4, direction: { x: 0, z: 0 }, kind: 'burning' as const, createdAt: next.time }))
  next = { ...next, corpses, hazards: [...next.hazards, ...burning] }
  if (echo === 1) return { ...next, phase: 'echo-2', phaseStartedAt: next.time }
  if (corpses.some(corpse => !corpse.cremated)) return addFailure(next, 'residual-corpses', 'Residual Amani corpses reawakened', 'Both spread groups must Cremate every corpse before Phase 2.', true)
  return { ...next, phase: 'phase-2', phaseStartedAt: next.time, boss: { ...bossHome }, aggroOwner: contractSelectedMember(next.selectedSlotId).role === 'tank' ? next.selectedSlotId : 'tank-1', rendDrops: 0, barrageStarted: false, barrageResolved: false, barrageTargetId: undefined, barrageStartedAt: undefined }
}

function stepPhaseTwo(state: NekzaliState, seconds: number, playerPresent = true): NekzaliState {
  const timing = nekzaliTiming(state.projection)
  const ageAfter = state.time - state.phaseStartedAt
  const ageBefore = ageAfter - seconds
  let invokes = state.invokes
  let hazards: NekzaliHazard[] = state.hazards.filter(hazard => hazard.kind === 'cultist')
  for (const boundary of timing.invokeStarts) if (ageBefore < boundary && ageAfter >= boundary) {
    invokes += 1
    hazards = hazards.map(hazard => ({ ...hazard, position: rotateAround(hazard.position, Math.PI / 6), direction: { x: 0, z: 0 }, createdAt: state.time }))
  }
  const completedInvokes = invokes - state.invokes
  const selected = contractSelectedMember(state.selectedSlotId)
  let aggroOwner = state.aggroOwner
  let barrageStarted = state.barrageStarted
  let barrageResolved = state.barrageResolved
  let barrageTargetId = state.barrageTargetId
  let barrageStartedAt = state.barrageStartedAt
  if (!barrageStarted && ageAfter >= 22) {
    const begun = beginBarrage({ ...state, aggroOwner })
    barrageStarted = begun.barrageStarted
    barrageStartedAt = begun.barrageStartedAt
    barrageTargetId = begun.barrageTargetId
    aggroOwner = begun.aggroOwner
  }
  const aggroTarget = aggroOwner === state.selectedSlotId && selected.role === 'tank' ? state.player : bossHome
  const boss = moveToward(state.boss, aggroTarget, 4.5, seconds)
  const invokeApplications = Array.from({ length: completedInvokes }, (_, index) => ({ id: `invoke-rite-${invokes - index}`, appliedAt: state.time, duration: 44 }))
  let next: NekzaliState = { ...state, invokes, hazards, aggroOwner, barrageStarted, barrageResolved, barrageTargetId, barrageStartedAt, boss, bossHealth: Math.max(0, 50 - ageAfter * (50 / 65)), bossEnergy: Math.min(100, state.bossEnergy + completedInvokes * 5), ritualBurnApplications: [...state.ritualBurnApplications, ...invokeApplications] }
  next = stepSoulcoilIgnition(next, ageAfter, timing.phaseTwoIgnitionStarts, playerPresent)
  next = stepHollowingStrikes(next, ageAfter, playerPresent)
  next = stepScheduledRend(next, ageAfter, timing.phaseTwoRendStarts, timing.phaseOneRendStarts.length)
  if (!barrageResolved && ageAfter >= 22 + timing.possessionBarrageSeconds) {
    const target = barrageTargetPosition(next)
    if (next.barrageTargetId === next.selectedSlotId && distance(next.boss, target) < 24) next = addFailure(next, 'p2-short-barrage', 'Possession Barrage exploded too close to the raid', 'Use the same clear outer tank lane in Phase 2.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && pointToSegmentDistance(next.player, next.boss, target) < 4) next = addFailure(next, 'p2-barrage-impact', 'Hit by a Phase 2 Possession Barrage spirit', 'Stay outside the active tank lane and impact circles.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && distance(next.player, target) < 10) next = addFailure(next, 'p2-barrage-explosion', 'Caught in a Possession Barrage explosion', 'Stay at least 10 yards from the distant tank impact point.', true)
    next = { ...next, barrageResolved: true }
  }
  const hit = playerPresent ? hazards.find(hazard => next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .8) : undefined
  if (hit) next = addFailure(next, 'cultist-contact', 'Touched a moving Latent Cultist zone', 'Watch Invoke and move through the gap between repositioning hazards.')
  if (next.bossHealth <= 0) next = { ...next, outcome: 'success' }
  return next
}

function stepPhaseOne(state: NekzaliState, seconds: number, playerPresent = true): NekzaliState {
  const timing = nekzaliTiming(state.projection)
  let next: NekzaliState = { ...state, bossHealth: Math.max(50, 100 - state.time * (50 / timing.phaseOneSeconds)) }
  const selected = contractSelectedMember(next.selectedSlotId)
  const aggroTarget = next.aggroOwner === next.selectedSlotId && selected.role === 'tank' && playerPresent ? next.player : bossHome
  next = { ...next, boss: moveToward(next.boss, aggroTarget, 4.5, seconds) }
  next = stepSoulcoilIgnition(next, next.time, timing.phaseOneIgnitionStarts, playerPresent)
  next = stepHollowingStrikes(next, next.time, playerPresent)
  next = stepScheduledRend(next, next.time, timing.phaseOneRendStarts, 0)
  const oldRend = playerPresent ? next.hazards.find(hazard => hazard.kind === 'cultist' && next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .7) : undefined
  if (oldRend) next = addFailure(next, 'rend-ground', 'Stayed in an Essence Rend pool', 'Keep moving so every consecutive edge drop lands behind you.', true)
  if (!next.barrageStarted && next.time >= 38) next = beginBarrage(next)
  if (!next.barrageResolved && next.barrageStartedAt !== undefined && next.time >= next.barrageStartedAt + timing.possessionBarrageSeconds) {
    const target = barrageTargetPosition(next)
    if (next.barrageTargetId === next.selectedSlotId && distance(next.boss, target) < 24) next = addFailure(next, 'short-barrage', 'Possession Barrage exploded too close to the raid', 'Run down the clear outer lane while the off-tank keeps Nek\'zali in place.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && pointToSegmentDistance(next.player, next.boss, target) < 4) next = addFailure(next, 'barrage-impact', 'Hit by a Possession Barrage spirit', 'Leave the tank lane and the small impact circles.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && distance(next.player, target) < 10) next = addFailure(next, 'barrage-explosion', 'Caught in a Possession Barrage explosion', 'Stay at least 10 yards from the distant tank impact point.', true)
    next = { ...next, barrageResolved: true }
  }
  if (!next.addsSpawned && next.time >= 42) next = { ...next, addsSpawned: true, adds: spawnAdds(next.wellGroup !== 1) }
  if (next.addsSpawned) next = stepAdds(next, seconds)
  if (playerPresent && next.time >= timing.phaseOneSeconds && next.outcome === 'active') next = transitionToIntermission(next)
  return next
}

function stepNekzali(state: NekzaliState, commands: PlayerCommandState, seconds: number, screenRelative = false): NekzaliState {
  if (state.outcome !== 'active') return state
  const time = state.time + seconds
  const npcRealmComplete = state.npcRealmStartedAt !== undefined && time - state.npcRealmStartedAt >= 25
  let next: NekzaliState = maybeStartRealm({ ...state, time, npcRealmGroup: npcRealmComplete ? undefined : state.npcRealmGroup, npcRealmStartedAt: npcRealmComplete ? undefined : state.npcRealmStartedAt, soulExhausted: state.soulExhaustedUntil !== undefined && time < state.soulExhaustedUntil, timeline: advanceAmbientNpcTimeline(state.timeline, seconds, 'nekzali-boss') })
  if (next.realmStage !== 'none') return advanceNekzaliNpcMotion(stepRealm(next, commands, seconds, screenRelative), seconds)
  const roomBounds = { halfWidth: ROOM_RADIUS, halfDepth: ROOM_RADIUS }
  const rawPlayer = screenRelative ? stepScreenRelativeWorldMovement(next.player, commands, seconds, roomBounds, 1, 9) : stepPlayerMovement(next.player, commands, seconds, roomBounds)
  next = { ...next, player: clampCircle(rawPlayer) }
  next = resolveMainCast(next, seconds)
  if (distance(next.player, { x: 0, z: 0 }) < WELL_RADIUS) next = addFailure(next, 'entered-well', 'Entered the Soulcoil Well', 'Keep outside the central well at all times.', true)
  if (next.outcome !== 'active') return next

  if (next.phase === 'phase-1') {
    next = stepPhaseOne(next, seconds)
  } else if (next.phase === 'echo-1' || next.phase === 'echo-2') {
    const burningHit = next.hazards.find(hazard => hazard.kind === 'burning' && next.time - (hazard.createdAt ?? next.time) > .35 && distance(next.player, hazard.position) < hazard.radius + .7)
    if (burningHit) return addFailure(next, 'cremation-ground', 'Stood in a Cremation fire', 'Move away from the corpse after your spread circle explodes.', true)
    const echo = next.phase === 'echo-1' ? 1 : 2
    const echoAge = next.time - next.phaseStartedAt
    if (echoAge < SOUL_TRANSFER_SECONDS && pointToSegmentDistance(next.player, { x: 0, z: 0 }, echoPositions[echo]) < 2.4) next = addFailure(next, 'soul-transfer-line', 'Touched Soul Transfer', 'Move clear of the line between Nek\'zali and the active Echo.', true)
    if (echoAge >= SOUL_TRANSFER_SECONDS + nekzaliTiming(next.projection).pyreSeconds) next = resolveEcho(next, echo)
  } else next = stepPhaseTwo(next, seconds)
  return advanceNekzaliNpcMotion(next, seconds)
}

export function stepNekzaliState(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  return stepNekzali(state, commands, seconds)
}

export function stepNekzaliDiagramState(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  return stepNekzali(state, commands, seconds, true)
}

function npcDestination(member: ContractRaidMember, state: NekzaliState, index: number): WorldPoint {
  if (state.npcRealmGroup !== undefined && groupForSlot(member.id) === state.npcRealmGroup && state.npcRealmStartedAt !== undefined) {
    return { x: 0, z: 0 }
  }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    if (state.time - state.phaseStartedAt < SOUL_TRANSFER_SECONDS) return ambientNpcPosition(member.id, nekzaliMemberPosition(member), state.time, { radius: .85 })
    const echo = state.phase === 'echo-1' ? 1 : 2
    const activeSoak = !cleanupForSlot(member.id)
    if (activeSoak) { const angle = index * .61; return { x: echoPositions[echo].x + Math.cos(angle) * 5.5, z: echoPositions[echo].z + Math.sin(angle) * 5.5 } }
    const spreadGroup = echo
    const availableCorpses = state.corpses.filter(corpse => corpse.group === spreadGroup && !corpse.cremated)
    const controlledSpreads = state.cleanupDuty
    const reserved = controlledSpreads ? availableCorpses.find(corpse => distance(state.player, corpse.position) <= 4) ?? availableCorpses[0] : undefined
    const npcCorpses = availableCorpses.filter(corpse => corpse.id !== reserved?.id)
    const spreadMembers = contractRosterForSlot(state.selectedSlotId).filter(candidate => !candidate.controlled && cleanupForSlot(candidate.id))
    const spreadIndex = spreadMembers.findIndex(candidate => candidate.id === member.id)
    if (spreadIndex >= 0 && spreadIndex < npcCorpses.length) return npcCorpses[spreadIndex].position
    const angle = index * Math.PI * 2 / 19
    return { x: Math.cos(angle) * 32, z: Math.sin(angle) * 32 }
  }
  if (state.rendStartedAt !== undefined && state.rendTargetId === member.id) {
    const age = state.time - state.rendStartedAt
    return rendNpcPositionAt(member.id, age, state.projection)
  }
  if (member.role === 'tank' && member.id === state.barrageTargetId && state.barrageStartedAt !== undefined) {
    const age = state.time - state.barrageStartedAt
    if (age < 6) return npcBarrageDestination
    if (age < 10) {
      const progress = (age - 6) / 4
      const returnPoint = { x: state.boss.x + 4, z: state.boss.z + 3 }
      return { x: npcBarrageDestination.x + (returnPoint.x - npcBarrageDestination.x) * progress, z: npcBarrageDestination.z + (returnPoint.z - npcBarrageDestination.z) * progress }
    }
  }
  if (member.role === 'tank') return member.id === state.aggroOwner ? { x: state.boss.x, z: state.boss.z + 4 } : { x: state.boss.x + 4, z: state.boss.z + 3 }
  if (state.barrageStartedAt !== undefined && state.time - state.barrageStartedAt < 7) {
    const position = state.npcPositions[member.id] ?? nekzaliMemberPosition(member)
    const target = barrageTargetPosition(state)
    if (distance(position, target) < 12 || pointToSegmentDistance(position, state.boss, target) < 5) {
      const angle = Math.atan2(position.z, position.x) + (index % 2 ? .3 : -.3)
      return { x: Math.cos(angle) * 30, z: Math.sin(angle) * 30 }
    }
  }
  return ambientNpcPosition(member.id, nekzaliMemberPosition(member), state.time, { radius: .85 })
}

function npcPosition(member: ContractRaidMember, state: NekzaliState, index: number): WorldPoint {
  return state.npcPositions[member.id] ?? npcDestination(member, state, index)
}

function advanceNekzaliNpcMotion(state: NekzaliState, seconds: number): NekzaliState {
  const roster = contractRosterForSlot(state.selectedSlotId).filter(member => !member.controlled)
  const destinations = Object.fromEntries(roster.map((member, index) => [member.id, npcDestination(member, state, index)]))
  const positions = advanceEntityMotions(state.npcPositions, destinations, seconds, id => ({
    speed: id.startsWith('tank-') ? 7 : 6.6,
    bounds: { halfWidth: ROOM_RADIUS - 1.5, halfDepth: ROOM_RADIUS - 1.5 },
    exclusions: [{ centre: { x: 0, z: 0 }, radius: WELL_RADIUS + 1.2 }],
  }))
  const timeline = roster.reduce((current, member) => setEncounterMovementIntent(current, member.id, destinations[member.id], member.role === 'tank' ? 7 : 6.6, state.npcRealmGroup !== undefined && groupForSlot(member.id) === state.npcRealmGroup ? 'realm-transfer' : 'move'), state.timeline)
  return {
    ...state,
    timeline,
    npcPositions: positions,
  }
}

export function activeNekzaliPrompt(state: NekzaliState) {
  if (state.realmStage === 'pull') return 'Grasping Depths — move into the centre'
  if (state.realmStage === 'returning') return 'Return to the outer realm'
  if (state.realmStage === 'inside') {
    const age = state.time - state.realmStartedAt
    if (state.innerCastStartedAt !== undefined && !state.innerCastInterrupted && state.time - state.innerCastStartedAt < nekzaliTiming(state.projection).drownedEchoInterruptSeconds) return 'Interrupt the Drowned Echo cast'
    if (disruptionStarts(state).some(start => age >= start && age < start + 3)) return 'Nek\'zali disruption — hold Main'
    return `Attack the Drowned Echo · ${state.realmAddHits}/20 hits`
  }
  if (state.npcRealmGroup !== undefined) return `Realm Group ${state.npcRealmGroup} is inside — hold the outer realm`
  if (state.anguishedImpacts.length > 0) return 'Soulcoil Ignition — avoid the Anguished Echo circles'
  if (state.rendStartedAt !== undefined) return state.rendTargetId === state.selectedSlotId ? 'Essence Rend — move out' : 'Essence Rend active'
  if (state.phase === 'phase-1' && ((state.time < 17 && state.time >= 12) || (state.time < 28 && state.time >= 23))) return 'Essence Rend soon'
  if (state.phase === 'phase-1' && state.time >= 35 && state.time < 44) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
  if (state.phase === 'phase-1' && state.time >= 60) {
    if (!state.adds.some(add => add.health > 0)) return 'Prepare for the intermission'
    return state.adds.some(add => add.assignedToPlayer && add.health > 0) ? 'Attack the nearest Amani' : 'Outer raid clearing Amani'
  }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    return state.cleanupDuty ? 'Cremation cleanup — spread to a corpse' : 'Pyre soak — join the main raid'
  }
  if (state.phase === 'phase-2') {
    const age = state.time - state.phaseStartedAt
    if (nekzaliTiming(state.projection).invokeStarts.some(end => age >= end - 5 && age < end)) return 'Invoke — Cultists step clockwise'
    if (age < 5 && age >= 1) return 'Essence Rend soon'
    if (age >= 22 && age < 28) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
    return 'Dodge the Invoke movement'
  }
  return 'Defend the Soulcoil Well'
}

export function nextNekzaliTimer(state: NekzaliState) {
  const timing = nekzaliTiming(state.projection)
  if (state.realmStage === 'pull') return { label: 'Enter Well', seconds: timing.wellEntrySeconds - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'returning') return { label: 'Return', seconds: 5 - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'inside') {
    const age = state.time - state.realmStartedAt
    if (state.innerCastStartedAt !== undefined && !state.innerCastInterrupted && state.time - state.innerCastStartedAt < timing.drownedEchoInterruptSeconds) return { label: 'Interrupt', seconds: timing.drownedEchoInterruptSeconds - (state.time - state.innerCastStartedAt) }
    for (const start of disruptionStarts(state)) if (age >= start && age < start + 3) return { label: 'Disruption', seconds: start + 3 - age }
    return { label: 'Outward spirits', seconds: 10 - age % 10 }
  }
  if (state.rendStartedAt !== undefined) return { label: 'Rend', seconds: nekzaliRendRemaining(state) }
  const phaseAge = state.time - state.phaseStartedAt
  const ignitionStarts = state.phase === 'phase-1' ? timing.phaseOneIgnitionStarts : state.phase === 'phase-2' ? timing.phaseTwoIgnitionStarts : []
  const activeIgnition = ignitionStarts.find(start => phaseAge >= start && phaseAge < start + 4)
  if (activeIgnition !== undefined) return { label: 'Soulcoil Ignition', seconds: activeIgnition + 4 - phaseAge }
  const nextIgnition = ignitionStarts.find(start => start > phaseAge)
  if (nextIgnition !== undefined && nextIgnition - phaseAge <= 8) return { label: 'Soulcoil Ignition in', seconds: nextIgnition - phaseAge }
  if (state.phase === 'phase-1') return state.time < timing.phaseOneRendStarts[0] ? { label: 'Rend in', seconds: timing.phaseOneRendStarts[0] - state.time } : state.time < timing.phaseOneRendStarts[1] ? { label: 'Rend in', seconds: timing.phaseOneRendStarts[1] - state.time } : state.time < 38 ? { label: 'Barrage in', seconds: 38 - state.time } : state.time < 42 ? { label: 'Adds in', seconds: 42 - state.time } : { label: 'Intermission in', seconds: timing.phaseOneSeconds - state.time }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const age = state.time - state.phaseStartedAt
    if (age < SOUL_TRANSFER_SECONDS) return { label: 'Soul Transfer', seconds: SOUL_TRANSFER_SECONDS - age }
    return { label: state.cleanupDuty ? 'Slithering Flame' : 'Hungering Pyre', seconds: timing.pyreSeconds - (age - SOUL_TRANSFER_SECONDS) }
  }
  const age = phaseAge
  for (const start of timing.invokeStarts.map(value => value - 5)) if (age >= start && age < start + 5) return { label: 'Invoke cast', seconds: start + 5 - age }
  const nextInvoke = timing.invokeStarts.map(value => value - 5).find(value => value > age) ?? 65
  return { label: 'Invoke in', seconds: nextInvoke - age }
}

function realmSnapshot(state: NekzaliState, playerHealth: number): Train3DSnapshot {
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const inside = state.realmStage === 'inside' || state.realmStage === 'returning'
  const age = state.time - state.realmStartedAt
  const allyActors: ActorSnapshot[] = inside ? roster.filter(member => !member.controlled && groupForSlot(member.id) === state.wellGroup).map((member, index) => {
    const angle = index / 9 * Math.PI * 2
    return { id: member.id, kind: 'ally', role: member.role, playerClass: member.playerClass, position: { x: Math.cos(angle) * 8.5, z: Math.sin(angle) * 8.5 }, facing: angle + Math.PI, color: trainingClassColors[member.playerClass], auras: [], health: 100 }
  }) : []
  const effects: EffectSnapshot[] = [{ id: 'well-realm-dome', kind: 'dome', position: { x: 0, z: 0 }, radius: REALM_RADIUS, color: '#72d8db', progress: 0 }]
  if (state.realmStage === 'inside') {
    realmHazards(age).forEach((point, index) => effects.push({ id: `well-spirit-${index}`, kind: 'ground-harmful', position: point, radius: index < 8 ? 1.25 : .9, color: '#83e4dd', progress: 0, filled: true }))
  }
  const addHealth = Math.max(0, 100 - state.realmAddHits * 5)
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', role: controlled.role, position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [{ id: 'grasping-depths', tone: 'spectral', stacks: 1 }], health: playerHealth },
    ...(inside && addHealth > 0 ? [{ id: 'drowned-echo', kind: 'enemy' as const, position: { x: 0, z: 0 }, facing: 0, color: '#5fbec5', auras: state.innerCastStartedAt !== undefined && !state.innerCastInterrupted ? [{ id: 'assigned-interrupt', tone: 'danger' as const, stacks: 1 }] : [], health: addHealth }] : []),
    ...allyActors,
  ]
  const combat = inside && addHealth > 0 ? cosmeticClassProjectiles(actors, { x: 0, z: 0 }, state.time) : []
  const mainProjectile = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget
    ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, 1.1)
    : []
  return { time: state.time, timeline: state.timeline, arena: nekzaliArena, actors, effects: [...effects, ...combat, ...mainProjectile] }
}

export function nekzaliSnapshot(state: NekzaliState, playerHealth = 100): Train3DSnapshot {
  if (state.realmStage === 'inside' || state.realmStage === 'returning') return realmSnapshot(state, playerHealth)
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const pyreSeconds = nekzaliTiming(state.projection).pyreSeconds
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).filter(member => !(state.npcRealmGroup !== undefined && state.npcRealmStartedAt !== undefined && state.time - state.npcRealmStartedAt >= 5 && groupForSlot(member.id) === state.npcRealmGroup)).map((member, index) => {
    const position = npcPosition(member, state, index)
    const echoAge = state.time - state.phaseStartedAt
    const carriesCremation = (state.phase === 'echo-1' || state.phase === 'echo-2') && echoAge >= SOUL_TRANSFER_SECONDS && cleanupForSlot(member.id)
    const auras = [
      ...(state.rendStartedAt !== undefined && state.rendTargetId === member.id ? [{ id: 'essence-rend', label: 'Rend', tone: 'danger' as const, stacks: 1, expiresAt: state.rendStartedAt + nekzaliTiming(state.projection).essenceRendPullSeconds + nekzaliTiming(state.projection).essenceRendDebuffSeconds }] : []),
      ...(carriesCremation ? [{ id: 'cremation', label: 'Cremation', tone: 'danger' as const, stacks: 1, expiresAt: state.phaseStartedAt + SOUL_TRANSFER_SECONDS + pyreSeconds }] : []),
    ]
    return { id: member.id, kind: 'ally', role: member.role, position, facing: Math.atan2(state.boss.x - position.x, position.z - state.boss.z), color: trainingClassColors[member.playerClass], playerClass: member.playerClass, auras, health: 100 }
  })
  const addActors: ActorSnapshot[] = state.adds.filter(add => add.health > 0).map(add => ({ id: add.id, kind: 'enemy', position: add.position, facing: Math.atan2(-add.position.x, add.position.z), color: add.assignedToPlayer ? '#f0cf63' : '#6ebeb1', auras: [...(add.assignedToPlayer ? [{ id: 'your-target', tone: 'danger' as const, stacks: 1 }] : []), ...(add.shield > 0 ? [{ id: 'gravebound-advance', tone: 'spectral' as const, stacks: Math.ceil(add.shield) }] : add.crowdControlled ? [{ id: 'crowd-controlled', tone: 'beneficial' as const, stacks: 1 }] : [])], health: add.health }))
  const echo = state.phase === 'echo-1' ? 1 : state.phase === 'echo-2' ? 2 : undefined
  const echoAge = state.time - state.phaseStartedAt
  const echoActor: ActorSnapshot[] = echo ? [{ id: `echo-${echo}`, kind: 'enemy', position: echoPositions[echo], facing: 0, color: '#75d9d5', auras: [], health: Math.max(0, 100 - Math.max(0, echoAge - SOUL_TRANSFER_SECONDS) / pyreSeconds * 100) }] : []
  const effects: EffectSnapshot[] = state.hazards.map(hazard => ({ id: hazard.id, kind: 'ground-harmful', position: hazard.position, radius: hazard.radius, color: hazard.kind === 'burning' ? '#e86f35' : '#4ca99d', progress: (state.time % 1.2) / 1.2, filled: true }))
  state.anguishedImpacts.forEach(impact => effects.push({ id: impact.id, kind: 'ground-harmful', position: impact.position, radius: 5, color: '#5ed1c4', progress: Math.min(1, (state.time - impact.createdAt) / 2), filled: true }))
  state.corpses.filter(corpse => !corpse.cremated).forEach(corpse => effects.push({ id: corpse.id, kind: 'ground-objective', position: corpse.position, radius: 1.8, color: '#c8a77e', progress: 0, filled: false }))
  if (state.realmStage === 'pull') {
    effects.push({ id: 'well-entry', kind: 'ground-soak', position: { x: 0, z: 0 }, radius: WELL_RADIUS, color: '#72d8db', progress: (state.time - state.realmStartedAt) / nekzaliTiming(state.projection).wellEntrySeconds, filled: true })
    effects.push({ id: 'well-entry-arrow', kind: 'arrow', position: state.player, target: { x: 0, z: 0 }, radius: 1, color: '#ffd87a', progress: 0 })
  }
  const barrageAge = state.barrageStartedAt === undefined ? -1 : state.time - state.barrageStartedAt
  if (barrageAge >= 0 && barrageAge < 6) {
    const target = barrageTargetPosition(state)
    for (let index = 0; index < 5; index += 1) if (barrageAge >= index) {
      const progress = Math.min(1, (barrageAge - index) / Math.max(1, 5 - index))
      effects.push({ id: `${state.phase}-barrage-spirit-${index}`, kind: 'projectile', position: state.boss, target, radius: .7, color: '#70d9d2', progress })
      if (progress >= 1 && barrageAge - index < Math.max(1, 5 - index) + .6) effects.push({ id: `${state.phase}-barrage-impact-${index}`, kind: 'ground-harmful', position: target, radius: 10, color: '#70d9d2', progress: 1, filled: false })
    }
  }
  if (echo) {
    const playerSoaks = !state.cleanupDuty
    const age = state.time - state.phaseStartedAt
    if (age < SOUL_TRANSFER_SECONDS) effects.push({ id: `soul-transfer-${echo}`, kind: 'projectile', position: { x: 0, z: 0 }, target: echoPositions[echo], radius: 2.4, color: '#72d8db', progress: age / SOUL_TRANSFER_SECONDS, filled: true })
    else if (playerSoaks) {
      effects.push({ id: `pyre-${echo}`, kind: 'ground-soak', position: echoPositions[echo], radius: 7.5, color: '#ef5c52', progress: (age - SOUL_TRANSFER_SECONDS) / pyreSeconds, filled: distance(state.player, echoPositions[echo]) > 7.5 })
      effects.push({ id: `soak-arrow-${echo}`, kind: 'arrow', position: state.player, target: echoPositions[echo], radius: 1, color: '#ffd87a', progress: 0 })
    }
    else if (age >= SOUL_TRANSFER_SECONDS) {
      effects.push({ id: `spread-${echo}`, kind: 'ground-spread', ownerId: 'controlled-player', position: state.player, radius: 4, color: '#ef5c52', progress: (age - SOUL_TRANSFER_SECONDS) / pyreSeconds, filled: true })
      const contacted = state.corpses.find(corpse => corpse.group === echo && !corpse.cremated && distance(state.player, corpse.position) <= 4)
      if (contacted) effects.push({ id: `corpse-contact-${contacted.id}`, kind: 'ground-objective', position: contacted.position, radius: 2.5, color: '#82e6a9', progress: 0, filled: false })
    }
    if (age >= SOUL_TRANSFER_SECONDS) npcActors.filter(actor => actor.auras.some(aura => aura.id === 'cremation')).forEach(actor => effects.push({ id: `${actor.id}-cremation-ring`, kind: 'ground-spread', ownerId: actor.id, position: actor.position, radius: 4, color: '#ef5c52', progress: (age - SOUL_TRANSFER_SECONDS) / pyreSeconds, filled: true }))
  }
  const activeAdds = addActors.filter(actor => (actor.health ?? 0) > 0)
  const ambientCombat = cosmeticClassProjectiles(npcActors, (_actor, index) => activeAdds[index % Math.max(1, activeAdds.length)]?.position ?? (state.phase.startsWith('echo') ? echoPositions[echo!] : state.boss), state.time)
  const mainProjectile = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget
    ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, 1.1)
    : []
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', role: controlled.role, position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [...(isNekzaliPlayerRendTarget(state) ? [{ id: 'essence-rend', label: 'Rend', tone: 'danger' as const, stacks: 1, expiresAt: state.rendStartedAt! + nekzaliTiming(state.projection).essenceRendPullSeconds + nekzaliTiming(state.projection).essenceRendDebuffSeconds }] : []), ...(state.hollowingApplications.length ? [{ id: 'hollowing-strikes', tone: 'danger' as const, stacks: state.hollowingApplications.length }] : [])], health: playerHealth },
    { id: 'nekzali-boss', kind: 'boss', position: state.boss, facing: 0, color: '#43a8a7', auras: state.ritualBurnApplications.length ? [{ id: 'ritual-burn', tone: 'spectral', stacks: state.ritualBurnApplications.length }] : [], health: state.bossHealth },
    ...npcActors, ...addActors, ...echoActor,
  ]
  return { time: state.time, timeline: state.timeline, arena: nekzaliArena, actors, effects: [...effects, ...ambientCombat, ...mainProjectile] }
}

export const NEKZALI_TIMING = { projections: { learn2d: nekzaliTiming('learn2d'), train3d: nekzaliTiming('train3d') }, wellRadius: WELL_RADIUS, realmRadius: REALM_RADIUS }
