import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceMainAction, beginMainAction, publishMainProjectile } from '../../platform/combatActions'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { classProjectileEffects, cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { sentinelsArena } from './train3d/arenas'
import { applyEncounterMechanic, beginEncounterAction, coreEncounterEntities, createEncounterTimeline, removeEncounterMechanic, setEncounterMovementIntent, type EncounterTimelineState } from '../../platform/encounters/timeline'
import { advanceAmbientNpcTimeline, ambientNpcPosition } from '../../platform/encounters/ambientNpc'
import { activeApplications, radialKnockback, type EncounterProjection, type TimedApplication } from '../../platform/encounters/mechanicState'
import { advanceEntityMotions } from '../../platform/encounters/entityState'
import { sentinelsTiming } from './timing/projections'

export type SentinelSide = 'acid' | 'blood'
export type SentinelsPhase = 'active' | 'stasis'
export type SentinelsOutcome = 'active' | 'success' | 'wipe'

export interface DropletState { id: string; side: SentinelSide; position: WorldPoint; assignedToPlayer: boolean; soaked: boolean; soakedAt?: number }
export interface BloodPoolState { id: string; position: WorldPoint; createdAt: number }

export interface SentinelsState {
  time: number
  timeline: EncounterTimelineState
  phase: SentinelsPhase
  phaseStartedAt: number
  cycle: 1 | 2
  trainingDifficulty: TrainingDifficulty
  projection: EncounterProjection
  selectedSlotId: string
  assignedSide: SentinelSide
  player: { x: number; z: number; facing: number }
  npcPositions: Readonly<Record<string, WorldPoint>>
  acidBoss: WorldPoint
  bloodBoss: WorldPoint
  acidHealth: number
  bloodHealth: number
  energy: number
  acidMarks: number
  bloodMarks: number
  acidMarkApplications: readonly TimedApplication[]
  bloodMarkApplications: readonly TimedApplication[]
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
  blightedTargetId?: string
  blightedAppliedAt?: number
  protovenomActive: boolean
  protovenomResolved: boolean
  protovenomCarrierIds: readonly string[]
  helicalResolved: boolean
  helicalResolvedAt?: number
  coagulationHealth: number
  coagulationFailed: boolean
  empoweringSlamStacks: number
  bloodvenomInjectionStacks: number
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

export function createSentinelsState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal', projection: EncounterProjection = 'train3d'): SentinelsState {
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== selectedSlotId).map(member => member.id), ['breath-of-ulatek', 'blood-of-ulatek'], sentinelsArena.id))
  const initial: SentinelsState = {
    time: 0, timeline, phase: 'active', phaseStartedAt: 0, cycle: 1, trainingDifficulty, projection, selectedSlotId,
    assignedSide: sideForSlot(selectedSlotId, 1), player: playerStart(selectedSlotId, 1), npcPositions: {},
    acidBoss: { ...ACID_HOME }, bloodBoss: { ...BLOOD_HOME }, acidHealth: 100, bloodHealth: 100, energy: 50,
    acidMarks: 0, bloodMarks: 0, acidMarkApplications: [], bloodMarkApplications: [], lastMarkAt: 0, droplets: [], dropletsSpawned: false,
    miasmaResolved: false, npcPoolsDropped: false, pools: [], blightedActive: false, blightedResolved: false,
    protovenomActive: false, protovenomResolved: false, protovenomCarrierIds: [], helicalResolved: false,
    coagulationHealth: 100, coagulationFailed: false, empoweringSlamStacks: 0, bloodvenomInjectionStacks: 0, mainCastRemaining: 0, mainProjectileOrdinal: 0,
    outcome: 'active', mistakes: 0, failures: [],
  }
  return { ...initial, npcPositions: Object.fromEntries(contractRosterForSlot(selectedSlotId).filter(member => !member.controlled).map(member => {
    const point = playerStart(member.id, 1)
    return [member.id, { x: point.x, z: point.z }]
  })) }
}

export function prepareSentinelsSlot(state: SentinelsState, selectedSlotId: string): SentinelsState {
  return createSentinelsState(selectedSlotId, state.trainingDifficulty, state.projection)
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
  if (state.failures.some(failure => failure.code === code && state.time - failure.time < 4)) return state
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
  const offsets = [{ inward: 10, z: -12 }, { inward: 17, z: -4 }, { inward: 13, z: 7 }, { inward: 8, z: 14 }]
  return (['acid', 'blood'] as const).flatMap(side => {
    const home = homeForSide(side, cycle)
    return offsets.map((offset, index) => ({
      id: `droplet-${cycle}-${side}-${index + 1}`,
      side,
      position: { x: home.x + (home.x > 0 ? -offset.inward : offset.inward), z: offset.z },
      assignedToPlayer: index === 1,
      soaked: false,
    }))
  })
}

export function dispelSentinels(state: SentinelsState): SentinelsState {
  if (state.phase !== 'active' || !state.blightedActive || state.blightedResolved || state.assignedSide !== 'blood' || !isHealer(state)) return state
  const home = homeForSide('blood', state.cycle)
  const position = { x: home.x + (home.x > 0 ? -4 : 4), z: -20 }
  const pool = { id: `blighted-pool-${state.cycle}`, position, createdAt: state.time }
  return { ...state, blightedActive: false, blightedResolved: true, pools: [...state.pools, pool], timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'dispel', 0, state.blightedTargetId ?? 'blighted-blood') }
}

function stepActive(state: SentinelsState, commands: PlayerCommandState, seconds: number, screenRelative = false): SentinelsState {
  const phaseAge = state.time - state.phaseStartedAt
  const timing = sentinelsTiming(state.projection)
  const duration = timing.activeSeconds[state.cycle - 1]
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

  let acidMarkApplications = activeApplications(next.acidMarkApplications, next.time)
  let bloodMarkApplications = activeApplications(next.bloodMarkApplications, next.time)
  if (next.time - next.lastMarkAt >= timing.markCadenceSeconds) {
    if (distance(player, acidBoss) <= 40) acidMarkApplications = [...acidMarkApplications, { id: `acid-${next.cycle}-${next.time.toFixed(2)}`, appliedAt: next.time, duration: timing.markLifetimeSeconds }]
    if (distance(player, bloodBoss) <= 40) bloodMarkApplications = [...bloodMarkApplications, { id: `blood-${next.cycle}-${next.time.toFixed(2)}`, appliedAt: next.time, duration: timing.markLifetimeSeconds }]
    const acidMarks = acidMarkApplications.length
    const bloodMarks = bloodMarkApplications.length
    next = { ...next, acidMarks, bloodMarks, acidMarkApplications, bloodMarkApplications, lastMarkAt: next.time }
    if (acidMarks > 0 && bloodMarks > 0) next = addFailure(next, 'mixed-marks', 'Collected both Acid and Blood marks', 'Stay with the boss assigned to your current side; do not cross both 40-yard auras during the active cycle.')
  } else next = { ...next, acidMarks: acidMarkApplications.length, bloodMarks: bloodMarkApplications.length, acidMarkApplications, bloodMarkApplications }

  if (isTank(next)) {
    const empoweringSlamStacks = next.assignedSide === 'acid' && phaseAge >= 15 ? 1 + Math.floor((phaseAge - 15) / 18) : 0
    const bloodvenomInjectionStacks = next.assignedSide === 'blood' && phaseAge >= 15 ? 1 + Math.floor((phaseAge - 15) / 18) : 0
    next = { ...next, empoweringSlamStacks, bloodvenomInjectionStacks }
  }

  if (!next.dropletsSpawned && phaseAge >= 12) next = { ...next, dropletsSpawned: true, dropletsSpawnedAt: next.time, droplets: spawnDroplets(next.cycle) }
  if (!next.coagulationFailed && phaseAge >= 30 && next.coagulationHealth > 0) next = { ...addFailure(next, 'coagulation-alive', 'Venom Coagulation completed Contaminate', 'Switch to the visible priority add and complete five Main casts.', true), coagulationFailed: true }
  if (next.dropletsSpawned) {
    let droplets = next.droplets.map(droplet => {
      if (droplet.soaked) return droplet
      if (droplet.assignedToPlayer && next.assignedSide === droplet.side && distance(player, droplet.position) < 2.5) return { ...droplet, soaked: true, soakedAt: next.time }
      const npcSoaker = droplet.assignedToPlayer && next.assignedSide === droplet.side ? undefined : contractRosterForSlot(next.selectedSlotId).filter(candidate => !candidate.controlled && sideForSlot(candidate.id, next.cycle) === droplet.side).find(candidate => distance(memberPosition(candidate, next), droplet.position) < 2.5)
      if (npcSoaker) return { ...droplet, soaked: true, soakedAt: next.time }
      return droplet
    })
    next = { ...next, droplets }
    const missed = droplets.find(droplet => droplet.assignedToPlayer && next.assignedSide === droplet.side && !droplet.soaked)
    if (missed && next.time - (next.dropletsSpawnedAt ?? next.time) >= timing.dropletFuseSeconds) next = addFailure(next, 'droplet-exploded', 'Your Toxic Droplet erupted', `Soak the assigned ${next.assignedSide === 'acid' ? 'green' : 'red-side'} droplet before its fuse expires.`, true)
    const projectile = droplets.find(droplet => droplet.soakedAt !== undefined && next.time - droplet.soakedAt >= timing.livingVenomTelegraphSeconds && next.time - droplet.soakedAt < timing.livingVenomTelegraphSeconds + timing.livingVenomSeconds)
    if (projectile?.soakedAt !== undefined) {
      const progress = (next.time - projectile.soakedAt - timing.livingVenomTelegraphSeconds) / timing.livingVenomSeconds
      const projectilePosition = { x: projectile.position.x + (acidBoss.x - projectile.position.x) * progress, z: projectile.position.z + (acidBoss.z - projectile.position.z) * progress }
      if (distance(player, projectilePosition) < 2) next = addFailure(next, 'living-venom', 'Hit by returning Living Venom', 'Clear the droplet, then step out of the visible return lane before the projectile launches.', true)
    }
  }

  const miasmaStart = 17
  if (!next.miasmaResolved && phaseAge >= miasmaStart + timing.miasmaSeconds) {
    const bloodHome = homeForSide('blood', next.cycle)
    const target = { x: towardCentre(bloodHome, 13), z: 16 }
    if (next.assignedSide === 'blood' && distance(player, target) > 7.5) next = addFailure(next, 'missed-miasma', 'Missed the Unstable Miasma group soak', 'Join the filled red soak circle with your Blood-side group before it resolves.', true)
    const puddleDropAt = next.assignedSide === 'blood' ? next.time + 6 : undefined
    const npcCarriers = contractRosterForSlot(next.selectedSlotId).filter(candidate => !candidate.controlled && candidate.role !== 'tank' && sideForSlot(candidate.id, next.cycle) === 'blood').slice(0, 3)
    let timeline = next.timeline
    if (puddleDropAt !== undefined) timeline = applyEncounterMechanic(timeline, { id: 'controlled-player', kind: 'controlled-player' }, { id: 'blood-pool-drop', kind: 'delayed-ground-drop', sourceId: 'blood-of-ulatek', expiresAt: puddleDropAt, stacks: 1 })
    timeline = npcCarriers.reduce((current, carrier) => applyEncounterMechanic(current, { id: carrier.id, kind: 'raid-npc' }, { id: `blood-pool-drop-${next.cycle}`, kind: 'delayed-ground-drop', sourceId: 'blood-of-ulatek', expiresAt: next.time + 6, stacks: 1 }), timeline)
    next = { ...next, timeline, miasmaResolved: true, puddleDropAt }
  }
  if (next.puddleDropAt !== undefined && next.time >= next.puddleDropAt) {
    const pool = { id: `blood-pool-${next.cycle}-${next.time.toFixed(1)}`, position: { x: player.x, z: player.z }, createdAt: next.time }
    if (Math.abs(player.x) < 28) next = addFailure(next, 'central-pool', 'Dropped Blood Venom in the central corridor', 'After the group soak, move to the outside wall before the five-second pool aura expires.')
    next = { ...next, timeline: removeEncounterMechanic(next.timeline, 'controlled-player', 'blood-pool-drop', 'expired-to-ground'), puddleDropAt: undefined, pools: [...next.pools, pool] }
  }
  if (next.miasmaResolved && !next.npcPoolsDropped && phaseAge >= miasmaStart + timing.miasmaSeconds + 6) {
    const bloodMembers = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled && member.role !== 'tank' && sideForSlot(member.id, next.cycle) === 'blood').slice(0, 3)
    const npcPools = bloodMembers.map((member, index) => {
      return { id: `npc-blood-pool-${next.cycle}-${index + 1}`, position: next.npcPositions[member.id] ?? memberDestination(member, next), createdAt: next.time }
    })
    const timeline = bloodMembers.reduce((current, member) => removeEncounterMechanic(current, member.id, `blood-pool-drop-${next.cycle}`, 'expired-to-ground'), next.timeline)
    next = { ...next, timeline, npcPoolsDropped: true, pools: [...next.pools, ...npcPools] }
  }
  if (next.pools.some(pool => distance(player, pool.position) < 4.5 && next.time - pool.createdAt > .5)) next = addFailure(next, 'blood-pool-contact', 'Standing in Blood Venom', 'Move away from placed red pools and preserve the central corridor.')

  if (phaseAge >= 34 && next.assignedSide === 'blood' && isHealer(next) && !next.blightedAppliedAt) next = { ...next, blightedActive: true, blightedAppliedAt: next.time, blightedTargetId: contractRosterForSlot(next.selectedSlotId).find(candidate => !candidate.controlled && sideForSlot(candidate.id, next.cycle) === 'blood')?.id }
  if (next.blightedAppliedAt !== undefined && next.time - next.blightedAppliedAt >= timing.blightedBloodSeconds && !next.blightedResolved) next = addFailure({ ...next, blightedActive: false }, 'blighted-expired', 'Blighted Blood was not dispelled', `Use Dispel on the infected Blood-side player before the 18-second aura expires.`, true)

  if (phaseAge >= 40 && !next.protovenomResolved && !next.protovenomActive) {
    const others = contractRosterForSlot(next.selectedSlotId).filter(candidate => !candidate.controlled)
    const carriers = [next.selectedSlotId, ...others.filter((_candidate, index) => (index + next.cycle) % 4 === 0).slice(0, 5).map(candidate => candidate.id)]
    const timeline = carriers.reduce((current, carrierId) => applyEncounterMechanic(current, { id: carrierId === next.selectedSlotId ? 'controlled-player' : carrierId, kind: carrierId === next.selectedSlotId ? 'controlled-player' : 'raid-npc' }, { id: `protovenom-${next.cycle}`, kind: 'paired-proximity', sourceId: 'blood-of-ulatek', stacks: 1 }), next.timeline)
    next = { ...next, timeline, protovenomActive: true, protovenomCarrierIds: carriers }
  }
  if (next.protovenomActive && !next.protovenomResolved) {
    const nearby = contractRosterForSlot(next.selectedSlotId).filter(candidate => !candidate.controlled).map(candidate => ({ candidate, position: memberPosition(candidate, next) })).find(entry => distance(player, entry.position) < 2.5)
    if (nearby && !next.protovenomCarrierIds.includes(nearby.candidate.id)) {
      const knocked = radialKnockback(player, nearby.position, 8)
      next = addFailure({ ...next, player: { ...player, ...knocked } }, 'protovenom-unmarked', 'Protovenom erupted on a non-carrier', 'Meet exactly one player carrying the same Protovenom ring.', true)
    } else if (nearby) {
      const timeline = next.protovenomCarrierIds.reduce((current, carrierId) => removeEncounterMechanic(current, carrierId === next.selectedSlotId ? 'controlled-player' : carrierId, `protovenom-${next.cycle}`, 'paired'), next.timeline)
      next = { ...next, timeline, protovenomResolved: true, protovenomActive: false }
    }
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
  const timing = sentinelsTiming(state.projection)
  const bounds = { halfWidth: sentinelsArena.width / 2 - 1.5, halfDepth: sentinelsArena.depth / 2 - 1.5 }
  const player = screenRelative ? stepScreenRelativeWorldMovement(state.player, commands, seconds, bounds, 16 / 9, 7, sentinelsArena) : stepPlayerMovement(state.player, commands, seconds, bounds)
  let next = stepMainCast({ ...state, player, acidBoss: moveToward(state.acidBoss, STASIS_ACID, 24, seconds), bloodBoss: moveToward(state.bloodBoss, STASIS_BLOOD, 24, seconds), energy: 100 }, seconds)
  if (age >= 2 && !next.helicalResolved) {
    const nearby = contractRosterForSlot(next.selectedSlotId).filter(member => !member.controlled).map(member => ({ member, position: memberPosition(member, next), toxin: toxinComposition(contractRaidRoster.indexOf(member)) })).find(candidate => distance(player, candidate.position) < 2.6)
    if (nearby?.toxin.green === 3 && nearby.toxin.red === 1) next = { ...next, helicalResolved: true, helicalResolvedAt: next.time }
    else if (nearby) next = addFailure(next, 'wrong-helical', 'Joined an incompatible Helical partner', 'Match your attached 1 green / 3 red composition with any 3 green / 1 red player.', true)
  }
  if (age >= 2 + timing.helicalSeconds && !next.helicalResolved) next = addFailure(next, 'helical-expired', 'Helical Toxins expired', 'Reach any complementary composition before the 28-second matching window ends.', true)
  if (age >= timing.stasisSeconds && next.outcome === 'active') {
    if (next.cycle === 2) return { ...next, outcome: 'success', acidHealth: 0, bloodHealth: 0 }
    const cycle = 2 as const
    const assignedSide = sideForSlot(next.selectedSlotId, cycle)
    next = {
      ...next, phase: 'active', phaseStartedAt: next.time, cycle, assignedSide, energy: 0,
      acidBoss: next.acidBoss,
      bloodBoss: next.bloodBoss,
      acidMarks: activeApplications(next.acidMarkApplications, next.time).length, bloodMarks: activeApplications(next.bloodMarkApplications, next.time).length, lastMarkAt: next.time, droplets: [], dropletsSpawned: false, dropletsSpawnedAt: undefined,
      miasmaResolved: false, puddleDropAt: undefined, npcPoolsDropped: false, blightedActive: false, blightedResolved: false, blightedAppliedAt: undefined, blightedTargetId: undefined,
      protovenomActive: false, protovenomResolved: false, protovenomCarrierIds: [], helicalResolved: false,
      helicalResolvedAt: undefined, coagulationHealth: 100, coagulationFailed: false, empoweringSlamStacks: 0, bloodvenomInjectionStacks: 0,
    }
  }
  return next
}

export function stepSentinelsState(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  if (state.outcome !== 'active') return state
  const timed = advanceSentinelsNpcMotion({ ...state, time: state.time + seconds, timeline: advanceAmbientNpcTimeline(state.timeline, seconds, state.assignedSide === 'acid' ? 'breath-of-ulatek' : 'blood-of-ulatek') }, seconds)
  return timed.phase === 'active' ? stepActive(timed, commands, seconds) : stepStasis(timed, commands, seconds)
}

export function stepSentinelsDiagramState(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  if (state.outcome !== 'active') return state
  const timed = advanceSentinelsNpcMotion({ ...state, time: state.time + seconds, timeline: advanceAmbientNpcTimeline(state.timeline, seconds, state.assignedSide === 'acid' ? 'breath-of-ulatek' : 'blood-of-ulatek') }, seconds)
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

function memberDestination(member: ContractRaidMember, state: SentinelsState): WorldPoint {
  if (member.id === state.selectedSlotId) return state.player
  if (state.phase === 'stasis') {
    const index = contractRaidRoster.findIndex(candidate => candidate.id === member.id)
    const ring = 17 + index % 4 * 3
    const angle = index / contractRaidRoster.length * Math.PI * 2
    const spread = { x: Math.cos(angle) * ring, z: Math.sin(angle) * ring }
    let target = spread
    if (state.time - state.phaseStartedAt >= 2) {
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
    return target
  }
  const side = sideForSlot(member.id, state.cycle); const home = homeForSide(side, state.cycle)
  if (member.role === 'tank') {
    const boss = side === 'acid' ? state.acidBoss : state.bloodBoss
    return { x: boss.x + (boss.x > 0 ? -4 : 4), z: boss.z + (member.id.endsWith('2') ? 2 : -2) }
  }
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, state.cycle) === side)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  const phaseAge = state.time - state.phaseStartedAt
  const timing = sentinelsTiming(state.projection)
  const poolCarriers = contractRosterForSlot(state.selectedSlotId).filter(candidate => !candidate.controlled && candidate.role !== 'tank' && sideForSlot(candidate.id, state.cycle) === 'blood').slice(0, 3)
  const poolCarrierIndex = poolCarriers.findIndex(candidate => candidate.id === member.id)
  const npcPoolAppliedAge = 17 + timing.miasmaSeconds
  const npcPoolDropAge = npcPoolAppliedAge + 6
  if (poolCarrierIndex >= 0 && phaseAge >= npcPoolAppliedAge && phaseAge < npcPoolDropAge) {
    const target = { x: home.x + (home.x > 0 ? -5 : 5), z: -18 + poolCarrierIndex * 18 }
    return target
  }
  if (state.protovenomActive) {
    const spreadIndex = Math.max(0, contractRaidRoster.findIndex(candidate => candidate.id === member.id))
    const angle = spreadIndex / contractRaidRoster.length * Math.PI * 2
    const centre = homeForSide(side, state.cycle)
    return { x: centre.x + Math.cos(angle) * 22, z: centre.z + Math.sin(angle) * 22 }
  }
  if (state.dropletsSpawned) {
    const npcDroplets = state.droplets.filter(droplet => droplet.side === side && !droplet.soaked && (!droplet.assignedToPlayer || state.assignedSide !== side))
    const droplet = npcDroplets[index % Math.max(1, npcDroplets.length)]
    if (droplet) {
      const angle = index * 2.1
      const target = { x: droplet.position.x + Math.cos(angle) * 1.2, z: droplet.position.z + Math.sin(angle) * 1.2 }
      return blendPosition(formationPosition(member, state), target, (state.time - (state.dropletsSpawnedAt ?? state.time)) / 2)
    }
  }
  if (side === 'blood' && phaseAge >= 17 && phaseAge < 17 + timing.miasmaSeconds) {
    const target = { x: towardCentre(home, 13), z: 16 }
    const angle = index / Math.max(1, peers.length) * Math.PI * 2
    const soak = { x: target.x + Math.cos(angle) * 5.2, z: target.z + Math.sin(angle) * 5.2 }
    return blendPosition(formationPosition(member, state), soak, (phaseAge - 17) / 2)
  }
  const column = index % 3
  const row = Math.floor(index / 3)
  const base = { x: towardCentre(home, 10 + column * 3), z: -13 + row * 8 }
  let position = ambientNpcPosition(member.id, base, state.time, { radius: .9 })
  const returnBeam = state.droplets.find(droplet => droplet.soakedAt !== undefined && state.time - droplet.soakedAt < timing.livingVenomTelegraphSeconds + timing.livingVenomSeconds)
  if (returnBeam && lineDistance(position, returnBeam.position, state.acidBoss) < 3) position = { ...position, z: position.z + (index % 2 ? 4 : -4) }
  return position
}

function memberPosition(member: ContractRaidMember, state: SentinelsState): WorldPoint {
  return member.controlled ? state.player : state.npcPositions[member.id] ?? memberDestination(member, state)
}

function advanceSentinelsNpcMotion(state: SentinelsState, seconds: number): SentinelsState {
  const roster = contractRosterForSlot(state.selectedSlotId).filter(member => !member.controlled)
  const destinations = Object.fromEntries(roster.map(member => [member.id, memberDestination(member, state)]))
  const positions = advanceEntityMotions(state.npcPositions, destinations, seconds, id => ({
    speed: id.startsWith('tank-') ? 7 : 6.6,
    bounds: { halfWidth: sentinelsArena.width / 2 - 4, halfDepth: sentinelsArena.depth / 2 - 4 },
  }))
  const timeline = roster.reduce((current, member) => setEncounterMovementIntent(current, member.id, destinations[member.id], member.role === 'tank' ? 7 : 6.6), state.timeline)
  return {
    ...state,
    timeline,
    npcPositions: positions,
  }
}

function toxins(green: number, red: number) {
  return [
    ...(green ? [{ id: 'green-toxin', tone: 'poison' as const, stacks: green }] : []),
    ...(red ? [{ id: 'red-toxin', tone: 'danger' as const, stacks: red }] : []),
  ]
}

function npcHelicalAuras(member: ContractRaidMember, state: SentinelsState, phaseAge: number) {
  if (state.helicalResolved) return []
  const toxin = toxinComposition(contractRaidRoster.indexOf(member))
  const awaitingPlayer = toxin.green === 3 && toxin.red === 1
  if (phaseAge >= 6 && !awaitingPlayer) return []
  return toxins(toxin.green, toxin.red)
}

export function sentinelsSnapshot(state: SentinelsState): Train3DSnapshot {
  const phaseAge = state.time - state.phaseStartedAt
  const timing = sentinelsTiming(state.projection)
  const npcPoolAppliedAge = 17 + timing.miasmaSeconds
  const npcPoolDropAge = npcPoolAppliedAge + 6
  const npcPoolTargets = contractRosterForSlot(state.selectedSlotId).filter(member => !member.controlled && member.role !== 'tank' && sideForSlot(member.id, state.cycle) === 'blood').slice(0, 3).map(member => member.id)
  const actors: ActorSnapshot[] = contractRosterForSlot(state.selectedSlotId).map(member => ({
    id: member.controlled ? 'controlled-player' : member.id, kind: member.controlled ? 'player' : 'ally', role: member.role, playerClass: member.playerClass,
    position: memberPosition(member, state), facing: member.controlled ? state.player.facing : 0, color: trainingClassColors[member.playerClass], health: member.controlled ? 100 : undefined,
    auras: state.phase === 'stasis' && phaseAge >= 2 && !state.helicalResolved ? (member.controlled ? toxins(1, 3) : npcHelicalAuras(member, state, phaseAge)) : member.controlled ? [
      ...(state.acidMarks ? [{ id: 'acid-mark', tone: 'poison' as const, stacks: state.acidMarks }] : []),
      ...(state.bloodMarks ? [{ id: 'blood-mark', tone: 'danger' as const, stacks: state.bloodMarks }] : []),
      ...(state.protovenomActive ? [{ id: 'protovenom', tone: 'danger' as const, stacks: 1 }] : []),
      ...(state.puddleDropAt !== undefined ? [{ id: 'blood-pool-drop', label: 'Pool', tone: 'danger' as const, stacks: 1, expiresAt: state.puddleDropAt }] : []),
      ...(state.empoweringSlamStacks ? [{ id: 'empowering-slam', tone: 'danger' as const, stacks: state.empoweringSlamStacks }] : []),
      ...(state.bloodvenomInjectionStacks ? [{ id: 'bloodvenom-injection', tone: 'danger' as const, stacks: state.bloodvenomInjectionStacks }] : []),
    ] : [
      ...(state.phase === 'active' && phaseAge >= npcPoolAppliedAge && phaseAge < npcPoolDropAge && npcPoolTargets.includes(member.id) ? [{ id: 'blood-pool-drop', label: 'Pool', tone: 'danger' as const, stacks: 1, expiresAt: state.phaseStartedAt + npcPoolDropAge }] : []),
      ...(state.protovenomActive && state.protovenomCarrierIds.includes(member.id) ? [{ id: 'protovenom', tone: 'danger' as const, stacks: 1 }] : []),
      ...(state.blightedActive && !state.blightedResolved && state.blightedTargetId === member.id ? [{ id: 'blighted-blood', tone: 'danger' as const, stacks: 1 }] : []),
    ],
  }))
  actors.push(
    { id: 'breath-of-ulatek', kind: 'boss', position: state.acidBoss, facing: 0, color: '#61dc79', auras: [], health: state.acidHealth },
    { id: 'blood-of-ulatek', kind: 'boss', position: state.bloodBoss, facing: Math.PI, color: '#e45663', auras: [], health: state.bloodHealth },
  )
  if (state.phase === 'active' && phaseAge >= 8 && state.coagulationHealth > 0) {
    const acidHome = homeForSide('acid', state.cycle)
    actors.push({ id: 'venom-coagulation', kind: 'enemy', position: { x: towardCentre(acidHome, 15), z: 18 }, facing: 0, color: '#79d85e', auras: [], health: state.coagulationHealth })
  }
  const effects: EffectSnapshot[] = []
  for (const droplet of state.droplets) {
    if (!droplet.soaked) effects.push({ id: droplet.id, kind: 'ground-soak', position: droplet.position, radius: 2.2, color: '#6bea72', progress: 0, filled: true })
    if (droplet.soakedAt !== undefined) {
      const age = state.time - droplet.soakedAt
      if (age < timing.livingVenomTelegraphSeconds) effects.push({ id: `${droplet.id}-return-lane`, kind: 'lane', position: droplet.position, target: state.acidBoss, radius: .75, color: '#83ff68', progress: age / timing.livingVenomTelegraphSeconds })
      else if (age < timing.livingVenomTelegraphSeconds + timing.livingVenomSeconds) effects.push({ id: `${droplet.id}-return`, kind: 'projectile', position: droplet.position, target: state.acidBoss, radius: 1.2, color: '#83ff68', progress: Math.min(1, (age - timing.livingVenomTelegraphSeconds) / timing.livingVenomSeconds) })
    }
  }
  if (state.phase === 'active' && phaseAge >= 17 && phaseAge < 17 + timing.miasmaSeconds) {
    const home = homeForSide('blood', state.cycle)
    effects.push({ id: 'miasma-soak', kind: 'ground-soak', position: { x: towardCentre(home, 13), z: 16 }, radius: 7.5, color: '#ee5265', progress: (phaseAge - 17) / timing.miasmaSeconds, filled: true })
  }
  for (const pool of state.pools) effects.push({ id: pool.id, kind: 'ground-harmful', position: pool.position, radius: 4.5, color: '#b92c4b', progress: 1 })
  if (state.protovenomActive) {
    effects.push({ id: 'player-protovenom-ring', kind: 'ground-spread', ownerId: 'controlled-player', position: state.player, radius: 3, color: '#ff4059', progress: 1, filled: false })
    actors.filter(actor => state.protovenomCarrierIds.includes(actor.id)).forEach(actor => effects.push({ id: `${actor.id}-protovenom-ring`, kind: 'ground-spread', ownerId: actor.id, position: actor.position, radius: 3, color: '#ff4059', progress: 1, filled: false }))
  }
  actors.filter(actor => actor.auras.some(aura => aura.id === 'blood-pool-drop')).forEach(actor => effects.push({ id: `${actor.id}-blood-pool-ring`, kind: 'ground-spread', ownerId: actor.id, position: actor.position, radius: 4.5, color: '#b92c4b', progress: 1, filled: false }))
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
    if (age < 2) return 'Spread while both Sentinels move to the middle'
    return state.helicalResolved ? 'Your Helical pair is clear — avoid resolving pairs' : 'Read your toxins and find any complementary player'
  }
  const age = state.time - state.phaseStartedAt
  if (age >= 8 && state.coagulationHealth > 0) return `Target Venom Coagulation · ${Math.ceil(state.coagulationHealth / 20)} Main casts`
  if (state.protovenomActive) return 'Meet only your marked Protovenom partner'
  if (state.dropletsSpawned && age < 30) return `Soak your ${state.assignedSide === 'acid' ? 'green' : 'red-side'} droplet, then leave its return beam`
  if (state.assignedSide === 'blood' && age >= 17 && age < 25) return 'Join the red group soak'
  if (state.puddleDropAt !== undefined) return 'Move to the outer wall before your pool drops'
  if (state.blightedActive && !state.blightedResolved) return 'Dispel Blighted Blood'
  if (isTank(state)) return 'Keep your Sentinel at least 40 yards from its partner'
  return `Hold the ${state.assignedSide === 'acid' ? 'green' : 'red'} side and read your marks`
}

export function nextSentinelsTimer(state: SentinelsState) {
  const age = state.time - state.phaseStartedAt
  const timing = sentinelsTiming(state.projection)
  if (state.phase === 'stasis') return age < 2 ? { label: 'Spread', seconds: 2 - age } : { label: 'Helical', seconds: Math.max(0, 2 + timing.helicalSeconds - age) }
  if (age < 8) return { label: 'Venom add', seconds: Math.max(0, 8 - age) }
  if (state.coagulationHealth > 0) return { label: 'Noxious Blast', seconds: Math.max(0, 30 - age) }
  const assignedDroplet = state.droplets.find(droplet => droplet.assignedToPlayer && droplet.side === state.assignedSide)
  if (state.dropletsSpawned && assignedDroplet && !assignedDroplet.soaked) return { label: 'Droplet', seconds: Math.max(0, timing.dropletFuseSeconds - (state.time - (state.dropletsSpawnedAt ?? state.time))) }
  if (state.puddleDropAt !== undefined) return { label: 'Pool', seconds: Math.max(0, state.puddleDropAt - state.time) }
  if (state.blightedActive && !state.blightedResolved) return { label: 'Dispel', seconds: Math.max(0, 52 - age) }
  const duration = timing.activeSeconds[state.cycle - 1]
  return { label: 'Stasis', seconds: Math.max(0, duration - age) }
}

export function sentinelsPlayerRole(state: SentinelsState) {
  const role = contractSelectedMember(state.selectedSlotId).role
  return `${state.assignedSide} ${role}`
}

export const sentinelsContract = { dominanceYards: DOMINANCE_YARDS, projections: { learn2d: sentinelsTiming('learn2d'), train3d: sentinelsTiming('train3d') } }
