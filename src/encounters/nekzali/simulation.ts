import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
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
  lastRendDrop: number
  barrageStarted: boolean
  barrageResolved: boolean
  playerAddKills: number
  mainCastRemaining: number
  mainTargetId?: string
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
const ROOM_RADIUS = 45
const P1_SECONDS = 90
const ECHO_SECONDS = 12
const bossHome = { x: 0, z: 18 }
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

export function createNekzaliState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal'): NekzaliState {
  const member = contractSelectedMember(selectedSlotId)
  const start = nekzaliMemberPosition(member)
  return { time: 0, phase: 'phase-1', phaseStartedAt: 0, player: { ...start, facing: 0 }, boss: { ...bossHome }, bossHealth: 100, bossEnergy: 0,
    selectedSlotId, soakGroup: groupForSlot(selectedSlotId), aggroOwner: member.role === 'tank' ? selectedSlotId : 'tank-1', addsSpawned: false, adds: [], corpses: [], hazards: [], lastRendDrop: -1,
    barrageStarted: false, barrageResolved: false, playerAddKills: 0, mainCastRemaining: 0, invokes: 0, outcome: 'active', mistakes: 0, failures: [], trainingDifficulty,
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
  if (state.realmStage === 'inside' && state.realmAddHits < 20) return { ...state, mainCastRemaining: 1, mainTargetId: 'drowned-echo' }
  const assigned = state.adds.filter(add => add.assignedToPlayer && add.health > 0).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
  return { ...state, mainCastRemaining: 1, mainTargetId: assigned?.id }
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
  return { ...state, wellEventIndex: state.wellEventIndex + 1, realmStage: 'pull', realmStartedAt: state.time, realmAddHits: 0, innerCastStartedAt: undefined, innerCastInterrupted: false, disruptionIndex: 0 }
}

function realmHazards(age: number): readonly WorldPoint[] {
  const orbiting = Array.from({ length: 4 }, (_, index) => {
    const angle = age * .48 + index * Math.PI / 2
    return { x: Math.cos(angle) * 5.4, z: Math.sin(angle) * 5.4 }
  })
  const waveAge = age % 10
  const radius = Math.min(12, waveAge * 1.25)
  const outward = [{ x: radius, z: 0 }, { x: -radius, z: 0 }, { x: 0, z: radius }, { x: 0, z: -radius }]
  return [...orbiting, ...outward]
}

function disruptionStarts(state: NekzaliState): readonly [number, number] {
  const slotIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  const first = 9 + (slotIndex * 3 + state.wellEventIndex) % 5
  return [first, first + 13 + (slotIndex + state.wellGroup) % 4]
}

function stepRealm(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  let next = state
  const age = next.time - next.realmStartedAt
  if (next.realmStage === 'pull') {
    const pulled = moveToward(next.player, { x: 0, z: 9 }, 2.4, seconds)
    if (age >= 3) return { ...next, realmStage: 'inside', realmStartedAt: next.time, player: { x: 0, z: 9, facing: Math.PI } }
    return { ...next, player: { ...next.player, ...pulled } }
  }
  if (next.realmStage === 'returning') {
    if (age >= 5) return { ...next, realmStage: 'none', realmStartedAt: next.time, player: { x: 0, z: 9, facing: 0 }, soulExhausted: true, mainCastRemaining: 0, mainTargetId: undefined }
    return next
  }

  const moved = stepPlayerMovement(next.player, commands, seconds, { halfWidth: 11.5, halfDepth: 11.5 })
  const radius = Math.hypot(moved.x, moved.z)
  const player = radius > 11.5 ? { ...moved, x: moved.x / radius * 11.5, z: moved.z / radius * 11.5 } : moved
  next = { ...next, player }
  if (age >= 4 && next.innerCastStartedAt === undefined) next = { ...next, innerCastStartedAt: next.time }
  if (next.innerCastStartedAt !== undefined && !next.innerCastInterrupted && next.time - next.innerCastStartedAt >= 5) return addFailure(next, 'missed-well-interrupt', 'Drowned Echo completed its assigned cast', 'Use the Interrupt binding during the five-second cast inside the Well.', true)

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

function spawnAdds(): readonly NekzaliAdd[] {
  return Array.from({ length: 9 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 9
    return { id: `amani-${index + 1}`, position: { x: Math.cos(angle) * 41, z: Math.sin(angle) * 41 }, health: 100, assignedToPlayer: index % 3 === 1, playerDamage: 0, corpseGroup: index % 2 ? 2 : 1 } as NekzaliAdd
  })
}

function resolveMainCast(state: NekzaliState, seconds: number): NekzaliState {
  if (state.mainCastRemaining <= 0) return state
  const remaining = Math.max(0, state.mainCastRemaining - seconds)
  if (remaining > 0) return { ...state, mainCastRemaining: remaining }
  if (state.mainTargetId === 'drowned-echo') {
    const realmAddHits = Math.min(20, state.realmAddHits + 1)
    return { ...state, realmAddHits, mainCastRemaining: 0, mainTargetId: undefined,
      ...(realmAddHits >= 20 ? { realmStage: 'returning' as const, realmStartedAt: state.time } : {}),
    }
  }
  const targetIndex = state.adds.findIndex(add => add.id === state.mainTargetId && add.health > 0)
  if (targetIndex < 0) return { ...state, mainCastRemaining: 0, mainTargetId: undefined }
  const target = state.adds[targetIndex]
  const targetHealth = Math.max(0, target.health - 55)
  const killed = targetHealth === 0
  const adds = state.adds.map((add, index) => index === targetIndex ? { ...add, health: targetHealth, playerDamage: add.playerDamage + 55 } : add)
  return { ...state, adds, mainCastRemaining: 0, mainTargetId: undefined,
    playerAddKills: state.playerAddKills + Number(killed),
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
  if (state.playerAddKills < 3) return addFailure(state, 'assigned-adds-alive', 'Your three assigned Amani were not defeated', 'Use Main ability twice on each marked add before they reach the Well.', true)
  return { ...state, phase: 'echo-1', phaseStartedAt: state.time, boss: { x: 0, z: 0 }, bossHealth: 50, hazards: state.hazards.filter(hazard => hazard.kind === 'cultist') }
}

function spreadCorpse(state: NekzaliState, group: 1 | 2) {
  return state.corpses.filter(corpse => corpse.group === group && !corpse.cremated).sort((a, b) => distance(state.player, a.position) - distance(state.player, b.position))[0]
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
    const target = spreadCorpse(next, spreadGroup)
    if (target && distance(next.player, target.position) > 4) return addFailure(next, 'uncleared-corpse', 'Amani corpse survived Cremation', 'Spread to the arrowed corpse before Slithering Flame expires.', true)
    const spreadPlayers = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled && groupForSlot(member.id) === spreadGroup)
    if (spreadPlayers.some((member, index) => distance(next.player, npcPosition(member, next, index)) < 6)) return addFailure(next, 'spread-overlap', 'Slithering Flame hit another player', 'Find an unoccupied corpse lane before the red circle expires.', true)
  }
  const playerTarget = !playerSoaks ? spreadCorpse(next, spreadGroup)?.id : undefined
  const corpses = next.corpses.map(corpse => corpse.group === spreadGroup ? { ...corpse, cremated: playerSoaks || corpse.id === playerTarget || groupCorpses.length > 1 } : corpse)
  const burning = groupCorpses.map((corpse, index) => ({ id: `burn-${echo}-${index}`, position: corpse.position, radius: 4, direction: { x: 0, z: 0 }, kind: 'burning' as const, createdAt: next.time }))
  next = { ...next, corpses, hazards: [...next.hazards, ...burning] }
  if (echo === 1) return { ...next, phase: 'echo-2', phaseStartedAt: next.time }
  if (corpses.some(corpse => !corpse.cremated)) return addFailure(next, 'residual-corpses', 'Residual Amani corpses reawakened', 'Both spread groups must Cremate every corpse before Phase 2.', true)
  return { ...next, phase: 'phase-2', phaseStartedAt: next.time, boss: { ...bossHome }, aggroOwner: contractSelectedMember(next.selectedSlotId).role === 'tank' ? next.selectedSlotId : 'tank-1', lastRendDrop: -1, barrageStarted: false, barrageResolved: false }
}

function stepPhaseTwo(state: NekzaliState, seconds: number): NekzaliState {
  const ageAfter = state.time - state.phaseStartedAt
  const ageBefore = ageAfter - seconds
  let invokes = state.invokes
  let hazards: NekzaliHazard[] = state.hazards.filter(hazard => hazard.kind === 'cultist').map(hazard => ({ ...hazard, position: { x: hazard.position.x + hazard.direction.x * seconds * (invokes ? 2 : 0), z: hazard.position.z + hazard.direction.z * seconds * (invokes ? 2 : 0) } }))
  let lastRendDrop = state.lastRendDrop
  if (ageAfter >= 5 && ageAfter < 20) {
    const drop = Math.floor(ageAfter - 5)
    if (drop > lastRendDrop) {
      lastRendDrop = drop
      hazards.push({ id: `p2-rend-${drop}`, position: { x: state.player.x, z: state.player.z }, radius: 3.2, direction: { x: 0, z: 0 }, kind: 'cultist', createdAt: state.time })
    }
  }
  for (const boundary of [15, 35, 55]) if (ageBefore < boundary && ageAfter >= boundary) {
    invokes += 1
    hazards = hazards.map((hazard, index) => { const angle = (index * 2.17 + invokes * 1.31) % (Math.PI * 2); return { ...hazard, direction: { x: Math.cos(angle), z: Math.sin(angle) } } })
  }
  const selected = contractSelectedMember(state.selectedSlotId)
  let aggroOwner = state.aggroOwner
  let barrageStarted = state.barrageStarted
  let barrageResolved = state.barrageResolved
  if (!barrageStarted && ageAfter >= 22) {
    barrageStarted = true
    if (selected.role === 'tank' && aggroOwner === state.selectedSlotId) aggroOwner = state.selectedSlotId === 'tank-1' ? 'tank-2' : 'tank-1'
  }
  const aggroTarget = aggroOwner === state.selectedSlotId && selected.role === 'tank' ? state.player : bossHome
  const boss = moveToward(state.boss, aggroTarget, 4.5, seconds)
  let next: NekzaliState = { ...state, invokes, hazards, lastRendDrop, aggroOwner, barrageStarted, barrageResolved, boss, bossHealth: Math.max(0, 50 - ageAfter * (50 / 65)), bossEnergy: Math.min(100, invokes * 5) }
  if (!barrageResolved && ageAfter >= 28) {
    const target = selected.role === 'tank' ? next.player : { x: 0, z: 38 }
    if (selected.role === 'tank' && distance(next.boss, target) < 24) next = addFailure(next, 'p2-short-barrage', 'Possession Barrage exploded too close to the raid', 'Use the same clear outer tank lane in Phase 2.', true)
    if (selected.role !== 'tank' && distance(next.player, target) < 7) next = addFailure(next, 'p2-barrage-impact', 'Hit by a Phase 2 Possession Barrage spirit', 'Stay outside the active tank lane and impact circles.', true)
    next = { ...next, barrageResolved: true }
  }
  const hit = hazards.find(hazard => next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .8)
  if (hit) next = addFailure(next, 'cultist-contact', 'Touched a moving Latent Cultist zone', 'Watch Invoke and move through the gap between repositioning hazards.')
  if (next.bossHealth <= 0) next = { ...next, outcome: 'success' }
  return next
}

export function stepNekzaliState(state: NekzaliState, commands: PlayerCommandState, seconds: number): NekzaliState {
  if (state.outcome !== 'active') return state
  let next: NekzaliState = maybeStartRealm({ ...state, time: state.time + seconds })
  if (next.realmStage !== 'none') return stepRealm(next, commands, seconds)
  const rawPlayer = stepPlayerMovement(next.player, commands, seconds, { halfWidth: ROOM_RADIUS, halfDepth: ROOM_RADIUS })
  next = { ...next, player: clampCircle(rawPlayer) }
  next = resolveMainCast(next, seconds)
  if (distance(next.player, { x: 0, z: 0 }) < WELL_RADIUS) next = addFailure(next, 'entered-well', 'Entered the Soulcoil Well', 'Keep outside the central well at all times.', true)
  if (next.outcome !== 'active') return next

  if (next.phase === 'phase-1') {
    next = { ...next, bossHealth: Math.max(50, 100 - next.time * (50 / P1_SECONDS)) }
    const selected = contractSelectedMember(next.selectedSlotId)
    const aggroTarget = next.aggroOwner === next.selectedSlotId && selected.role === 'tank' ? next.player : bossHome
    next = { ...next, boss: moveToward(next.boss, aggroTarget, 4.5, seconds) }
    if (next.time >= 17 && next.time < 32) {
      const drop = Math.floor(next.time - 17)
      if (drop > next.lastRendDrop) next = { ...next, lastRendDrop: drop, hazards: [...next.hazards, { id: `rend-${drop}`, position: { x: next.player.x, z: next.player.z }, radius: 3.2, direction: { x: 0, z: 0 }, kind: 'cultist', createdAt: next.time }] }
    }
    const oldRend = next.hazards.find(hazard => hazard.kind === 'cultist' && next.time - (hazard.createdAt ?? -100) > .6 && distance(next.player, hazard.position) < hazard.radius + .7)
    if (oldRend) next = addFailure(next, 'rend-ground', 'Stayed in an Essence Rend pool', 'Keep moving so every consecutive edge drop lands behind you.', true)
    if (state.time < 32 && next.time >= 32 && Math.hypot(next.player.x, next.player.z) < 34) next = addFailure(next, 'rend-inside', 'Essence Rend ended inside the raid', 'Move to the outer edge before the lingering essence expires.', true)
    if (!next.barrageStarted && next.time >= 38) {
      const playerWasAggro = next.aggroOwner === next.selectedSlotId && selected.role === 'tank'
      next = { ...next, barrageStarted: true, aggroOwner: playerWasAggro ? (next.selectedSlotId === 'tank-1' ? 'tank-2' : 'tank-1') : next.aggroOwner }
    }
    if (!next.barrageResolved && next.time >= 44) {
      const target = selected.role === 'tank' ? next.player : { x: 0, z: 38 }
      const separation = distance(next.boss, target)
      if (selected.role === 'tank' && separation < 24) next = addFailure(next, 'short-barrage', 'Possession Barrage exploded too close to the raid', 'Run down the clear outer lane while the off-tank keeps Nek\'zali in place.', true)
      if (selected.role !== 'tank' && distance(next.player, target) < 7) next = addFailure(next, 'barrage-impact', 'Hit by a Possession Barrage spirit', 'Leave the tank lane and the small impact circles.', true)
      next = { ...next, barrageResolved: true }
    }
    if (!next.addsSpawned && next.time >= 60) next = { ...next, addsSpawned: true, adds: spawnAdds() }
    if (next.addsSpawned) next = stepAdds(next, seconds)
    if (next.time >= P1_SECONDS && next.outcome === 'active') next = transitionToIntermission(next)
  } else if (next.phase === 'echo-1' || next.phase === 'echo-2') {
    const burningHit = next.hazards.find(hazard => hazard.kind === 'burning' && next.time - (hazard.createdAt ?? next.time) > .35 && distance(next.player, hazard.position) < hazard.radius + .7)
    if (burningHit) return addFailure(next, 'cremation-ground', 'Stood in a Cremation fire', 'Move away from the corpse after your spread circle explodes.', true)
    const echo = next.phase === 'echo-1' ? 1 : 2
    if (next.time - next.phaseStartedAt >= ECHO_SECONDS) next = resolveEcho(next, echo)
  } else next = stepPhaseTwo(next, seconds)
  return next
}

function npcPosition(member: ContractRaidMember, state: NekzaliState, index: number): WorldPoint {
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const echo = state.phase === 'echo-1' ? 1 : 2
    const activeSoak = groupForSlot(member.id) === echo
    if (activeSoak) { const angle = index * .61; return { x: echoPositions[echo].x + Math.cos(angle) * 5.5, z: echoPositions[echo].z + Math.sin(angle) * 5.5 } }
    const angle = index * Math.PI * 2 / 19
    return { x: Math.cos(angle) * 32, z: Math.sin(angle) * 32 }
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
  if (state.phase === 'phase-1' && state.time < 32 && state.time >= 12) return 'Take Essence Rend to the edge'
  if (state.phase === 'phase-1' && state.time >= 35 && state.time < 44) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
  if (state.phase === 'phase-1' && state.time >= 60) return `Kill your marked Amani · ${state.playerAddKills}/3`
  if (state.phase === 'echo-1' || state.phase === 'echo-2') {
    const echo = state.phase === 'echo-1' ? 1 : 2
    return state.soakGroup === echo ? `Soak with group ${echo}` : 'Spread onto an Amani corpse'
  }
  if (state.phase === 'phase-2') {
    const age = state.time - state.phaseStartedAt
    if ([10, 30, 50].some(start => age >= start && age < start + 5)) return 'Invoke — hazards will move'
    if (age >= 5 && age < 20) return 'Take Essence Rend to the edge'
    if (age >= 22 && age < 28) return contractSelectedMember(state.selectedSlotId).role === 'tank' ? 'Carry Barrage away from the raid' : 'Clear the tank lane'
    return 'Dodge the Invoke movement'
  }
  return 'Defend the Soulcoil Well'
}

export function nextNekzaliTimer(state: NekzaliState) {
  if (state.realmStage === 'pull') return { label: 'Realm entry', seconds: 3 - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'returning') return { label: 'Return', seconds: 5 - (state.time - state.realmStartedAt) }
  if (state.realmStage === 'inside') {
    const age = state.time - state.realmStartedAt
    if (state.innerCastStartedAt !== undefined && !state.innerCastInterrupted && state.time - state.innerCastStartedAt < 5) return { label: 'Interrupt', seconds: 5 - (state.time - state.innerCastStartedAt) }
    for (const start of disruptionStarts(state)) if (age >= start && age < start + 3) return { label: 'Disruption', seconds: start + 3 - age }
    return { label: 'Outward spirits', seconds: 10 - age % 10 }
  }
  if (state.phase === 'phase-1') return state.time < 17 ? { label: 'Rend', seconds: 17 - state.time } : state.time < 38 ? { label: 'Barrage', seconds: 38 - state.time } : state.time < 60 ? { label: 'Adds', seconds: 60 - state.time } : { label: 'Intermission', seconds: 90 - state.time }
  if (state.phase === 'echo-1' || state.phase === 'echo-2') return { label: 'Pyre', seconds: ECHO_SECONDS - (state.time - state.phaseStartedAt) }
  const age = state.time - state.phaseStartedAt
  for (const start of [10, 30, 50]) if (age >= start && age < start + 5) return { label: 'Invoke cast', seconds: start + 5 - age }
  const nextInvoke = [10, 30, 50].find(value => value > age) ?? 65
  return { label: 'Invoke', seconds: nextInvoke - age }
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
  const effects: EffectSnapshot[] = [{ id: 'well-realm-dome', kind: 'dome', position: { x: 0, z: 0 }, radius: 12, color: '#72d8db', progress: 0 }]
  if (state.realmStage === 'inside') {
    realmHazards(age).forEach((point, index) => effects.push({ id: `well-spirit-${index}`, kind: index < 4 ? 'ground-harmful' : 'projectile', position: point, radius: index < 4 ? 1.25 : .72, color: '#83e4dd', progress: 0, filled: true }))
  }
  const addHealth = Math.max(0, 100 - state.realmAddHits * 5)
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [{ id: 'grasping-depths', tone: 'spectral', stacks: 1 }], health: playerHealth },
    ...(inside && addHealth > 0 ? [{ id: 'drowned-echo', kind: 'enemy' as const, position: { x: 0, z: 0 }, facing: 0, color: '#5fbec5', auras: state.innerCastStartedAt !== undefined && !state.innerCastInterrupted ? [{ id: 'assigned-interrupt', tone: 'danger' as const, stacks: 1 }] : [], health: addHealth }] : []),
    ...allyActors,
  ]
  const combat = inside && addHealth > 0 ? cosmeticClassProjectiles(actors, { x: 0, z: 0 }, state.time) : []
  return { time: state.time, arena: nekzaliArena, actors, effects: [...effects, ...combat] }
}

export function nekzaliSnapshot(state: NekzaliState, playerHealth = 100): Train3DSnapshot {
  if (state.realmStage !== 'none') return realmSnapshot(state, playerHealth)
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).map((member, index) => {
    const position = npcPosition(member, state, index)
    return { id: member.id, kind: 'ally', position, facing: Math.atan2(state.boss.x - position.x, position.z - state.boss.z), color: trainingClassColors[member.playerClass], playerClass: member.playerClass, auras: [], health: 100 }
  })
  const addActors: ActorSnapshot[] = state.adds.filter(add => add.health > 0).map(add => ({ id: add.id, kind: 'enemy', position: add.position, facing: Math.atan2(-add.position.x, add.position.z), color: add.assignedToPlayer ? '#f0cf63' : '#6ebeb1', auras: add.assignedToPlayer ? [{ id: 'your-target', tone: 'danger', stacks: 1 }] : [], health: add.health }))
  const echo = state.phase === 'echo-1' ? 1 : state.phase === 'echo-2' ? 2 : undefined
  const echoActor: ActorSnapshot[] = echo ? [{ id: `echo-${echo}`, kind: 'enemy', position: echoPositions[echo], facing: 0, color: '#75d9d5', auras: [], health: Math.max(0, 100 - (state.time - state.phaseStartedAt) / ECHO_SECONDS * 100) }] : []
  const effects: EffectSnapshot[] = state.hazards.map(hazard => ({ id: hazard.id, kind: 'ground-harmful', position: hazard.position, radius: hazard.radius, color: hazard.kind === 'burning' ? '#e86f35' : '#4ca99d', progress: (state.time % 1.2) / 1.2, filled: true }))
  state.corpses.filter(corpse => !corpse.cremated).forEach(corpse => effects.push({ id: corpse.id, kind: 'ground-harmful', position: corpse.position, radius: 1.8, color: '#867267', progress: 0, filled: false }))
  const barrageAge = state.phase === 'phase-1' ? state.time - 38 : state.phase === 'phase-2' ? state.time - state.phaseStartedAt - 22 : -1
  if (barrageAge >= 0 && barrageAge < 6) {
    const target = controlled.role === 'tank' ? state.player : { x: 0, z: 38 }
    for (let index = 0; index < 5; index += 1) if (barrageAge >= index) effects.push({ id: `${state.phase}-barrage-spirit-${index}`, kind: 'projectile', position: state.boss, target, radius: .7, color: '#70d9d2', progress: Math.min(1, (barrageAge - index) / Math.max(1, 5 - index)) })
  }
  if (echo) {
    const playerSoaks = state.soakGroup === echo
    const age = state.time - state.phaseStartedAt
    effects.push({ id: `pyre-${echo}`, kind: 'ground-soak', position: echoPositions[echo], radius: 9, color: '#ef5c52', progress: age / ECHO_SECONDS, filled: playerSoaks && distance(state.player, echoPositions[echo]) > 9 })
    if (playerSoaks) effects.push({ id: `soak-arrow-${echo}`, kind: 'arrow', position: state.player, target: echoPositions[echo], radius: 1, color: '#ffd87a', progress: 0 })
    else {
      effects.push({ id: `spread-${echo}`, kind: 'ground-spread', position: state.player, radius: 4, color: '#ef5c52', progress: age / ECHO_SECONDS, filled: true })
      const target = spreadCorpse(state, echo === 1 ? 2 : 1)
      if (target) effects.push({ id: `corpse-arrow-${echo}`, kind: 'arrow', position: state.player, target: target.position, radius: 1, color: '#ffbd5e', progress: 0 })
    }
  }
  const activeAdds = addActors.filter(actor => (actor.health ?? 0) > 0)
  const ambientCombat = npcActors.flatMap((actor, index) => cosmeticClassProjectiles([actor], activeAdds[index % Math.max(1, activeAdds.length)]?.position ?? (state.phase.startsWith('echo') ? echoPositions[echo!] : state.boss), state.time))
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [], health: playerHealth },
    { id: 'nekzali-boss', kind: 'boss', position: state.boss, facing: 0, color: '#43a8a7', auras: [], health: state.bossHealth },
    ...npcActors, ...addActors, ...echoActor,
  ]
  return { time: state.time, arena: nekzaliArena, actors, effects: [...effects, ...ambientCombat] }
}

export const NEKZALI_TIMING = { phaseOneSeconds: P1_SECONDS, echoSeconds: ECHO_SECONDS, wellRadius: WELL_RADIUS }
