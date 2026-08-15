import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceMainAction, beginMainAction, publishMainProjectile } from '../../platform/combatActions'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { classProjectileEffects, cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { nekzaliArena } from './train3d/arenas'

export type NekzaliPhase = 'phase-1' | 'echo-1' | 'echo-2' | 'phase-2'
export type NekzaliOutcome = 'active' | 'success' | 'wipe'
export type NekzaliRealmStage = 'none' | 'pull' | 'inside' | 'returning'

export interface NekzaliHazard { id: string; position: WorldPoint; radius: number; direction: WorldPoint; kind: 'cultist' | 'burning'; createdAt?: number }
export interface NekzaliAdd { id: string; position: WorldPoint; health: number; assignedToPlayer: boolean; playerDamage: number; corpseGroup: 1 | 2 }
export interface NekzaliCorpse { id: string; position: WorldPoint; group: 1 | 2; cremated: boolean }

export interface NekzaliState {
  time: number
  phase: NekzaliPhase
  phaseStartedAt: number
  player: { x: number; z: number; facing: number }
  boss: WorldPoint
  bossHealth: number
  bossEnergy: number
  selectedSlotId: string
  soakGroup: 1 | 2
  aggroOwner: string
  addsSpawned: boolean
  adds: readonly NekzaliAdd[]
  corpses: readonly NekzaliCorpse[]
  hazards: readonly NekzaliHazard[]
  rendEventIndex: number
  rendTargetId?: string
  rendStartedAt?: number
  rendDrops: number
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
}

const WELL_RADIUS = 6
const REALM_RADIUS = 22
const ROOM_RADIUS = 45
const P1_SECONDS = 90
const ECHO_SECONDS = 10
const REND_SECONDS = 8
const REND_DROPS = 3
const REND_DROP_LEAD_SECONDS = 2
const REALM_ENTRY_SECONDS = 7
const P1_REND_STARTS = [17, 28] as const
const P2_REND_STARTS = [18, 38] as const
const bossHome = { x: 0, z: 18 }
const npcBarrageDestination = { x: 0, z: -41 }
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

function rendTargetForEvent(state: NekzaliState, eventIndex: number) {
  const selectedIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  if ((selectedIndex + eventIndex) % 2 === 0 && state.realmStage !== 'inside' && state.realmStage !== 'returning') return state.selectedSlotId
  return contractRaidRoster[(selectedIndex + 5 + eventIndex * 3) % contractRaidRoster.length].id
}

function rendNpcDropPosition(state: NekzaliState, drop: number): WorldPoint {
  const targetIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.rendTargetId))
  const angle = targetIndex / contractRaidRoster.length * Math.PI * 2 + drop * .38
  return { x: Math.cos(angle) * 40, z: Math.sin(angle) * 40 }
}

function stepEssenceRend(state: NekzaliState, eventIndex: number): NekzaliState {
  let next = state
  if (next.rendEventIndex === eventIndex && next.rendStartedAt === undefined) {
    next = { ...next, rendEventIndex: eventIndex + 1, rendTargetId: rendTargetForEvent(next, eventIndex), rendStartedAt: next.time, rendDrops: 0 }
  }
  if (next.rendStartedAt === undefined) return next
  const age = next.time - next.rendStartedAt
  const dueDrops = age < REND_DROP_LEAD_SECONDS ? 0 : Math.min(REND_DROPS, Math.floor(age - REND_DROP_LEAD_SECONDS) + 1)
  if (dueDrops > next.rendDrops) {
    const hazards = [...next.hazards]
    for (let drop = next.rendDrops + 1; drop <= dueDrops; drop += 1) {
      const position = next.rendTargetId === next.selectedSlotId ? { x: next.player.x, z: next.player.z } : rendNpcDropPosition(next, drop)
      hazards.push({ id: `rend-${eventIndex + 1}-${drop}`, position, radius: 3.2, direction: { x: 0, z: 0 }, kind: 'cultist', createdAt: next.time })
    }
    next = { ...next, hazards, rendDrops: dueDrops }
  }
  if (age < REND_SECONDS) return next
  if (next.rendTargetId === next.selectedSlotId && Math.hypot(next.player.x, next.player.z) < 34) {
    next = addFailure(next, 'rend-inside', 'Essence Rend ended inside the raid', 'Move to the outer edge before the aura expires.', true)
  }
  return { ...next, rendTargetId: undefined, rendStartedAt: undefined }
}

function stepScheduledRend(state: NekzaliState, phaseAge: number, starts: readonly number[], eventOffset: number): NekzaliState {
  if (state.rendStartedAt !== undefined) return stepEssenceRend(state, Math.max(eventOffset, state.rendEventIndex - 1))
  const localIndex = state.rendEventIndex - eventOffset
  if (localIndex < 0 || localIndex >= starts.length || phaseAge < starts[localIndex]) return state
  return stepEssenceRend(state, state.rendEventIndex)
}

export function nekzaliRendRemaining(state: NekzaliState) {
  return state.rendStartedAt === undefined ? 0 : Math.max(0, REND_SECONDS - (state.time - state.rendStartedAt))
}

export function isNekzaliPlayerRendTarget(state: NekzaliState) {
  return state.rendStartedAt !== undefined && state.rendTargetId === state.selectedSlotId
}

export function createNekzaliState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal'): NekzaliState {
  const member = contractSelectedMember(selectedSlotId)
  const start = nekzaliMemberPosition(member)
  return { time: 0, phase: 'phase-1', phaseStartedAt: 0, player: { ...start, facing: 0 }, boss: { ...bossHome }, bossHealth: 100, bossEnergy: 0,
    selectedSlotId, soakGroup: groupForSlot(selectedSlotId), aggroOwner: member.role === 'tank' ? selectedSlotId : 'tank-1', addsSpawned: false, adds: [], corpses: [], hazards: [], rendEventIndex: 0, rendDrops: 0,
    barrageStarted: false, barrageResolved: false, playerAddKills: 0, mainCastRemaining: 0, mainProjectileOrdinal: 0, invokes: 0, outcome: 'active', mistakes: 0, failures: [], trainingDifficulty,
    wellGroup: groupForSlot(selectedSlotId), wellEventIndex: 0, realmStage: 'none', realmStartedAt: 0, realmAddHits: 0, innerCastInterrupted: false, disruptionIndex: 0, soulExhausted: false }
}

export function prepareNekzaliSlot(state: NekzaliState, selectedSlotId: string): NekzaliState {
  return createNekzaliState(selectedSlotId, state.trainingDifficulty)
}

export function turnNekzaliPlayer(state: NekzaliState, yawDelta: number): NekzaliState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export function startNekzaliMainCast(state: NekzaliState): NekzaliState {
  if (state.outcome !== 'active' || state.mainCastRemaining > 0) return state
  if (state.realmStage === 'inside' && state.realmAddHits < 20) return beginMainAction(state, 'drowned-echo')
  if (state.realmStage !== 'none' || state.phase === 'echo-1' || state.phase === 'echo-2') return state
  const closestAdd = state.adds.filter(add => add.health > 0).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
  return beginMainAction(state, closestAdd?.id ?? 'nekzali-boss')
}

export function tauntNekzali(state: NekzaliState): NekzaliState {
  if (contractSelectedMember(state.selectedSlotId).role !== 'tank' || state.phase === 'echo-1' || state.phase === 'echo-2') return state
  return { ...state, aggroOwner: state.selectedSlotId }
}

function addFailure(state: NekzaliState, code: string, label: string, advice: string, terminal = false): NekzaliState {
  if (state.failures[0]?.code === code && state.time - state.failures[0].time < .5) return state
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
  if (state.time - state.innerCastStartedAt >= 5) return state
  return { ...state, innerCastInterrupted: true }
}

function maybeStartRealm(state: NekzaliState): NekzaliState {
  if (state.realmStage !== 'none') return state
  const phaseAge = state.time - state.phaseStartedAt
  const eventGroup = state.phase === 'phase-1' && state.wellEventIndex === 0 && phaseAge >= 45 ? 1
    : state.phase === 'phase-2' && state.wellEventIndex === 1 && phaseAge >= 8 ? 2
      : undefined
  if (!eventGroup) return state
  if (state.wellGroup !== eventGroup) return { ...state, wellEventIndex: state.wellEventIndex + 1 }
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
  const age = Math.max(0, state.time - (state.barrageStartedAt ?? state.time))
  const progress = Math.min(1, age / 4.5)
  const start = { x: bossHome.x, z: bossHome.z + 4 }
  return { x: start.x + (npcBarrageDestination.x - start.x) * progress, z: start.z + (npcBarrageDestination.z - start.z) * progress }
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
  const age = next.time - next.realmStartedAt
  if (next.realmStage === 'pull') {
    const roomBounds = { halfWidth: ROOM_RADIUS, halfDepth: ROOM_RADIUS }
    const moved = screenRelative ? stepScreenRelativeWorldMovement(next.player, commands, seconds, roomBounds, 1, 9) : stepPlayerMovement(next.player, commands, seconds, roomBounds)
    next = { ...next, player: clampCircle(moved) }
    if (distance(next.player, { x: 0, z: 0 }) <= WELL_RADIUS) return { ...next, realmStage: 'inside', realmStartedAt: next.time, player: { x: 0, z: 9, facing: Math.PI } }
    if (age >= REALM_ENTRY_SECONDS) {
      next = addFailure(next, 'missed-realm-entry', 'Missed the Grasping Depths assignment', 'Enter the central Well before the seven-second realm countdown expires.', true)
      return { ...next, realmStage: 'none', mainCastRemaining: 0, mainTargetId: undefined }
    }
    return next
  }
  if (next.realmStage === 'returning') {
    next = resolveMainCast(next, seconds)
    if (age >= 5) return { ...next, realmStage: 'none', realmStartedAt: next.time, player: { x: 0, z: 9, facing: 0 }, soulExhausted: true, mainCastRemaining: 0, mainTargetId: undefined }
    return next
  }

  const realmBounds = { halfWidth: REALM_RADIUS - .5, halfDepth: REALM_RADIUS - .5 }
  const moved = screenRelative ? stepScreenRelativeWorldMovement(next.player, commands, seconds, realmBounds, 1, 9) : stepPlayerMovement(next.player, commands, seconds, realmBounds)
  const radius = Math.hypot(moved.x, moved.z)
  const player = radius > REALM_RADIUS - .5 ? { ...moved, x: moved.x / radius * (REALM_RADIUS - .5), z: moved.z / radius * (REALM_RADIUS - .5) } : moved
  next = { ...next, player }
  if (age >= 4 && next.innerCastStartedAt === undefined) next = { ...next, innerCastStartedAt: next.time }
  if (next.innerCastStartedAt !== undefined && !next.innerCastInterrupted && next.time - next.innerCastStartedAt >= 5) return addFailure({ ...next, innerCastInterrupted: true }, 'missed-well-interrupt', 'Drowned Echo completed its assigned cast', 'Use the Interrupt binding during the five-second cast inside the Well.', true)

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
    return { id: `amani-${index + 1}`, position: { x: Math.cos(angle) * 41, z: Math.sin(angle) * 41 }, health: 100, assignedToPlayer: assignToPlayer && index % 3 === 1, playerDamage: 0, corpseGroup: index % 2 ? 2 : 1 } as NekzaliAdd
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
  if (advanced.completedTargetId === 'nekzali-boss') return publishMainProjectile(state, state.boss)
  let targetIndex = state.adds.findIndex(add => add.id === advanced.completedTargetId && add.health > 0)
  if (targetIndex < 0) {
    const replacement = state.adds.filter(add => add.health > 0).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
    if (!replacement) return state.phase === 'phase-1' || state.phase === 'phase-2' ? publishMainProjectile(state, state.boss) : state
    targetIndex = state.adds.findIndex(add => add.id === replacement.id)
  }
  const target = state.adds[targetIndex]
  const targetHealth = Math.max(0, target.health - 55)
  const killed = targetHealth === 0
  const adds = state.adds.map((add, index) => index === targetIndex ? { ...add, health: targetHealth, playerDamage: add.playerDamage + 55 } : add)
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
    const moved = moveToward(add.position, { x: 0, z: 0 }, 1.25, seconds)
    const npcDps = add.assignedToPlayer ? 2.2 : 7.5
    const health = Math.max(0, add.health - npcDps * seconds)
    if (health <= 0 && add.health > 0) {
      if (add.assignedToPlayer && add.playerDamage > 0) playerAddKills += 1
      corpses.push({ id: `corpse-${add.id}`, position: moved, group: add.corpseGroup, cremated: false })
    }
    return { ...add, position: moved, health }
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

function resolveEcho(state: NekzaliState, echo: 1 | 2): NekzaliState {
  const activeSoakGroup = echo
  const playerSoaks = state.soakGroup === activeSoakGroup
  const echoPosition = echoPositions[echo]
  let next = state
  if (playerSoaks && distance(state.player, echoPosition) > 9) {
    return addFailure(next, 'missed-pyre', `Missed soak group ${echo}`, 'Move into the large filled Hungering Pyre circle assigned before pull.', true)
  }
  const spreadGroup = echo === 1 ? 2 : 1
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
  const ageAfter = state.time - state.phaseStartedAt
  const ageBefore = ageAfter - seconds
  let invokes = state.invokes
  let hazards: NekzaliHazard[] = state.hazards.filter(hazard => hazard.kind === 'cultist').map(hazard => ({ ...hazard, position: { x: hazard.position.x + hazard.direction.x * seconds * (invokes ? 2 : 0), z: hazard.position.z + hazard.direction.z * seconds * (invokes ? 2 : 0) } }))
  for (const boundary of [15, 35, 55]) if (ageBefore < boundary && ageAfter >= boundary) {
    invokes += 1
    hazards = hazards.map((hazard, index) => { const angle = (index * 2.17 + invokes * 1.31) % (Math.PI * 2); return { ...hazard, direction: { x: Math.cos(angle), z: Math.sin(angle) } } })
  }
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
  let next: NekzaliState = { ...state, invokes, hazards, aggroOwner, barrageStarted, barrageResolved, barrageTargetId, barrageStartedAt, boss, bossHealth: Math.max(0, 50 - ageAfter * (50 / 65)), bossEnergy: Math.min(100, invokes * 5) }
  next = stepScheduledRend(next, ageAfter, P2_REND_STARTS, P1_REND_STARTS.length)
  if (!barrageResolved && ageAfter >= 28) {
    const target = barrageTargetPosition(next)
    if (next.barrageTargetId === next.selectedSlotId && distance(next.boss, target) < 24) next = addFailure(next, 'p2-short-barrage', 'Possession Barrage exploded too close to the raid', 'Use the same clear outer tank lane in Phase 2.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && pointToSegmentDistance(next.player, next.boss, target) < 4) next = addFailure(next, 'p2-barrage-impact', 'Hit by a Phase 2 Possession Barrage spirit', 'Stay outside the active tank lane and impact circles.', true)
    next = { ...next, barrageResolved: true }
  }
  const hit = playerPresent ? hazards.find(hazard => next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .8) : undefined
  if (hit) next = addFailure(next, 'cultist-contact', 'Touched a moving Latent Cultist zone', 'Watch Invoke and move through the gap between repositioning hazards.')
  if (next.bossHealth <= 0) next = { ...next, outcome: 'success' }
  return next
}

function stepPhaseOne(state: NekzaliState, seconds: number, playerPresent = true): NekzaliState {
  let next: NekzaliState = { ...state, bossHealth: Math.max(50, 100 - state.time * (50 / P1_SECONDS)) }
  const selected = contractSelectedMember(next.selectedSlotId)
  const aggroTarget = next.aggroOwner === next.selectedSlotId && selected.role === 'tank' && playerPresent ? next.player : bossHome
  next = { ...next, boss: moveToward(next.boss, aggroTarget, 4.5, seconds) }
  next = stepScheduledRend(next, next.time, P1_REND_STARTS, 0)
  const oldRend = playerPresent ? next.hazards.find(hazard => hazard.kind === 'cultist' && next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .7) : undefined
  if (oldRend) next = addFailure(next, 'rend-ground', 'Stayed in an Essence Rend pool', 'Keep moving so every consecutive edge drop lands behind you.', true)
  if (!next.barrageStarted && next.time >= 38) next = beginBarrage(next)
  if (!next.barrageResolved && next.time >= 44) {
    const target = barrageTargetPosition(next)
    if (next.barrageTargetId === next.selectedSlotId && distance(next.boss, target) < 24) next = addFailure(next, 'short-barrage', 'Possession Barrage exploded too close to the raid', 'Run down the clear outer lane while the off-tank keeps Nek\'zali in place.', true)
    if (playerPresent && next.barrageTargetId !== next.selectedSlotId && pointToSegmentDistance(next.player, next.boss, target) < 4) next = addFailure(next, 'barrage-impact', 'Hit by a Possession Barrage spirit', 'Leave the tank lane and the small impact circles.', true)
    next = { ...next, barrageResolved: true }
  }
  if (!next.addsSpawned && next.time >= 60) next = { ...next, addsSpawned: true, adds: spawnAdds(next.wellGroup !== 1) }
  if (next.addsSpawned) next = stepAdds(next, seconds)
  if (playerPresent && next.time >= P1_SECONDS && next.outcome === 'active') next = transitionToIntermission(next)
  return next
}

function stepNekzali(state: NekzaliState, commands: PlayerCommandState, seconds: number, screenRelative = false): NekzaliState {
  if (state.outcome !== 'active') return state
  let next: NekzaliState = maybeStartRealm({ ...state, time: state.time + seconds })
  if (next.realmStage !== 'none') return stepRealm(next, commands, seconds, screenRelative)
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
    if (next.time - next.phaseStartedAt >= ECHO_SECONDS) next = resolveEcho(next, echo)
  } else next = stepPhaseTwo(next, seconds)
  return next
}

export function stepNekzaliState(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  return stepNekzali(state, commands, seconds)
}

export function stepNekzaliDiagramState(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  return stepNekzali(state, commands, seconds, true)
}

function npcPosition(member: ContractRaidMember, state: NekzaliState, index: number): WorldPoint {
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const echo = state.phase === 'echo-1' ? 1 : 2
    const activeSoak = groupForSlot(member.id) === echo
    if (activeSoak) { const angle = index * .61; return { x: echoPositions[echo].x + Math.cos(angle) * 5.5, z: echoPositions[echo].z + Math.sin(angle) * 5.5 } }
    const spreadGroup = echo === 1 ? 2 : 1
    const availableCorpses = state.corpses.filter(corpse => corpse.group === spreadGroup && !corpse.cremated)
    const controlledSpreads = state.soakGroup === spreadGroup
    const reserved = controlledSpreads ? availableCorpses.find(corpse => distance(state.player, corpse.position) <= 4) ?? availableCorpses[0] : undefined
    const npcCorpses = availableCorpses.filter(corpse => corpse.id !== reserved?.id)
    const spreadMembers = contractRosterForSlot(state.selectedSlotId).filter(candidate => !candidate.controlled && groupForSlot(candidate.id) === spreadGroup)
    const spreadIndex = spreadMembers.findIndex(candidate => candidate.id === member.id)
    if (spreadIndex >= 0 && spreadIndex < npcCorpses.length) return npcCorpses[spreadIndex].position
    const angle = index * Math.PI * 2 / 19
    return { x: Math.cos(angle) * 32, z: Math.sin(angle) * 32 }
  }
  if (state.rendStartedAt !== undefined && state.rendTargetId === member.id) {
    const targetIndex = Math.max(0, contractRaidRoster.findIndex(candidate => candidate.id === member.id))
    const baseAngle = targetIndex / contractRaidRoster.length * Math.PI * 2
    const age = state.time - state.rendStartedAt
    const progress = Math.min(1, (state.time - state.rendStartedAt) / 2.5)
    const start = nekzaliMemberPosition(member)
    const entry = { x: Math.cos(baseAngle) * 40, z: Math.sin(baseAngle) * 40 }
    if (progress < 1) return { x: start.x + (entry.x - start.x) * progress, z: start.z + (entry.z - start.z) * progress }
    const angle = baseAngle + Math.max(0, age - 2.5) * .38
    return { x: Math.cos(angle) * 40, z: Math.sin(angle) * 40 }
  }
  if (member.role === 'tank' && member.id === state.barrageTargetId && state.barrageStartedAt !== undefined) {
    const age = state.time - state.barrageStartedAt
    if (age < 6) return barrageTargetPosition(state)
    if (age < 10) {
      const progress = (age - 6) / 4
      const returnPoint = { x: state.boss.x + 4, z: state.boss.z + 3 }
      return { x: npcBarrageDestination.x + (returnPoint.x - npcBarrageDestination.x) * progress, z: npcBarrageDestination.z + (returnPoint.z - npcBarrageDestination.z) * progress }
    }
  }
  if (member.role === 'tank') return member.id === state.aggroOwner ? { x: state.boss.x, z: state.boss.z + 4 } : { x: state.boss.x + 4, z: state.boss.z + 3 }
  return nekzaliMemberPosition(member)
}

export function activeNekzaliPrompt(state: NekzaliState) {
  if (state.realmStage === 'pull') return 'Grasping Depths — move into the centre'
  if (state.realmStage === 'returning') return 'Return to the outer realm'
  if (state.realmStage === 'inside') {
    const age = state.time - state.realmStartedAt
    if (state.innerCastStartedAt !== undefined && !state.innerCastInterrupted && state.time - state.innerCastStartedAt < 5) return 'Interrupt the Drowned Echo cast'
    if (disruptionStarts(state).some(start => age >= start && age < start + 3)) return 'Nek\'zali disruption — hold Main'
    return `Attack the Drowned Echo · ${state.realmAddHits}/20 hits`
  }
  if (state.rendStartedAt !== undefined) return state.rendTargetId === state.selectedSlotId ? 'Essence Rend — move out' : 'Essence Rend active'
  if (state.phase === 'phase-1' && ((state.time < 17 && state.time >= 12) || (state.time < 28 && state.time >= 23))) return 'Essence Rend soon'
  if (state.phase === 'phase-1' && state.time >= 35 && state.time < 44) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
  if (state.phase === 'phase-1' && state.time >= 60) {
    if (!state.adds.some(add => add.health > 0)) return 'Prepare for the intermission'
    return state.adds.some(add => add.assignedToPlayer && add.health > 0) ? 'Attack the nearest Amani' : 'Outer raid clearing Amani'
  }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const echo = state.phase === 'echo-1' ? 1 : 2
    return state.soakGroup === echo ? 'Join your soak' : 'Spread to a corpse'
  }
  if (state.phase === 'phase-2') {
    const age = state.time - state.phaseStartedAt
    if ([10, 30, 50].some(start => age >= start && age < start + 5)) return 'Invoke — hazards will move'
    if (age < 5 && age >= 1) return 'Essence Rend soon'
    if (age >= 22 && age < 28) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
    return 'Dodge the Invoke movement'
  }
  return 'Defend the Soulcoil Well'
}

export function nextNekzaliTimer(state: NekzaliState) {
  if (state.realmStage === 'pull') return { label: 'Enter Well', seconds: REALM_ENTRY_SECONDS - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'returning') return { label: 'Return', seconds: 5 - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'inside') {
    const age = state.time - state.realmStartedAt
    if (state.innerCastStartedAt !== undefined && !state.innerCastInterrupted && state.time - state.innerCastStartedAt < 5) return { label: 'Interrupt', seconds: 5 - (state.time - state.innerCastStartedAt) }
    for (const start of disruptionStarts(state)) if (age >= start && age < start + 3) return { label: 'Disruption', seconds: start + 3 - age }
    return { label: 'Outward spirits', seconds: 10 - age % 10 }
  }
  if (state.rendStartedAt !== undefined) return { label: 'Rend', seconds: nekzaliRendRemaining(state) }
  if (state.phase === 'phase-1') return state.time < 17 ? { label: 'Rend in', seconds: 17 - state.time } : state.time < 28 ? { label: 'Rend in', seconds: 28 - state.time } : state.time < 38 ? { label: 'Barrage in', seconds: 38 - state.time } : state.time < 60 ? { label: 'Adds in', seconds: 60 - state.time } : { label: 'Intermission in', seconds: 90 - state.time }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const echo = state.phase === 'echo-1' ? 1 : 2
    return { label: state.soakGroup === echo ? 'Hungering Pyre' : 'Slithering Flame', seconds: ECHO_SECONDS - (state.time - state.phaseStartedAt) }
  }
  const age = state.time - state.phaseStartedAt
  for (const start of [10, 30, 50]) if (age >= start && age < start + 5) return { label: 'Invoke cast', seconds: start + 5 - age }
  const nextInvoke = [10, 30, 50].find(value => value > age) ?? 65
  return { label: 'Invoke in', seconds: nextInvoke - age }
}

function realmSnapshot(state: NekzaliState, playerHealth: number): Train3DSnapshot {
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const inside = state.realmStage === 'inside' || state.realmStage === 'returning'
  const age = state.time - state.realmStartedAt
  const allyActors: ActorSnapshot[] = inside ? roster.filter(member => !member.controlled && groupForSlot(member.id) === state.wellGroup).map((member, index) => {
    const angle = index / 9 * Math.PI * 2
    return { id: member.id, kind: 'ally', playerClass: member.playerClass, position: { x: Math.cos(angle) * 8.5, z: Math.sin(angle) * 8.5 }, facing: angle + Math.PI, color: trainingClassColors[member.playerClass], auras: [], health: 100 }
  }) : []
  const effects: EffectSnapshot[] = [{ id: 'well-realm-dome', kind: 'dome', position: { x: 0, z: 0 }, radius: REALM_RADIUS, color: '#72d8db', progress: 0 }]
  if (state.realmStage === 'inside') {
    realmHazards(age).forEach((point, index) => effects.push({ id: `well-spirit-${index}`, kind: 'ground-harmful', position: point, radius: index < 8 ? 1.25 : .9, color: '#83e4dd', progress: 0, filled: true }))
  }
  const addHealth = Math.max(0, 100 - state.realmAddHits * 5)
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [{ id: 'grasping-depths', tone: 'spectral', stacks: 1 }], health: playerHealth },
    ...(inside && addHealth > 0 ? [{ id: 'drowned-echo', kind: 'enemy' as const, position: { x: 0, z: 0 }, facing: 0, color: '#5fbec5', auras: state.innerCastStartedAt !== undefined && !state.innerCastInterrupted ? [{ id: 'assigned-interrupt', tone: 'danger' as const, stacks: 1 }] : [], health: addHealth }] : []),
    ...allyActors,
  ]
  const combat = inside && addHealth > 0 ? cosmeticClassProjectiles(actors, { x: 0, z: 0 }, state.time) : []
  const mainProjectile = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget
    ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, 1.1)
    : []
  return { time: state.time, arena: nekzaliArena, actors, effects: [...effects, ...combat, ...mainProjectile] }
}

export function nekzaliSnapshot(state: NekzaliState, playerHealth = 100): Train3DSnapshot {
  if (state.realmStage === 'inside' || state.realmStage === 'returning') return realmSnapshot(state, playerHealth)
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).map((member, index) => {
    const position = npcPosition(member, state, index)
    const auras = state.rendStartedAt !== undefined && state.rendTargetId === member.id ? [{ id: 'essence-rend', tone: 'danger' as const, stacks: 1 }] : []
    return { id: member.id, kind: 'ally', position, facing: Math.atan2(state.boss.x - position.x, position.z - state.boss.z), color: trainingClassColors[member.playerClass], playerClass: member.playerClass, auras, health: 100 }
  })
  const addActors: ActorSnapshot[] = state.adds.filter(add => add.health > 0).map(add => ({ id: add.id, kind: 'enemy', position: add.position, facing: Math.atan2(-add.position.x, add.position.z), color: add.assignedToPlayer ? '#f0cf63' : '#6ebeb1', auras: add.assignedToPlayer ? [{ id: 'your-target', tone: 'danger', stacks: 1 }] : [], health: add.health }))
  const echo = state.phase === 'echo-1' ? 1 : state.phase === 'echo-2' ? 2 : undefined
  const echoActor: ActorSnapshot[] = echo ? [{ id: `echo-${echo}`, kind: 'enemy', position: echoPositions[echo], facing: 0, color: '#75d9d5', auras: [], health: Math.max(0, 100 - (state.time - state.phaseStartedAt) / ECHO_SECONDS * 100) }] : []
  const effects: EffectSnapshot[] = state.hazards.map(hazard => ({ id: hazard.id, kind: 'ground-harmful', position: hazard.position, radius: hazard.radius, color: hazard.kind === 'burning' ? '#e86f35' : '#4ca99d', progress: (state.time % 1.2) / 1.2, filled: true }))
  state.corpses.filter(corpse => !corpse.cremated).forEach(corpse => effects.push({ id: corpse.id, kind: 'ground-objective', position: corpse.position, radius: 1.8, color: '#c8a77e', progress: 0, filled: false }))
  if (state.realmStage === 'pull') {
    effects.push({ id: 'well-entry', kind: 'ground-soak', position: { x: 0, z: 0 }, radius: WELL_RADIUS, color: '#72d8db', progress: (state.time - state.realmStartedAt) / REALM_ENTRY_SECONDS, filled: true })
    effects.push({ id: 'well-entry-arrow', kind: 'arrow', position: state.player, target: { x: 0, z: 0 }, radius: 1, color: '#ffd87a', progress: 0 })
  }
  const barrageAge = state.barrageStartedAt === undefined ? -1 : state.time - state.barrageStartedAt
  if (barrageAge >= 0 && barrageAge < 6) {
    const target = barrageTargetPosition(state)
    for (let index = 0; index < 5; index += 1) if (barrageAge >= index) effects.push({ id: `${state.phase}-barrage-spirit-${index}`, kind: 'projectile', position: state.boss, target, radius: .7, color: '#70d9d2', progress: Math.min(1, (barrageAge - index) / Math.max(1, 5 - index)) })
  }
  if (echo) {
    const playerSoaks = state.soakGroup === echo
    const age = state.time - state.phaseStartedAt
    if (playerSoaks) {
      effects.push({ id: `pyre-${echo}`, kind: 'ground-soak', position: echoPositions[echo], radius: 9, color: '#ef5c52', progress: age / ECHO_SECONDS, filled: distance(state.player, echoPositions[echo]) > 9 })
      effects.push({ id: `soak-arrow-${echo}`, kind: 'arrow', position: state.player, target: echoPositions[echo], radius: 1, color: '#ffd87a', progress: 0 })
    }
    else {
      effects.push({ id: `spread-${echo}`, kind: 'ground-spread', position: state.player, radius: 4, color: '#ef5c52', progress: age / ECHO_SECONDS, filled: true })
      const contacted = state.corpses.find(corpse => corpse.group === (echo === 1 ? 2 : 1) && !corpse.cremated && distance(state.player, corpse.position) <= 4)
      if (contacted) effects.push({ id: `corpse-contact-${contacted.id}`, kind: 'ground-objective', position: contacted.position, radius: 2.5, color: '#82e6a9', progress: 0, filled: false })
    }
  }
  const activeAdds = addActors.filter(actor => (actor.health ?? 0) > 0)
  const ambientCombat = cosmeticClassProjectiles(npcActors, (_actor, index) => activeAdds[index % Math.max(1, activeAdds.length)]?.position ?? (state.phase.startsWith('echo') ? echoPositions[echo!] : state.boss), state.time)
  const mainProjectile = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget
    ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, 1.1)
    : []
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: isNekzaliPlayerRendTarget(state) ? [{ id: 'essence-rend', tone: 'danger', stacks: 1 }] : [], health: playerHealth },
    { id: 'nekzali-boss', kind: 'boss', position: state.boss, facing: 0, color: '#43a8a7', auras: [], health: state.bossHealth },
    ...npcActors, ...addActors, ...echoActor,
  ]
  return { time: state.time, arena: nekzaliArena, actors, effects: [...effects, ...ambientCombat, ...mainProjectile] }
}

export const NEKZALI_TIMING = { phaseOneSeconds: P1_SECONDS, echoSeconds: ECHO_SECONDS, wellRadius: WELL_RADIUS, realmRadius: REALM_RADIUS, realmEntrySeconds: REALM_ENTRY_SECONDS, rendSeconds: REND_SECONDS, rendDropLeadSeconds: REND_DROP_LEAD_SECONDS }
