import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { sentinelsArena } from './train3d/arenas'

export type SentinelSide = 'acid' | 'blood'
export type SentinelsPhase = 'active' | 'stasis'
export type SentinelsOutcome = 'active' | 'success' | 'wipe'

export interface DropletState { id: string; position: WorldPoint; assignedToPlayer: boolean; soaked: boolean; soakedAt?: number }
export interface BloodPoolState { id: string; position: WorldPoint; createdAt: number }

export interface SentinelsState {
  time: number
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
  miasmaResolved: boolean
  puddleDropAt?: number
  pools: readonly BloodPoolState[]
  blightedActive: boolean
  blightedResolved: boolean
  protovenomActive: boolean
  protovenomResolved: boolean
  helicalResolved: boolean
  outcome: SentinelsOutcome
  outcomeReason?: string
  mistakes: number
  failures: readonly RuntimeFailure[]
}

const ACID_HOME = { x: -50, z: 0 }
const BLOOD_HOME = { x: 50, z: 0 }
const STASIS_ACID = { x: -5, z: 0 }
const STASIS_BLOOD = { x: 5, z: 0 }
const FIRST_ACTIVE_SECONDS = 60
const SECOND_ACTIVE_SECONDS = 72
const STASIS_SECONDS = 30
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

function playerStart(slotId: string, cycle: 1 | 2): { x: number; z: number; facing: number } {
  const member = contractSelectedMember(slotId)
  const side = sideForSlot(slotId, cycle)
  const home = homeForSide(side, cycle)
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, cycle) === side && candidate.role === member.role)
  const index = Math.max(0, peers.findIndex(candidate => candidate.id === slotId))
  const row = member.role === 'tank' ? 4 : member.role === 'melee' ? 8 : 15
  return { x: home.x + (side === 'acid' ? row : -row), z: (index - (peers.length - 1) / 2) * 4, facing: side === 'acid' ? -Math.PI / 2 : Math.PI / 2 }
}

export function createSentinelsState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal'): SentinelsState {
  return {
    time: 0, phase: 'active', phaseStartedAt: 0, cycle: 1, trainingDifficulty, selectedSlotId,
    assignedSide: sideForSlot(selectedSlotId, 1), player: playerStart(selectedSlotId, 1),
    acidBoss: { ...ACID_HOME }, bloodBoss: { ...BLOOD_HOME }, acidHealth: 100, bloodHealth: 100, energy: 50,
    acidMarks: 0, bloodMarks: 0, lastMarkAt: 0, droplets: [], dropletsSpawned: false,
    miasmaResolved: false, pools: [], blightedActive: false, blightedResolved: false,
    protovenomActive: false, protovenomResolved: false, helicalResolved: false,
    outcome: 'active', mistakes: 0, failures: [],
  }
}

export function prepareSentinelsSlot(state: SentinelsState, selectedSlotId: string): SentinelsState {
  return createSentinelsState(selectedSlotId, state.trainingDifficulty)
}

export function turnSentinelsPlayer(state: SentinelsState, yawDelta: number): SentinelsState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
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
  return [-12, -4, 4, 12].map((z, index) => ({
    id: `droplet-${cycle}-${index + 1}`,
    position: { x: acidHome.x + (cycle === 1 ? 12 : -12), z },
    assignedToPlayer: index === 1,
    soaked: false,
  }))
}

export function dispelSentinels(state: SentinelsState): SentinelsState {
  if (state.phase !== 'active' || !state.blightedActive || state.blightedResolved || state.assignedSide !== 'blood' || !isHealer(state)) return state
  return { ...state, blightedResolved: true }
}

function stepActive(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  const phaseAge = state.time - state.phaseStartedAt
  const duration = state.cycle === 1 ? FIRST_ACTIVE_SECONDS : SECOND_ACTIVE_SECONDS
  const member = contractSelectedMember(state.selectedSlotId)
  let player = stepPlayerMovement(state.player, commands, seconds, { halfWidth: sentinelsArena.width / 2 - 1.5, halfDepth: sentinelsArena.depth / 2 - 1.5 })
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
  const healthLoss = seconds * .16
  let next: SentinelsState = { ...state, player, acidBoss, bloodBoss, energy, acidHealth: Math.max(20, state.acidHealth - healthLoss), bloodHealth: Math.max(20, state.bloodHealth - healthLoss * .98) }

  if (phaseAge > 8 && distance(acidBoss, bloodBoss) < DOMINANCE_YARDS) next = addFailure(next, 'dominance', "Ula'tek's Dominance activated", 'Keep the two bosses at least 40 yards apart. Tank players must lead their owned boss back to its outer anchor.', true)

  if (next.time - next.lastMarkAt >= 5) {
    const acidMarks = next.acidMarks + Number(distance(player, acidBoss) <= 40)
    const bloodMarks = next.bloodMarks + Number(distance(player, bloodBoss) <= 40)
    next = { ...next, acidMarks, bloodMarks, lastMarkAt: next.time }
    if (acidMarks > 0 && bloodMarks > 0) next = addFailure(next, 'mixed-marks', 'Collected both Acid and Blood marks', 'Stay with the boss assigned to your current side; do not cross both 40-yard auras during the active cycle.')
  }

  if (!next.dropletsSpawned && phaseAge >= 12) next = { ...next, dropletsSpawned: true, droplets: spawnDroplets(next.cycle) }
  if (next.dropletsSpawned) {
    let droplets = next.droplets.map(droplet => {
      if (droplet.soaked) return droplet
      if (droplet.assignedToPlayer && next.assignedSide === 'acid' && distance(player, droplet.position) < 2.5) return { ...droplet, soaked: true, soakedAt: next.time }
      if ((!droplet.assignedToPlayer || next.assignedSide !== 'acid') && phaseAge >= 19 + Number(droplet.id.at(-1)) * .25) return { ...droplet, soaked: true, soakedAt: next.time }
      return droplet
    })
    next = { ...next, droplets }
    const missed = droplets.find(droplet => droplet.assignedToPlayer && next.assignedSide === 'acid' && !droplet.soaked)
    if (phaseAge >= 24 && missed) next = addFailure(next, 'droplet-exploded', 'Your Toxic Droplet erupted', 'On the Acid side, step into your assigned green droplet before Noxious Blast.', true)
    const beam = droplets.find(droplet => droplet.soakedAt !== undefined && next.time - droplet.soakedAt > .45 && next.time - droplet.soakedAt < 4)
    if (beam && lineDistance(player, beam.position, acidBoss) < 1.45) next = addFailure(next, 'living-venom', 'Hit by returning Living Venom', 'Clear the droplet, then step out of the visible return beam before the projectile reaches the boss.', true)
  }

  if (!next.miasmaResolved && phaseAge >= 25) {
    const target = { x: homeForSide('blood', next.cycle).x + (next.cycle === 1 ? -13 : 13), z: 16 }
    if (next.assignedSide === 'blood' && distance(player, target) > 7.5) next = addFailure(next, 'missed-miasma', 'Missed the Unstable Miasma group soak', 'Join the filled red soak circle with your Blood-side group before it resolves.', true)
    next = { ...next, miasmaResolved: true, puddleDropAt: next.assignedSide === 'blood' ? next.time + 5 : undefined }
  }
  if (next.puddleDropAt !== undefined && next.time >= next.puddleDropAt) {
    const pool = { id: `blood-pool-${next.cycle}-${next.time.toFixed(1)}`, position: { x: player.x, z: player.z }, createdAt: next.time }
    if (Math.abs(player.x) < 28) next = addFailure(next, 'central-pool', 'Dropped Blood Venom in the central corridor', 'After the group soak, move to the outside wall before the five-second pool aura expires.')
    next = { ...next, puddleDropAt: undefined, pools: [...next.pools, pool] }
  }
  if (next.pools.some(pool => distance(player, pool.position) < 4.5 && next.time - pool.createdAt > .5)) next = addFailure(next, 'blood-pool-contact', 'Standing in Blood Venom', 'Move away from placed red pools and preserve the central corridor.')

  const blightedActive = phaseAge >= 34 && phaseAge < 52 && next.assignedSide === 'blood' && isHealer(next)
  next = { ...next, blightedActive }
  if (phaseAge >= 52 && next.assignedSide === 'blood' && isHealer(next) && !next.blightedResolved) next = addFailure(next, 'blighted-expired', 'Blighted Blood was not dispelled', `Use Dispel on the infected Blood-side player before the 18-second aura expires.`, true)

  if (phaseAge >= 40 && !next.protovenomResolved) next = { ...next, protovenomActive: true }
  if (next.protovenomActive && !next.protovenomResolved) {
    const home = homeForSide(next.assignedSide, next.cycle)
    const partner = { x: home.x + (next.assignedSide === 'acid' ? 18 : -18), z: -14 }
    const unmarked = { x: partner.x, z: -5 }
    if (distance(player, unmarked) < 2.5) next = addFailure(next, 'protovenom-unmarked', 'Protovenom touched an unmarked player', 'Move only into the partner carrying the matching red circle.', true)
    else if (distance(player, partner) < 2.5) next = { ...next, protovenomResolved: true, protovenomActive: false }
  }

  if (phaseAge >= duration) {
    if (!next.protovenomResolved) return addFailure(next, 'protovenom-stasis', 'Protovenom remained active at Stasis', 'Clear the marked pair before the bosses reach 100 energy.', true)
    next = { ...next, phase: 'stasis', phaseStartedAt: next.time, energy: 100, acidBoss: { ...STASIS_ACID }, bloodBoss: { ...STASIS_BLOOD }, helicalResolved: false }
  }
  return next
}

function helicalPartner(state: SentinelsState): WorldPoint {
  return { x: state.selectedSlotId.length % 2 ? 0 : 2, z: state.cycle === 1 ? -14 : 14 }
}

function stepStasis(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  const age = state.time - state.phaseStartedAt
  const player = stepPlayerMovement(state.player, commands, seconds, { halfWidth: sentinelsArena.width / 2 - 1.5, halfDepth: sentinelsArena.depth / 2 - 1.5 })
  let next = { ...state, player, acidBoss: { ...STASIS_ACID }, bloodBoss: { ...STASIS_BLOOD }, energy: 100 }
  const partner = helicalPartner(next)
  const wrong = { x: 12, z: next.cycle === 1 ? -6 : 6 }
  if (!next.helicalResolved && distance(player, wrong) < 2.6) next = addFailure(next, 'wrong-helical', 'Joined an incompatible Helical partner', 'Match your attached red/green composition with exactly one complementary player.', true)
  else if (!next.helicalResolved && distance(player, partner) < 2.6) next = { ...next, helicalResolved: true }
  if (age >= 28 && !next.helicalResolved) next = addFailure(next, 'helical-expired', 'Helical Toxins expired', 'Reach the compatible composition before the 28-second matching window ends.', true)
  if (age >= STASIS_SECONDS && next.outcome === 'active') {
    if (next.cycle === 2) return { ...next, outcome: 'success', acidHealth: 0, bloodHealth: 0 }
    const cycle = 2 as const
    const assignedSide = sideForSlot(next.selectedSlotId, cycle)
    next = {
      ...next, phase: 'active', phaseStartedAt: next.time, cycle, assignedSide, energy: 0,
      acidBoss: isTank(next) && assignedSide === 'acid' ? { ...STASIS_ACID } : homeForSide('acid', cycle),
      bloodBoss: isTank(next) && assignedSide === 'blood' ? { ...STASIS_BLOOD } : homeForSide('blood', cycle),
      acidMarks: 0, bloodMarks: 0, lastMarkAt: next.time, droplets: [], dropletsSpawned: false,
      miasmaResolved: false, puddleDropAt: undefined, blightedActive: false, blightedResolved: false,
      protovenomActive: false, protovenomResolved: false, helicalResolved: false,
    }
  }
  return next
}

export function stepSentinelsState(state: SentinelsState, commands: PlayerCommandState, seconds: number): SentinelsState {
  if (state.outcome !== 'active') return state
  const timed = { ...state, time: state.time + seconds }
  return timed.phase === 'active' ? stepActive(timed, commands, seconds) : stepStasis(timed, commands, seconds)
}

function memberPosition(member: ContractRaidMember, state: SentinelsState): WorldPoint {
  if (member.id === state.selectedSlotId) return state.player
  if (state.phase === 'stasis') {
    const index = contractRaidRoster.findIndex(candidate => candidate.id === member.id)
    const ring = 11 + index % 3 * 4
    const angle = index / contractRaidRoster.length * Math.PI * 2
    return { x: Math.cos(angle) * ring, z: Math.sin(angle) * ring }
  }
  const side = sideForSlot(member.id, state.cycle); const home = homeForSide(side, state.cycle)
  const peers = contractRaidRoster.filter(candidate => sideForSlot(candidate.id, state.cycle) === side)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  return { x: home.x + (side === 'acid' ? 11 : -11), z: -20 + index * 4.5 }
}

function toxins(green: number, red: number) {
  return [
    ...(green ? [{ id: 'green-toxin', tone: 'poison' as const, stacks: green }] : []),
    ...(red ? [{ id: 'red-toxin', tone: 'danger' as const, stacks: red }] : []),
  ]
}

export function sentinelsSnapshot(state: SentinelsState): Train3DSnapshot {
  const phaseAge = state.time - state.phaseStartedAt
  const actors: ActorSnapshot[] = contractRosterForSlot(state.selectedSlotId).map(member => ({
    id: member.controlled ? 'player' : member.id, kind: member.controlled ? 'player' : 'ally', playerClass: member.playerClass,
    position: memberPosition(member, state), facing: 0, color: trainingClassColors[member.playerClass], health: member.controlled ? 100 : undefined,
    auras: member.controlled && state.phase === 'stasis' ? toxins(1, 3) : member.controlled ? [
      ...(state.acidMarks ? [{ id: 'acid-mark', tone: 'poison' as const, stacks: state.acidMarks }] : []),
      ...(state.bloodMarks ? [{ id: 'blood-mark', tone: 'danger' as const, stacks: state.bloodMarks }] : []),
      ...(state.protovenomActive ? [{ id: 'protovenom', tone: 'danger' as const, stacks: 1 }] : []),
    ] : [],
  }))
  actors.push(
    { id: 'breath-of-ulatek', kind: 'boss', position: state.acidBoss, facing: 0, color: '#61dc79', auras: [], health: state.acidHealth },
    { id: 'blood-of-ulatek', kind: 'boss', position: state.bloodBoss, facing: Math.PI, color: '#e45663', auras: [], health: state.bloodHealth },
  )
  if (state.phase === 'active' && phaseAge >= 8 && phaseAge < 28) {
    const acidHome = homeForSide('acid', state.cycle)
    actors.push({ id: 'venom-coagulation', kind: 'enemy', position: { x: acidHome.x + (state.cycle === 1 ? 15 : -15), z: 18 }, facing: 0, color: '#79d85e', auras: [], health: Math.max(0, 100 - (phaseAge - 8) * 5) })
  }
  if (state.phase === 'stasis') {
    actors.push({ id: 'helical-partner', kind: 'ally', playerClass: 'priest', position: helicalPartner(state), facing: 0, color: trainingClassColors.priest, auras: toxins(3, 1) })
    actors.push({ id: 'wrong-helical-partner', kind: 'ally', playerClass: 'warlock', position: { x: 12, z: state.cycle === 1 ? -6 : 6 }, facing: 0, color: trainingClassColors.warlock, auras: toxins(2, 2) })
  }
  if (state.protovenomActive) {
    const home = homeForSide(state.assignedSide, state.cycle)
    actors.push({ id: 'protovenom-partner', kind: 'ally', playerClass: 'paladin', position: { x: home.x + (state.assignedSide === 'acid' ? 18 : -18), z: -14 }, facing: 0, color: trainingClassColors.paladin, auras: [{ id: 'protovenom', tone: 'danger', stacks: 1 }] })
    actors.push({ id: 'unmarked-player', kind: 'ally', playerClass: 'hunter', position: { x: home.x + (state.assignedSide === 'acid' ? 18 : -18), z: -5 }, facing: 0, color: trainingClassColors.hunter, auras: [] })
  }
  const effects: EffectSnapshot[] = []
  for (const droplet of state.droplets) {
    if (!droplet.soaked) effects.push({ id: droplet.id, kind: 'ground-soak', position: droplet.position, radius: 2.2, color: '#6bea72', progress: 0, filled: true })
    if (droplet.soakedAt !== undefined && state.time - droplet.soakedAt < 4) effects.push({ id: `${droplet.id}-return`, kind: 'projectile', position: droplet.position, target: state.acidBoss, radius: 1.2, color: '#83ff68', progress: Math.min(1, (state.time - droplet.soakedAt) / 4) })
  }
  if (state.phase === 'active' && phaseAge >= 17 && phaseAge < 25) {
    const home = homeForSide('blood', state.cycle)
    effects.push({ id: 'miasma-soak', kind: 'ground-soak', position: { x: home.x + (state.cycle === 1 ? -13 : 13), z: 16 }, radius: 7.5, color: '#ee5265', progress: (phaseAge - 17) / 8, filled: true })
  }
  for (const pool of state.pools) effects.push({ id: pool.id, kind: 'ground-harmful', position: pool.position, radius: 4.5, color: '#b92c4b', progress: 1 })
  if (state.protovenomActive) {
    effects.push({ id: 'player-protovenom-ring', kind: 'ground-spread', position: state.player, radius: 3, color: '#ff4059', progress: 1, filled: false })
  }
  if (state.phase === 'stasis') effects.push({ id: 'helical-meeting', kind: 'pulse', position: helicalPartner(state), radius: 3.5, color: '#8be99b', progress: (state.time % 1.5) / 1.5 })
  const add = actors.find(actor => actor.id === 'venom-coagulation')
  const cosmeticTarget = add?.position ?? (state.phase === 'active' ? state.assignedSide === 'acid' ? state.acidBoss : state.bloodBoss : STASIS_ACID)
  return { time: state.time, arena: sentinelsArena, actors, effects: [...effects, ...cosmeticClassProjectiles(actors, cosmeticTarget, state.time)] }
}

export function activeSentinelsPrompt(state: SentinelsState) {
  if (state.phase === 'stasis') return state.helicalResolved ? 'Helical resolved — prepare to swap sides' : 'Find the complementary toxin composition'
  const age = state.time - state.phaseStartedAt
  if (state.protovenomActive) return 'Meet only your marked Protovenom partner'
  if (state.assignedSide === 'acid' && age >= 12 && age < 24) return 'Soak your green droplet, then leave its return beam'
  if (state.assignedSide === 'blood' && age >= 17 && age < 25) return 'Join the red group soak'
  if (state.puddleDropAt !== undefined) return 'Move to the outer wall before your pool drops'
  if (state.blightedActive && !state.blightedResolved) return 'Dispel Blighted Blood'
  if (isTank(state)) return 'Keep your Sentinel at least 40 yards from its partner'
  return `Hold the ${state.assignedSide === 'acid' ? 'green' : 'red'} side and read your marks`
}

export function nextSentinelsTimer(state: SentinelsState) {
  const age = state.time - state.phaseStartedAt
  if (state.phase === 'stasis') return { label: 'Helical', seconds: Math.max(0, 28 - age) }
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
