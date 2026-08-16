import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceMainAction, beginMainAction, publishMainProjectile } from '../../platform/combatActions'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { classProjectileEffects, cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { sentinelsArena } from './train3d/arenas'
import { beginEncounterAction, coreEncounterEntities, createEncounterTimeline, type EncounterTimelineState } from '../../platform/encounters/timeline'
import { advanceAmbientNpcTimeline, ambientNpcPosition } from '../../platform/encounters/ambientNpc'

export type SentinelSide = 'acid' | 'blood'
export type SentinelsPhase = 'active' | 'stasis'
export type SentinelsOutcome = 'active' | 'success' | 'wipe'

export interface DropletState { id: string; position: WorldPoint; assignedToPlayer: boolean; soaked: boolean; soakedAt?: number }
export interface BloodPoolState { id: string; position: WorldPoint; createdAt: number }

export interface SentinelsState {
  time: number
  timeline: EncounterTimelineState
  phase: SentinelsPhase
  phaseStartedAt: number
  cycle: 1 | 2
  trainingDifficulty: TrainingDifficulty
  selectedSlotId: string
  assignedSide: SentinelSide
  player: { x: number; z: number; facing: number }
  acidBoss: WorldPoint
  bloodBoss: WorldPoint
  acidHealth: number
  bloodHealth: number
  energy: number
  acidMarks: number
  bloodMarks: number
  lastMarkAt: number
  droplets: readonly DropletState[]
  dropletsSpawned: boolean
  dropletsSpawnedAt?: number
  miasmaResolved: boolean
  puddleDropAt?: number
  npcPoolsDropped: boolean
  pools: readonly BloodPoolState[]
  blightedActive: boolean
  blightedResolved: boolean
  protovenomActive: boolean
  protovenomResolved: boolean
  helicalResolved: boolean
  helicalResolvedAt?: number
  coagulationHealth: number
  coagulationFailed: boolean
  mainCastRemaining: number
  mainTargetId?: string
  mainProjectileFiredAt?: number
  mainProjectileOrigin?: WorldPoint
  mainProjectileTarget?: WorldPoint
  mainProjectileOrdinal: number
  outcome: SentinelsOutcome
  outcomeReason?: string
  mistakes: number
  failures: readonly RuntimeFailure[]
}

const ACID_HOME = { x: 50, z: 0 }
const BLOOD_HOME = { x: -50, z: 0 }
const STASIS_ACID = { x: -5, z: 0 }
const STASIS_BLOOD = { x: 5, z: 0 }
const FIRST_ACTIVE_SECONDS = 60
const SECOND_ACTIVE_SECONDS = 72
const STASIS_SECONDS = 15
const DOMINANCE_YARDS = 40

function sideForSlot(slotId: string, cycle: 1 | 2): SentinelSide {
  const index = Math.max(0, contractRaidRoster.findIndex(member => member.id === slotId))
  const first: SentinelSide = index % 2 === 0 ? 'acid' : 'blood'
  return cycle === 1 ? first : first === 'acid' ? 'blood' : 'acid'
}

function homeForSide(side: SentinelSide, cycle: 1 | 2): WorldPoint {
  const swapped = cycle === 2
  if (side === 'acid') return swapped ? BLOOD_HOME : ACID_HOME
  return swapped ? ACID_HOME : BLOOD_HOME
}

function towardCentre(home: WorldPoint, yards: number): number {
  return home.x + (home.x > 0 ? -yards : yards)
}

function playerStart(slotId: string, cycle: 1 | 2): { x: number; z: number; facing: number } {
  const member = contractSelectedMember(slotId)
  const side = sideForSlot(slotId, cycle)
  const home = homeForSide(side, cycle)
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, cycle) === side && candidate.role === member.role)
  const index = Math.max(0, peers.findIndex(candidate => candidate.id === slotId))
  const row = member.role === 'tank' ? 4 : member.role === 'melee' ? 8 : 15
  return { x: towardCentre(home, row), z: (index - (peers.length - 1) / 2) * 4, facing: home.x > 0 ? -Math.PI / 2 : Math.PI / 2 }
}

export function createSentinelsState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal'): SentinelsState {
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== selectedSlotId).map(member => member.id), ['breath-of-ulatek', 'blood-of-ulatek'], sentinelsArena.id))
  return {
    time: 0, timeline, phase: 'active', phaseStartedAt: 0, cycle: 1, trainingDifficulty, selectedSlotId,
    assignedSide: sideForSlot(selectedSlotId, 1), player: playerStart(selectedSlotId, 1),
    acidBoss: { ...ACID_HOME }, bloodBoss: { ...BLOOD_HOME }, acidHealth: 100, bloodHealth: 100, energy: 50,
    acidMarks: 0, bloodMarks: 0, lastMarkAt: 0, droplets: [], dropletsSpawned: false,
    miasmaResolved: false, npcPoolsDropped: false, pools: [], blightedActive: false, blightedResolved: false,
    protovenomActive: false, protovenomResolved: false, helicalResolved: false,
    coagulationHealth: 100, coagulationFailed: false, mainCastRemaining: 0, mainProjectileOrdinal: 0,
    outcome: 'active', mistakes: 0, failures: [],
  }
}

export function prepareSentinelsSlot(state: SentinelsState, selectedSlotId: string): SentinelsState {
  return createSentinelsState(selectedSlotId, state.trainingDifficulty)
}

export function turnSentinelsPlayer(state: SentinelsState, yawDelta: number): SentinelsState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export function startSentinelsMainCast(state: SentinelsState): SentinelsState {
  if (state.outcome !== 'active' || state.mainCastRemaining > 0) return state
  const phaseAge = state.time - state.phaseStartedAt
  const addActive = state.phase === 'active' && phaseAge >= 8 && state.coagulationHealth > 0
  const targetId = addActive ? 'venom-coagulation' : state.assignedSide === 'acid' ? 'breath-of-ulatek' : 'blood-of-ulatek'
  const next = beginMainAction(state, targetId, .7)
  return next === state ? state : { ...next, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'main-ability', .7, targetId) }
}

function stepMainCast(state: SentinelsState, seconds: number): SentinelsState {
  const advanced = advanceMainAction(state, seconds)
  if (!advanced.completedTargetId) return advanced.state
  state = advanced.state
  const target = advanced.completedTargetId === 'venom-coagulation'
    ? { x: towardCentre(homeForSide('acid', state.cycle), 15), z: 18 }
    : advanced.completedTargetId === 'breath-of-ulatek' ? state.acidBoss : state.bloodBoss
  return {
    ...publishMainProjectile(state, target),
    coagulationHealth: advanced.completedTargetId === 'venom-coagulation' ? Math.max(0, state.coagulationHealth - 20) : state.coagulationHealth,
  }
}

function addFailure(state: SentinelsState, code: string, label: string, advice: string, terminal = false): SentinelsState {
  if (state.failures[0]?.code === code && state.time - state.failures[0].time < .75) return state
  const failure = { id: `sentinels-${code}-${state.time.toFixed(2)}`, code, time: state.time, label, advice }
  const mistakes = state.mistakes + 1
  const wipe = shouldEndTrainingAttempt(state.trainingDifficulty, mistakes, terminal)
  return { ...state, mistakes, failures: [failure, ...state.failures].slice(0, 5), outcome: wipe ? 'wipe' : state.outcome, outcomeReason: wipe ? label : state.outcomeReason }
}

function moveToward(point: WorldPoint, target: WorldPoint, speed: number, seconds: number): WorldPoint {
  const length = distance(point, target)
  if (length === 0 || length <= speed * seconds) return { ...target }
  const scale = speed * seconds / length
  return { x: point.x + (target.x - point.x) * scale, z: point.z + (target.z - point.z) * scale }
}

function isTank(state: SentinelsState) { return contractSelectedMember(state.selectedSlotId).role === 'tank' }
function isHealer(state: SentinelsState) { return contractSelectedMember(state.selectedSlotId).role === 'healer' }

function lineDistance(point: WorldPoint, start: WorldPoint, end: WorldPoint) {
  const dx = end.x - start.x; const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  const amount = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared)) : 0
  return distance(point, { x: start.x + dx * amount, z: start.z + dz * amount })
}

function spawnDroplets(cycle: 1 | 2): readonly DropletState[] {
  const acidHome = homeForSide('acid', cycle)
  const offsets = [{ inward: 10, z: -12 }, { inward: 17, z: -4 }, { inward: 13, z: 7 }, { inward: 8, z: 14 }]
  return offsets.map((offset, index) => ({
    id: `droplet-${cycle}-${index + 1}`,
    position: { x: acidHome.x + (acidHome.x > 0 ? -offset.inward : offset.inward), z: offset.z },
    assignedToPlayer: index === 1,
    soaked: false,
  }))
}

export function dispelSentinels(state: SentinelsState): SentinelsState {
  if (state.phase !== 'active' || !state.blightedActive || state.blightedResolved || state.assignedSide !== 'blood' || !isHealer(state)) return state
  return { ...state, blightedResolved: true, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'dispel', 0, 'blighted-blood') }
}

function stepActive(state: SentinelsState, commands: PlayerCommandState, seconds: number, screenRelative = false): SentinelsState {
  const phaseAge = state.time - state.phaseStartedAt
  const duration = state.cycle === 1 ? FIRST_ACTIVE_SECONDS : SECOND_ACTIVE_SECONDS
  const member = contractSelectedMember(state.selectedSlotId)
  const bounds = { halfWidth: sentinelsArena.width / 2 - 1.5, halfDepth: sentinelsArena.depth / 2 - 1.5 }
  let player = screenRelative ? stepScreenRelativeWorldMovement(state.player, commands, seconds, bounds, 16 / 9, 7, sentinelsArena) : stepPlayerMovement(state.player, commands, seconds, bounds)
  let acidBoss = state.acidBoss; let bloodBoss = state.bloodBoss
  if (member.role === 'tank') {
    if (state.assignedSide === 'acid') acidBoss = moveToward(acidBoss, player, 5, seconds)
    else bloodBoss = moveToward(bloodBoss, player, 5, seconds)
  } else {
    acidBoss = moveToward(acidBoss, homeForSide('acid', state.cycle), 12, seconds)
    bloodBoss = moveToward(bloodBoss, homeForSide('blood', state.cycle), 12, seconds)
  }
  const energyStart = state.cycle === 1 ? 50 : 0
  const energy = Math.min(100, energyStart + phaseAge / duration * (100 - energyStart))
  const sharedHealth = Math.max(0, state.acidHealth - seconds * .76)
  let next: SentinelsState = stepMainCast({ ...state, player, acidBoss, bloodBoss, energy, acidHealth: sharedHealth, bloodHealth: sharedHealth }, seconds)

  if (phaseAge > 8 && distance(acidBoss, bloodBoss) < DOMINANCE_YARDS) next = addFailure(next, 'dominance', "Ula'tek's Dominance activated", 'Keep the two bosses at least 40 yards apart. Tank players must lead their owned boss back to its outer anchor.', true)

  if (next.time - next.lastMarkAt >= 5) {
    const acidMarks = next.acidMarks + Number(distance(player, acidBoss) <= 40)
    const bloodMarks = next.bloodMarks + Number(distance(player, bloodBoss) <= 40)
    next = { ...next, acidMarks, bloodMarks, lastMarkAt: next.time }
    if (acidMarks > 0 && bloodMarks > 0) next = addFailure(next, 'mixed-marks', 'Collected both Acid and Blood marks', 'Stay with the boss assigned to your current side; do not cross both 40-yard auras during the active cycle.')
  }

  if (!next.dropletsSpawned && phaseAge >= 8 && next.coagulationHealth <= 0) next = { ...next, dropletsSpawned: true, dropletsSpawnedAt: next.time, droplets: spawnDroplets(next.cycle) }
  if (!next.coagulationFailed && !next.dropletsSpawned && phaseAge >= 30 && next.coagulationHealth > 0) next = { ...addFailure(next, 'coagulation-alive', 'Venom Coagulation reached Noxious Blast', 'Target the visible add and complete five Main casts before it releases Toxic Droplets.', true), coagulationFailed: true }
  if (next.dropletsSpawned) {
    let droplets = next.droplets.map(droplet => {
      if (droplet.soaked) return droplet
      if (droplet.assignedToPlayer && next.assignedSide === 'acid' && distance(player, droplet.position) < 2.5) return { ...droplet, soaked: true, soakedAt: next.time }
      if ((!droplet.assignedToPlayer || next.assignedSide !== 'acid') && phaseAge >= 19 + Number(droplet.id.at(-1)) * .25) return { ...droplet, soaked: true, soakedAt: next.time }
      return droplet
    })
    next = { ...next, droplets }
    const missed = droplets.find(droplet => droplet.assignedToPlayer && next.assignedSide === 'acid' && !droplet.soaked)
    if (phaseAge >= 30 && missed) next = addFailure(next, 'droplet-exploded', 'Your Toxic Droplet erupted', 'On the Acid side, step into your assigned green droplet before Noxious Blast.', true)
    const beam = droplets.find(droplet => droplet.soakedAt !== undefined && next.time - droplet.soakedAt > .25 && next.time - droplet.soakedAt < 2)
    if (beam && lineDistance(player, beam.position, acidBoss) < 1.45) next = addFailure(next, 'living-venom', 'Hit by returning Living Venom', 'Clear the droplet, then step out of the visible return beam before the projectile reaches the boss.', true)
  }

  if (!next.miasmaResolved && phaseAge >= 25) {
    const bloodHome = homeForSide('blood', next.cycle)
    const target = { x: towardCentre(bloodHome, 13), z: 16 }
    if (next.assignedSide === 'blood' && distance(player, target) > 7.5) next = addFailure(next, 'missed-miasma', 'Missed the Unstable Miasma group soak', 'Join the filled red soak circle with your Blood-side group before it resolves.', true)
    next = { ...next, miasmaResolved: true, puddleDropAt: next.assignedSide === 'blood' ? next.time + 3 : undefined }
  }
  if (next.puddleDropAt !== undefined && next.time >= next.puddleDropAt) {
    const pool = { id: `blood-pool-${next.cycle}-${next.time.toFixed(1)}`, position: { x: player.x, z: player.z }, createdAt: next.time }
    if (Math.abs(player.x) < 28) next = addFailure(next, 'central-pool', 'Dropped Blood Venom in the central corridor', 'After the group soak, move to the outside wall before the five-second pool aura expires.')
    next = { ...next, puddleDropAt: undefined, pools: [...next.pools, pool] }
  }
  if (next.miasmaResolved && !next.npcPoolsDropped && phaseAge >= 28) {
    const bloodMembers = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled && member.role !== 'tank' && sideForSlot(member.id, next.cycle) === 'blood').slice(0, 3)
    const npcPools = bloodMembers.map((_member, index) => {
      const home = homeForSide('blood', next.cycle)
      return { id: `npc-blood-pool-${next.cycle}-${index + 1}`, position: { x: home.x + (home.x > 0 ? -5 : 5), z: -18 + index * 18 }, createdAt: next.time }
    })
    next = { ...next, npcPoolsDropped: true, pools: [...next.pools, ...npcPools] }
  }
  if (next.pools.some(pool => distance(player, pool.position) < 4.5 && next.time - pool.createdAt > .5)) next = addFailure(next, 'blood-pool-contact', 'Standing in Blood Venom', 'Move away from placed red pools and preserve the central corridor.')

  const blightedActive = phaseAge >= 34 && phaseAge < 52 && next.assignedSide === 'blood' && isHealer(next)
  next = { ...next, blightedActive }
  if (phaseAge >= 52 && next.assignedSide === 'blood' && isHealer(next) && !next.blightedResolved) next = addFailure(next, 'blighted-expired', 'Blighted Blood was not dispelled', `Use Dispel on the infected Blood-side player before the 18-second aura expires.`, true)

  if (phaseAge >= 40 && !next.protovenomResolved) next = { ...next, protovenomActive: true }
  if (next.protovenomActive && !next.protovenomResolved) {
    const home = homeForSide(next.assignedSide, next.cycle)
    const partner = { x: towardCentre(home, 18), z: -14 }
    const unmarked = { x: partner.x, z: -5 }
    if (distance(player, unmarked) < 2.5) next = addFailure(next, 'protovenom-unmarked', 'Protovenom touched an unmarked player', 'Move only into the partner carrying the matching red circle.', true)
    else if (distance(player, partner) < 2.5) next = { ...next, protovenomResolved: true, protovenomActive: false }
  }

  if (phaseAge >= duration) {
    if (!next.protovenomResolved) {
      next = addFailure(next, 'protovenom-stasis', 'Protovenom remained active at Stasis', 'Clear the marked pair before the bosses reach 100 energy.', true)
      if (next.outcome !== 'active') return next
    }
    next = { ...next, phase: 'stasis', phaseStartedAt: next.time, energy: 100, helicalResolved: false, helicalResolvedAt: undefined }
  }
  return next
}

function toxinComposition(index: number) {
  const pattern = [{ green: 3, red: 1 }, { green: 1, red: 3 }, { green: 2, red: 2 }, { green: 2, red: 2 }, { green: 0, red: 0 }, { green: 0, red: 0 }] as const
  return pattern[Math.max(0, index) % pattern.length]
}

function stepStasis(state: SentinelsState, commands: PlayerCommandState, seconds: number, screenRelative = false): SentinelsState {
  const age = state.time - state.phaseStartedAt
  const bounds = { halfWidth: sentinelsArena.width / 2 - 1.5, halfDepth: sentinelsArena.depth / 2 - 1.5 }
  const player = screenRelative ? stepScreenRelativeWorldMovement(state.player, commands, seconds, bounds, 16 / 9, 7, sentinelsArena) : stepPlayerMovement(state.player, commands, seconds, bounds)
  let next = stepMainCast({ ...state, player, acidBoss: moveToward(state.acidBoss, STASIS_ACID, 24, seconds), bloodBoss: moveToward(state.bloodBoss, STASIS_BLOOD, 24, seconds), energy: 100 }, seconds)
  if (age >= 3 && !next.helicalResolved) {
    const nearby = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled).map(member => ({ member, position: memberPosition(member, next), toxin: toxinComposition(contractRaidRoster.indexOf(member)) })).find(candidate => distance(player, candidate.position) < 2.6)
    if (nearby?.toxin.green === 3 && nearby.toxin.red === 1) next = { ...next, helicalResolved: true, helicalResolvedAt: next.time }
    else if (nearby) next = addFailure(next, 'wrong-helical', 'Joined an incompatible Helical partner', 'Match your attached 1 green / 3 red composition with any 3 green / 1 red player.', true)
  }
  if (age >= 13 && !next.helicalResolved) next = addFailure(next, 'helical-expired', 'Helical Toxins expired', 'Reach the compatible composition before the 13-second matching window ends.', true)
  if (age >= STASIS_SECONDS && next.outcome === 'active') {
    if (next.cycle === 2) return { ...next, outcome: 'success', acidHealth: 0, bloodHealth: 0 }
    const cycle = 2 as const
    const assignedSide = sideForSlot(next.selectedSlotId, cycle)
    next = {
      ...next, phase: 'active', phaseStartedAt: next.time, cycle, assignedSide, energy: 0,
      acidBoss: next.acidBoss,
      bloodBoss: next.bloodBoss,
      acidMarks: 0, bloodMarks: 0, lastMarkAt: next.time, droplets: [], dropletsSpawned: false, dropletsSpawnedAt: undefined,
      miasmaResolved: false, puddleDropAt: undefined, npcPoolsDropped: false, blightedActive: false, blightedResolved: false,
      protovenomActive: false, protovenomResolved: false, helicalResolved: false,
      helicalResolvedAt: undefined, coagulationHealth: 100, coagulationFailed: false,
    }
  }
  return next
}

export function stepSentinelsState(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  if (state.outcome !== 'active') return state
  const timed = { ...state, time: state.time + seconds, timeline: advanceAmbientNpcTimeline(state.timeline, seconds, state.assignedSide === 'acid' ? 'breath-of-ulatek' : 'blood-of-ulatek') }
  return timed.phase === 'active' ? stepActive(timed, commands, seconds) : stepStasis(timed, commands, seconds)
}

export function stepSentinelsDiagramState(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  if (state.outcome !== 'active') return state
  const timed = { ...state, time: state.time + seconds, timeline: advanceAmbientNpcTimeline(state.timeline, seconds, state.assignedSide === 'acid' ? 'breath-of-ulatek' : 'blood-of-ulatek') }
  return timed.phase === 'active' ? stepActive(timed, commands, seconds, true) : stepStasis(timed, commands, seconds, true)
}

function blendPosition(from: WorldPoint, to: WorldPoint, progress: number): WorldPoint {
  const amount = Math.max(0, Math.min(1, progress))
  const smooth = amount * amount * (3 - 2 * amount)
  return { x: from.x + (to.x - from.x) * smooth, z: from.z + (to.z - from.z) * smooth }
}

function formationPosition(member: ContractRaidMember, state: SentinelsState): WorldPoint {
  const side = sideForSlot(member.id, state.cycle); const home = homeForSide(side, state.cycle)
  if (member.role === 'tank') {
    const boss = side === 'acid' ? state.acidBoss : state.bloodBoss
    return { x: boss.x + (boss.x > 0 ? -4 : 4), z: boss.z + (member.id.endsWith('2') ? 2 : -2) }
  }
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, state.cycle) === side)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  const column = index % 3
  const row = Math.floor(index / 3)
  return { x: towardCentre(home, 10 + column * 3), z: -13 + row * 8 }
}

function memberPosition(member: ContractRaidMember, state: SentinelsState): WorldPoint {
  if (member.id === state.selectedSlotId) return state.player
  if (state.phase === 'stasis') {
    const index = contractRaidRoster.findIndex(candidate => candidate.id === member.id)
    const ring = 17 + index % 4 * 3
    const angle = index / contractRaidRoster.length * Math.PI * 2
    const spread = { x: Math.cos(angle) * ring, z: Math.sin(angle) * ring }
    let target = spread
    if (state.helicalResolvedAt !== undefined) {
      const toxin = toxinComposition(index)
      if (toxin.green === 0) {
        const nextSide = sideForSlot(member.id, state.cycle) === 'acid' ? 'blood' : 'acid'
        const nextHome = homeForSide(nextSide, state.cycle)
        target = { x: towardCentre(nextHome, 14), z: index % 2 ? 13 : -13 }
      } else {
        const pair = Math.floor(index / 2)
        const pairAngle = pair / 10 * Math.PI * 2
        target = { x: Math.cos(pairAngle) * (11 + pair % 3 * 4), z: Math.sin(pairAngle) * (11 + pair % 3 * 4) }
      }
    }
    const previous = state.helicalResolvedAt === undefined ? formationPosition(member, { ...state, phase: 'active' }) : spread
    const progress = state.helicalResolvedAt === undefined ? (state.time - state.phaseStartedAt) / 3 : (state.time - state.helicalResolvedAt) / 2.5
    return blendPosition(previous, target, progress)
  }
  const side = sideForSlot(member.id, state.cycle); const home = homeForSide(side, state.cycle)
  if (member.role === 'tank') {
    const boss = side === 'acid' ? state.acidBoss : state.bloodBoss
    return { x: boss.x + (boss.x > 0 ? -4 : 4), z: boss.z + (member.id.endsWith('2') ? 2 : -2) }
  }
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, state.cycle) === side)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  const phaseAge = state.time - state.phaseStartedAt
  const poolCarriers = contractRosterForSlot(state.selectedSlotId).filter(candidate => !candidate.controlled && candidate.role !== 'tank' && sideForSlot(candidate.id, state.cycle) === 'blood').slice(0, 3)
  const poolCarrierIndex = poolCarriers.findIndex(candidate => candidate.id === member.id)
  if (poolCarrierIndex >= 0 && phaseAge >= 25 && phaseAge < 28) {
    const target = { x: home.x + (home.x > 0 ? -5 : 5), z: -18 + poolCarrierIndex * 18 }
    return blendPosition(formationPosition(member, state), target, (phaseAge - 25) / 2.4)
  }
  if (state.protovenomActive) {
    const spreadIndex = Math.max(0, contractRaidRoster.findIndex(candidate => candidate.id === member.id))
    const angle = spreadIndex / contractRaidRoster.length * Math.PI * 2
    const centre = homeForSide(side, state.cycle)
    return { x: centre.x + Math.cos(angle) * 22, z: centre.z + Math.sin(angle) * 22 }
  }
  if (side === 'acid' && state.dropletsSpawned) {
    const npcDroplets = state.droplets.filter(droplet => !droplet.soaked && (!droplet.assignedToPlayer || state.assignedSide !== 'acid'))
    const droplet = npcDroplets[index % Math.max(1, npcDroplets.length)]
    if (droplet) {
      const angle = index * 2.1
      const target = { x: droplet.position.x + Math.cos(angle) * 1.2, z: droplet.position.z + Math.sin(angle) * 1.2 }
      return blendPosition(formationPosition(member, state), target, (state.time - (state.dropletsSpawnedAt ?? state.time)) / 2)
    }
  }
  if (side === 'blood' && phaseAge >= 17 && phaseAge < 25) {
    const target = { x: towardCentre(home, 13), z: 16 }
    const angle = index / Math.max(1, peers.length) * Math.PI * 2
    const soak = { x: target.x + Math.cos(angle) * 5.2, z: target.z + Math.sin(angle) * 5.2 }
    return blendPosition(formationPosition(member, state), soak, (phaseAge - 17) / 2)
  }
  const column = index % 3
  const row = Math.floor(index / 3)
  const base = { x: towardCentre(home, 10 + column * 3), z: -13 + row * 8 }
  let position = ambientNpcPosition(member.id, base, state.time, { radius: .9 })
  const returnBeam = state.droplets.find(droplet => droplet.soakedAt !== undefined && state.time - droplet.soakedAt > .2 && state.time - droplet.soakedAt < 2)
  if (returnBeam && lineDistance(position, returnBeam.position, state.acidBoss) < 3) position = { ...position, z: position.z + (index % 2 ? 4 : -4) }
  return position
}

function toxins(green: number, red: number) {
  return [
    ...(green ? [{ id: 'green-toxin', tone: 'poison' as const, stacks: green }] : []),
    ...(red ? [{ id: 'red-toxin', tone: 'danger' as const, stacks: red }] : []),
  ]
}

export function sentinelsSnapshot(state: SentinelsState): Train3DSnapshot {
  const phaseAge = state.time - state.phaseStartedAt
  const npcPoolTargets = contractRosterForSlot(state.selectedSlotId).filter(member => !member.controlled && member.role !== 'tank' && sideForSlot(member.id, state.cycle) === 'blood').slice(0, 3).map(member => member.id)
  const actors: ActorSnapshot[] = contractRosterForSlot(state.selectedSlotId).map(member => ({
    id: member.controlled ? 'player' : member.id, kind: member.controlled ? 'player' : 'ally', playerClass: member.playerClass,
    position: memberPosition(member, state), facing: member.controlled ? state.player.facing : 0, color: trainingClassColors[member.playerClass], health: member.controlled ? 100 : undefined,
    auras: state.phase === 'stasis' && phaseAge >= 3 && (!state.helicalResolved || (!member.controlled && state.helicalResolvedAt !== undefined && state.time - state.helicalResolvedAt < 3)) ? (member.controlled ? toxins(1, 3) : (() => { const toxin = toxinComposition(contractRaidRoster.indexOf(member)); return toxins(toxin.green, toxin.red) })()) : member.controlled ? [
      ...(state.acidMarks ? [{ id: 'acid-mark', tone: 'poison' as const, stacks: state.acidMarks }] : []),
      ...(state.bloodMarks ? [{ id: 'blood-mark', tone: 'danger' as const, stacks: state.bloodMarks }] : []),
      ...(state.protovenomActive ? [{ id: 'protovenom', tone: 'danger' as const, stacks: 1 }] : []),
      ...(state.puddleDropAt !== undefined ? [{ id: 'blood-pool-drop', tone: 'danger' as const, stacks: 1 }] : []),
    ] : state.phase === 'active' && phaseAge >= 25 && phaseAge < 28 && npcPoolTargets.includes(member.id) ? [{ id: 'blood-pool-drop', tone: 'danger' as const, stacks: 1 }] : [],
  }))
  actors.push(
    { id: 'breath-of-ulatek', kind: 'boss', position: state.acidBoss, facing: 0, color: '#61dc79', auras: [], health: state.acidHealth },
    { id: 'blood-of-ulatek', kind: 'boss', position: state.bloodBoss, facing: Math.PI, color: '#e45663', auras: [], health: state.bloodHealth },
  )
  if (state.phase === 'active' && phaseAge >= 8 && state.coagulationHealth > 0) {
    const acidHome = homeForSide('acid', state.cycle)
    actors.push({ id: 'venom-coagulation', kind: 'enemy', position: { x: towardCentre(acidHome, 15), z: 18 }, facing: 0, color: '#79d85e', auras: [], health: state.coagulationHealth })
  }
  if (state.protovenomActive) {
    const home = homeForSide(state.assignedSide, state.cycle)
    actors.push({ id: 'protovenom-partner', kind: 'ally', playerClass: 'paladin', position: { x: towardCentre(home, 18), z: -14 }, facing: 0, color: trainingClassColors.paladin, auras: [{ id: 'protovenom', tone: 'danger', stacks: 1 }] })
    actors.push({ id: 'unmarked-player', kind: 'ally', playerClass: 'hunter', position: { x: towardCentre(home, 8), z: 20 }, facing: 0, color: trainingClassColors.hunter, auras: [] })
  }
  const effects: EffectSnapshot[] = []
  for (const droplet of state.droplets) {
    if (!droplet.soaked) effects.push({ id: droplet.id, kind: 'ground-soak', position: droplet.position, radius: 2.2, color: '#6bea72', progress: 0, filled: true })
    if (droplet.soakedAt !== undefined && state.time - droplet.soakedAt < 2) effects.push({ id: `${droplet.id}-return`, kind: 'projectile', position: droplet.position, target: state.acidBoss, radius: 1.2, color: '#83ff68', progress: Math.min(1, (state.time - droplet.soakedAt) / 2) })
  }
  if (state.phase === 'active' && phaseAge >= 17 && phaseAge < 25) {
    const home = homeForSide('blood', state.cycle)
    effects.push({ id: 'miasma-soak', kind: 'ground-soak', position: { x: towardCentre(home, 13), z: 16 }, radius: 7.5, color: '#ee5265', progress: (phaseAge - 17) / 8, filled: true })
  }
  for (const pool of state.pools) effects.push({ id: pool.id, kind: 'ground-harmful', position: pool.position, radius: 4.5, color: '#b92c4b', progress: 1 })
  if (state.protovenomActive) {
    effects.push({ id: 'player-protovenom-ring', kind: 'ground-spread', position: state.player, radius: 3, color: '#ff4059', progress: 1, filled: false })
    const partner = actors.find(actor => actor.id === 'protovenom-partner')
    if (partner) effects.push({ id: 'partner-protovenom-ring', kind: 'ground-spread', position: partner.position, radius: 3, color: '#ff4059', progress: 1, filled: false })
  }
  const add = actors.find(actor => actor.id === 'venom-coagulation')
  const cosmeticTarget = (actor: ActorSnapshot) => {
    const memberSide = sideForSlot(actor.id, state.cycle)
    if (add && memberSide === 'acid') return add.position
    return memberSide === 'acid' ? state.acidBoss : state.bloodBoss
  }
  const controlled = contractSelectedMember(state.selectedSlotId)
  const mainProjectile = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget
    ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, .9)
    : []
  return { time: state.time, timeline: state.timeline, arena: sentinelsArena, actors, effects: [...effects, ...cosmeticClassProjectiles(actors, cosmeticTarget, state.time), ...mainProjectile] }
}

export function activeSentinelsPrompt(state: SentinelsState) {
  if (state.phase === 'stasis') {
    const age = state.time - state.phaseStartedAt
    if (age < 3) return 'Spread while both Sentinels move to the middle'
    return state.helicalResolved ? 'Your Helical pair is clear — avoid resolving pairs' : 'Read your toxins and find any complementary player'
  }
  const age = state.time - state.phaseStartedAt
  if (age >= 8 && state.coagulationHealth > 0) return `Target Venom Coagulation · ${Math.ceil(state.coagulationHealth / 20)} Main casts`
  if (state.protovenomActive) return 'Meet only your marked Protovenom partner'
  if (state.assignedSide === 'acid' && age >= 12 && age < 30) return 'Soak your green droplet, then leave its return beam'
  if (state.assignedSide === 'blood' && age >= 17 && age < 25) return 'Join the red group soak'
  if (state.puddleDropAt !== undefined) return 'Move to the outer wall before your pool drops'
  if (state.blightedActive && !state.blightedResolved) return 'Dispel Blighted Blood'
  if (isTank(state)) return 'Keep your Sentinel at least 40 yards from its partner'
  return `Hold the ${state.assignedSide === 'acid' ? 'green' : 'red'} side and read your marks`
}

export function nextSentinelsTimer(state: SentinelsState) {
  const age = state.time - state.phaseStartedAt
  if (state.phase === 'stasis') return age < 3 ? { label: 'Spread', seconds: 3 - age } : { label: 'Helical', seconds: Math.max(0, 13 - age) }
  if (age < 8) return { label: 'Venom add', seconds: Math.max(0, 8 - age) }
  if (state.coagulationHealth > 0) return { label: 'Noxious Blast', seconds: Math.max(0, 30 - age) }
  const assignedDroplet = state.droplets.find(droplet => droplet.assignedToPlayer)
  if (state.assignedSide === 'acid' && state.dropletsSpawned && assignedDroplet && !assignedDroplet.soaked) return { label: 'Droplet', seconds: Math.max(0, 30 - age) }
  if (state.puddleDropAt !== undefined) return { label: 'Pool', seconds: Math.max(0, state.puddleDropAt - state.time) }
  if (state.blightedActive && !state.blightedResolved) return { label: 'Dispel', seconds: Math.max(0, 52 - age) }
  const duration = state.cycle === 1 ? FIRST_ACTIVE_SECONDS : SECOND_ACTIVE_SECONDS
  return { label: 'Stasis', seconds: Math.max(0, duration - age) }
}

export function sentinelsPlayerRole(state: SentinelsState) {
  const role = contractSelectedMember(state.selectedSlotId).role
  return `${state.assignedSide} ${role}`
}

export const sentinelsContract = { dominanceYards: DOMINANCE_YARDS, firstActiveSeconds: FIRST_ACTIVE_SECONDS, secondActiveSeconds: SECOND_ACTIVE_SECONDS, stasisSeconds: STASIS_SECONDS }
