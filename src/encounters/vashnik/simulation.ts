import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors, type ContractRaidMember } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceMainAction, beginMainAction, publishMainProjectile } from '../../platform/combatActions'
import { coreEncounterEntities, createEncounterTimeline, advanceEncounterTimeline, beginEncounterAction, type EncounterTimelineState } from '../../platform/encounters/timeline'
import type { EncounterProjection, TimedApplication } from '../../platform/encounters/mechanicState'
import { activeApplications } from '../../platform/encounters/mechanicState'
import { advanceEntityMotion } from '../../platform/encounters/entityState'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { classProjectileEffects, cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { vashnikTiming } from './timing/projections'
import { vashnikArena } from './train3d/arenas'

export type Fountain = 'blood' | 'flame' | 'shadow'
export type FountainPair = 'flame-shadow' | 'shadow-blood' | 'blood-flame'
export type InfectionKind = 'exploding' | 'stygian' | 'siphoning'
export type VashnikOutcome = 'active' | 'success' | 'wipe'

export interface VashnikAdd {
  id: string
  family: Fountain
  generation: 0 | 1 | 2
  position: WorldPoint
  health: number
  shield: number
  speed: number
  assignedToPlayer: boolean
  spawnedAt: number
  hardened: boolean
}

export interface VashnikInfection {
  kind: InfectionKind
  startedAt: number
  expiresAt: number
  targetId: string
  origin: WorldPoint
  progress: number
  pulseIndex: number
}

export interface VashnikTumor { id: string; position: WorldPoint; resolved: boolean }
export interface TimedGroundEffect { id: string; position: WorldPoint; createdAt: number; expiresAt: number; radius: number; kind: 'umbral' | 'stygian' }

export interface VashnikState {
  time: number
  timeline: EncounterTimelineState
  projection: EncounterProjection
  trainingDifficulty: TrainingDifficulty
  selectedSlotId: string
  player: { x: number; z: number; facing: number }
  npcPositions: Readonly<Record<string, WorldPoint>>
  boss: WorldPoint
  bossHealth: number
  bossEnergy: number
  aggroOwner: string
  fangsTargetId?: string
  fangsStartedAt?: number
  lastFangsTargetId?: string
  fangsApplications: Readonly<Record<string, number>>
  cycle: number
  cycleStartedAt: number
  activePair?: FountainPair
  pairHistory: readonly FountainPair[]
  infusionApplications: Readonly<Record<Fountain, readonly TimedApplication[]>>
  toxicVaporStacks: number
  imbibedCycle: number
  infectionCycle: number
  bileCycle: number
  frothCycle: number
  fangsCycle: number
  adds: readonly VashnikAdd[]
  infection?: VashnikInfection
  groundEffects: readonly TimedGroundEffect[]
  bilePositions: readonly WorldPoint[]
  bileStartedAt?: number
  bileResolved: boolean
  tumors: readonly VashnikTumor[]
  frothStartedAt?: number
  wavesStartedAt?: number
  causticSurgeUntil?: number
  mainCastRemaining: number
  mainTargetId?: string
  mainProjectileFiredAt?: number
  mainProjectileOrigin?: WorldPoint
  mainProjectileTarget?: WorldPoint
  mainProjectileOrdinal: number
  outcome: VashnikOutcome
  outcomeReason?: string
  mistakes: number
  failures: readonly RuntimeFailure[]
}

export const FOUNTAINS: Readonly<Record<Fountain, WorldPoint>> = {
  blood: { x: 0, z: -36 },
  flame: { x: -31, z: 18 },
  shadow: { x: 31, z: 18 },
}
export const VASHNIK_ADD_LANES: Readonly<Record<Fountain, { origin: WorldPoint; destination: WorldPoint }>> = {
  blood: { origin: FOUNTAINS.blood, destination: { x: 0, z: 0 } },
  flame: { origin: FOUNTAINS.flame, destination: { x: 0, z: 0 } },
  shadow: { origin: FOUNTAINS.shadow, destination: { x: 0, z: 0 } },
}

export const PAIR_ORDER: readonly FountainPair[] = ['flame-shadow', 'shadow-blood', 'blood-flame']
const PAIR_FOUNTAINS: Readonly<Record<FountainPair, readonly [Fountain, Fountain]>> = {
  'flame-shadow': ['flame', 'shadow'],
  'shadow-blood': ['shadow', 'blood'],
  'blood-flame': ['blood', 'flame'],
}
const PAIR_POSITIONS: Readonly<Record<FountainPair, WorldPoint>> = {
  'flame-shadow': { x: 0, z: 20 },
  'shadow-blood': { x: 17, z: -10 },
  'blood-flame': { x: -17, z: -10 },
}
const INFECTION_SEQUENCE: readonly InfectionKind[] = ['stygian', 'siphoning', 'exploding']
const ROOM_RADIUS = 48
const CAVITY_RADIUS = 5.5
const FROTH_RADIUS = 4.5
const WAVE_HALF_WIDTH = 2.25
const BILE_RADIUS = 6
const HARDENED_SECONDS = 60
const INFECTION_COLORS = { exploding: '#ef7b42', stygian: '#8c74df', siphoning: '#cf5364' } as const

function vashnikHalfWidth(z: number) {
  if (z < -22) return 18 + (z + 46) / 24 * 20
  if (z > 12) return 38 - (z - 12) / 34 * 15
  return 38
}

export function clampToVashnikArena<T extends WorldPoint>(point: T): T {
  const z = Math.max(-46, Math.min(46, point.z))
  const halfWidth = Math.max(17, vashnikHalfWidth(z) - 1)
  return { ...point, x: Math.max(-halfWidth, Math.min(halfWidth, point.x)), z }
}

function memberPosition(member: ContractRaidMember): WorldPoint {
  const index = contractRaidRoster.findIndex(candidate => candidate.id === member.id)
  const angle = index / contractRaidRoster.length * Math.PI * 2
  const radius = member.role === 'tank' || member.role === 'melee' ? 9 : member.role === 'healer' ? 18 : 24
  return { x: Math.cos(angle) * radius, z: 14 + Math.sin(angle) * radius * .65 }
}

function otherTank(id: string) { return id === 'tank-2' ? 'tank-1' : 'tank-2' }

export function fountainsForPair(pair: FountainPair): readonly [Fountain, Fountain] { return PAIR_FOUNTAINS[pair] }

export function selectVashnikFountainPair(position: WorldPoint): FountainPair {
  const nearest = (Object.entries(FOUNTAINS) as [Fountain, WorldPoint][])
    .sort(([, a], [, b]) => distance(position, a) - distance(position, b))
    .slice(0, 2)
    .map(([fountain]) => fountain)
  if (nearest.includes('flame') && nearest.includes('shadow')) return 'flame-shadow'
  if (nearest.includes('shadow') && nearest.includes('blood')) return 'shadow-blood'
  return 'blood-flame'
}

function infectionForCycle(cycle: number): InfectionKind { return INFECTION_SEQUENCE[(cycle - 1) % INFECTION_SEQUENCE.length] }

function addFailure(state: VashnikState, code: string, label: string, advice: string, encounterFailure = false): VashnikState {
  if (state.failures.some(failure => failure.code === code && state.time - failure.time < 3)) return state
  const mistakes = state.mistakes + 1
  const wipe = shouldEndTrainingAttempt(state.trainingDifficulty, mistakes, encounterFailure)
  const failure = { id: `vashnik-${code}-${state.time.toFixed(2)}`, code, time: state.time, label, advice }
  return { ...state, mistakes, failures: [failure, ...state.failures].slice(0, 5), outcome: wipe ? 'wipe' : state.outcome, outcomeReason: wipe ? label : state.outcomeReason }
}

export function createVashnikState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal', projection: EncounterProjection = 'train3d'): VashnikState {
  const member = contractSelectedMember(selectedSlotId)
  const player = memberPosition(member)
  const npcPositions = Object.fromEntries(contractRaidRoster.filter(candidate => candidate.id !== selectedSlotId).map(candidate => [candidate.id, memberPosition(candidate)]))
  const aggroOwner = member.role === 'tank' ? selectedSlotId : 'tank-1'
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(candidate => candidate.id !== selectedSlotId).map(candidate => candidate.id), ['vashnik-boss'], vashnikArena.id))
  return {
    time: 0, timeline, projection, trainingDifficulty, selectedSlotId, player: { ...player, facing: 0 }, npcPositions,
    boss: { ...PAIR_POSITIONS['flame-shadow'] }, bossHealth: 100, bossEnergy: 0, aggroOwner, fangsApplications: {},
    cycle: 1, cycleStartedAt: 0, pairHistory: [], infusionApplications: { blood: [], flame: [], shadow: [] }, toxicVaporStacks: 0,
    imbibedCycle: 0, infectionCycle: 0, bileCycle: 0, frothCycle: 0, fangsCycle: 0, adds: [], groundEffects: [],
    bilePositions: [], bileResolved: false, tumors: [], mainCastRemaining: 0, mainProjectileOrdinal: 0,
    outcome: 'active', mistakes: 0, failures: [],
  }
}

export function prepareVashnikSlot(state: VashnikState, selectedSlotId: string): VashnikState {
  return createVashnikState(selectedSlotId, state.trainingDifficulty, state.projection)
}

export function turnVashnikPlayer(state: VashnikState, yawDelta: number): VashnikState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

function targetPriority(add: VashnikAdd) {
  if (add.family === 'blood') return 0
  if (add.family === 'flame') return 1
  return 2
}

export function startVashnikMainCast(state: VashnikState): VashnikState {
  if (state.outcome !== 'active' || state.mainCastRemaining > 0) return state
  const target = state.adds.filter(add => add.health > 0).sort((a, b) => Number(b.assignedToPlayer) - Number(a.assignedToPlayer) || targetPriority(a) - targetPriority(b) || distance(state.player, a.position) - distance(state.player, b.position))[0]
  const targetId = target?.id ?? 'vashnik-boss'
  const next = beginMainAction(state, targetId)
  return next === state ? state : { ...next, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'main-ability', 1, targetId) }
}

export function tauntVashnik(state: VashnikState): VashnikState {
  if (contractSelectedMember(state.selectedSlotId).role !== 'tank' || state.aggroOwner === state.selectedSlotId || state.outcome !== 'active') return state
  return { ...state, aggroOwner: state.selectedSlotId, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'taunt', 0, 'vashnik-boss') }
}

function spawnAdds(state: VashnikState, pair: FountainPair): readonly VashnikAdd[] {
  const selectedIndex = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  const additions: VashnikAdd[] = []
  for (const fountain of fountainsForPair(pair)) {
    const count = fountain === 'flame' ? 2 : fountain === 'shadow' ? 5 : 1
    for (let index = 0; index < count; index += 1) {
      const lane = VASHNIK_ADD_LANES[fountain]
      const dx = lane.destination.x - lane.origin.x
      const dz = lane.destination.z - lane.origin.z
      const length = Math.max(.1, Math.hypot(dx, dz))
      const offset = (index - (count - 1) / 2) * 1.15
      const position = clampToVashnikArena({ x: lane.origin.x - dz / length * offset, z: lane.origin.z + dx / length * offset })
      additions.push({ id: `${fountain}-${state.cycle}-${index}`, family: fountain, generation: 0, position, health: 100, shield: fountain === 'shadow' ? 100 : 0, speed: fountain === 'flame' ? .82 : .68, assignedToPlayer: index === selectedIndex % count, spawnedAt: state.time, hardened: false })
    }
  }
  return additions
}

function splitBloodAdd(add: VashnikAdd, time: number): readonly VashnikAdd[] {
  if (add.family !== 'blood' || add.generation >= 2) return []
  const generation = (add.generation + 1) as 1 | 2
  return [-1, 1].map((direction, index) => ({
    ...add,
    id: `${add.id}-${generation}-${index}`,
    generation,
    position: { x: add.position.x + direction * 1.6, z: add.position.z + .8 },
    health: generation === 1 ? 70 : 45,
    shield: 0,
    speed: .78 + generation * .1,
    assignedToPlayer: add.assignedToPlayer && index === 0,
    spawnedAt: time,
    hardened: false,
  }))
}

function applyDamage(state: VashnikState, targetId: string, amount: number): VashnikState {
  const target = state.adds.find(add => add.id === targetId && add.health > 0)
  if (!target) return { ...state, bossHealth: Math.max(0, state.bossHealth - amount * .12) }
  const shieldDamage = Math.min(target.shield, amount)
  const healthDamage = amount - shieldDamage
  const nextTarget = { ...target, shield: target.shield - shieldDamage, health: Math.max(0, target.health - healthDamage) }
  let additions: readonly VashnikAdd[] = []
  let causticSurgeUntil = state.causticSurgeUntil
  let next = state
  if (target.health > 0 && nextTarget.health === 0) {
    additions = splitBloodAdd(nextTarget, state.time)
    if (target.family === 'flame') {
      if (causticSurgeUntil !== undefined && state.time < causticSurgeUntil) next = addFailure(next, 'caustic-overlap', 'Burning Venoms died inside one Caustic Surge window', 'Stagger Flame add deaths by at least three seconds.')
      causticSurgeUntil = state.time + 3
    }
  }
  return { ...next, adds: [...state.adds.map(add => add.id === target.id ? nextTarget : add), ...additions], causticSurgeUntil }
}

function resolveMain(state: VashnikState, seconds: number): VashnikState {
  const advanced = advanceMainAction(state, seconds)
  let next = advanced.state
  if (!advanced.completedTargetId) return next
  const target = state.adds.find(add => add.id === advanced.completedTargetId)
  const targetPosition = target?.position ?? state.boss
  next = publishMainProjectile(next, targetPosition)
  return applyDamage(next, advanced.completedTargetId, 55)
}

function beginImbibe(state: VashnikState): VashnikState {
  const selected = selectVashnikFountainPair(state.boss)
  const expected = PAIR_ORDER[(state.cycle - 1) % PAIR_ORDER.length]
  let next = state
  if (selected !== expected) next = addFailure(next, 'wrong-fountain-pair', `Imbibe selected ${selected} instead of ${expected}`, 'Position Vashnik between the two called fountains before 100 energy.', true)
  const applications = { ...next.infusionApplications }
  for (const fountain of fountainsForPair(selected)) applications[fountain] = [...applications[fountain], { id: `${fountain}-${state.cycle}`, appliedAt: state.time, duration: 90 }]
  return {
    ...next,
    activePair: selected,
    pairHistory: [...next.pairHistory, selected],
    infusionApplications: applications,
    toxicVaporStacks: next.toxicVaporStacks + 1,
    adds: [...next.adds, ...spawnAdds(next, selected)],
    imbibedCycle: state.cycle,
    bossEnergy: 100,
  }
}

function infectionCamp(state: VashnikState): WorldPoint {
  const index = Math.max(0, contractRaidRoster.findIndex(member => member.id === state.selectedSlotId))
  return index % 2 === 0 ? { x: -10, z: 15 } : { x: 10, z: 15 }
}

function beginInfection(state: VashnikState, timing: ReturnType<typeof vashnikTiming>): VashnikState {
  const kind = infectionForCycle(state.cycle)
  return { ...state, infectionCycle: state.cycle, infection: { kind, startedAt: state.time, expiresAt: state.time + timing.infectionDuration, targetId: state.selectedSlotId, origin: { ...state.player }, progress: 0, pulseIndex: 0 } }
}

function stepInfection(state: VashnikState): VashnikState {
  const infection = state.infection
  if (!infection) return state
  let next = state
  if (infection.kind === 'stygian') {
    const pulseIndex = Math.floor((state.time - infection.startedAt) / 2)
    if (pulseIndex > infection.pulseIndex) {
      const prior = infection.origin
      if (distance(state.player, prior) < 6) next = addFailure(next, 'stygian-hit', 'Stygian Burst caught its carrier', 'Keep moving so each burst lands behind you.')
      next = { ...next, groundEffects: [...next.groundEffects, { id: `stygian-${state.cycle}-${pulseIndex}`, position: prior, createdAt: state.time, expiresAt: state.time + 2, radius: 6, kind: 'stygian' }], infection: { ...infection, origin: { ...state.player }, pulseIndex } }
    }
  } else if (infection.kind === 'siphoning') {
    const camp = infectionCamp(state)
    const progress = Math.min(100, infection.progress + (distance(state.player, camp) <= 10 ? 32 : 8))
    next = { ...next, infection: { ...infection, progress } }
  }
  if (state.time < infection.expiresAt) return next
  const resolved = next.infection ?? infection
  if (resolved.kind === 'exploding' && Math.hypot(state.player.x, state.player.z) < 34) next = addFailure(next, 'exploding-inside', 'Exploding Infection detonated beside the raid', 'Use an uncontested outer lane before removal.')
  if (resolved.kind === 'siphoning' && resolved.progress < 100) next = addFailure(next, 'siphon-underfilled', 'Siphoning Infection did not receive enough helper coverage', 'Join the assigned support camp until the absorb clears.')
  return { ...next, infection: undefined }
}

function beginBile(state: VashnikState): VashnikState {
  const target = { x: Math.max(-34, Math.min(34, state.player.x + 8)), z: Math.max(-34, Math.min(34, state.player.z)) }
  return { ...state, bileCycle: state.cycle, bileStartedAt: state.time, bileResolved: false, bilePositions: [target, { x: -17, z: -8 }, { x: 17, z: -8 }] }
}

function resolveBile(state: VashnikState, duration: number): VashnikState {
  if (state.bileStartedAt === undefined || state.bileResolved || state.time < state.bileStartedAt + duration) return state
  let next = state
  const assignedBile = state.bilePositions[0]
  if (!assignedBile || distance(state.player, assignedBile) > BILE_RADIUS) next = addFailure(next, 'empty-bile', 'Your Catalytic Bile circle resolved empty', 'Cover the highlighted circle; extra occupants are allowed.')
  return { ...next, bileResolved: true, bilePositions: [] }
}

function seededTumors(cycle: number, origin: WorldPoint): readonly VashnikTumor[] {
  const assigned = { x: origin.x, z: Math.max(-34, Math.min(34, origin.z - 18)) }
  return [
    { id: `tumor-${cycle}-player`, position: assigned, resolved: false },
    { id: `tumor-${cycle}-npc-a`, position: { x: -24 + cycle * 2, z: -6 }, resolved: false },
    { id: `tumor-${cycle}-npc-b`, position: { x: 22, z: 5 - cycle * 2 }, resolved: false },
  ]
}

function beginFroth(state: VashnikState): VashnikState {
  return { ...state, frothCycle: state.cycle, frothStartedAt: state.time, wavesStartedAt: undefined, tumors: seededTumors(state.cycle, state.player) }
}

function waveIntersects(origin: WorldPoint, target: WorldPoint) {
  return Math.abs(origin.x - target.x) <= WAVE_HALF_WIDTH || Math.abs(origin.z - target.z) <= WAVE_HALF_WIDTH
}

function resolveFroth(state: VashnikState, duration: number): VashnikState {
  if (state.frothStartedAt === undefined || state.wavesStartedAt !== undefined || state.time < state.frothStartedAt + duration) return state
  let next = state
  const tumors = state.tumors.map((tumor, index) => ({ ...tumor, resolved: index > 0 || waveIntersects(state.player, tumor.position) }))
  if (tumors.some(tumor => !tumor.resolved)) next = addFailure(next, 'uncleared-tumor', 'Your Plague Waves missed the assigned Malignant Tumor', 'Align one arena-fixed cardinal lane through the highlighted Tumor before Froth expires.')
  return { ...next, tumors, wavesStartedAt: state.time }
}

function stepFangs(state: VashnikState, timing: ReturnType<typeof vashnikTiming>): VashnikState {
  let next = state
  const age = state.time - state.cycleStartedAt
  if (state.fangsCycle < state.cycle && age >= timing.fangsAt) next = { ...state, fangsCycle: state.cycle, fangsStartedAt: state.time, fangsTargetId: state.aggroOwner }
  if (next.fangsStartedAt === undefined || next.time < next.fangsStartedAt + timing.fangsCastSeconds) return next
  if (next.lastFangsTargetId === next.fangsTargetId) next = addFailure(next, 'missed-tank-swap', 'Dripping Fangs struck the same tank twice', 'Swap ownership after every Dripping Fangs cast.', true)
  const applications = { ...next.fangsApplications, [next.fangsTargetId!]: next.time + 32 }
  const selected = contractSelectedMember(next.selectedSlotId)
  const shouldNpcSwap = selected.role !== 'tank' || next.fangsTargetId === next.selectedSlotId
  return { ...next, fangsApplications: applications, lastFangsTargetId: next.fangsTargetId, aggroOwner: shouldNpcSwap ? otherTank(next.fangsTargetId!) : next.aggroOwner, fangsStartedAt: undefined }
}

function stepAdds(state: VashnikState, seconds: number): VashnikState {
  let next = state
  const newGround: TimedGroundEffect[] = []
  const additions: VashnikAdd[] = []
  const adds = state.adds.map(add => {
    if (add.health <= 0) return add
    const hardened = add.hardened || state.time - add.spawnedAt >= HARDENED_SECONDS
    const speed = add.speed * (hardened ? 1.5 : 1)
    const position = clampToVashnikArena(advanceEntityMotion(add.position, VASHNIK_ADD_LANES[add.family].destination, seconds, { speed, bounds: { halfWidth: 46, halfDepth: 46 } }))
    const npcDamage = add.assignedToPlayer ? 0 : seconds * (add.family === 'shadow' ? 11 : 8)
    const shieldDamage = Math.min(add.shield, npcDamage)
    const health = Math.max(0, add.health - Math.max(0, npcDamage - shieldDamage))
    const updated = { ...add, position, hardened, shield: add.shield - shieldDamage, health }
    if (add.health > 0 && health === 0) {
      additions.push(...splitBloodAdd(updated, state.time))
      if (add.family === 'shadow') newGround.push({ id: `umbral-${add.id}`, position, createdAt: state.time, expiresAt: state.time + 2.2, radius: 3, kind: 'umbral' })
    }
    if (health > 0 && distance(position, { x: 0, z: 0 }) <= CAVITY_RADIUS) next = addFailure(next, `add-leak-${add.id}`, `${add.family} Living Venom reached the Malignant Cavity`, 'Kill or control every Living Venom before it reaches the centre.', true)
    return updated
  })
  return { ...next, adds: [...adds, ...additions], groundEffects: [...next.groundEffects, ...newGround].filter(effect => effect.expiresAt > state.time) }
}

function expireState(state: VashnikState): VashnikState {
  const infusionApplications = {
    blood: activeApplications(state.infusionApplications.blood, state.time),
    flame: activeApplications(state.infusionApplications.flame, state.time),
    shadow: activeApplications(state.infusionApplications.shadow, state.time),
  }
  const fangsApplications = Object.fromEntries(Object.entries(state.fangsApplications).filter(([, expiresAt]) => expiresAt > state.time))
  return { ...state, infusionApplications, fangsApplications, groundEffects: state.groundEffects.filter(effect => effect.expiresAt > state.time) }
}

function stepVashnik(state: VashnikState, commands: PlayerCommandState, seconds: number, projection: EncounterProjection): VashnikState {
  if (state.outcome !== 'active') return state
  const timing = vashnikTiming(projection)
  const player = clampToVashnikArena(projection === 'learn2d'
    ? stepScreenRelativeWorldMovement(state.player, commands, seconds, { halfWidth: 48, halfDepth: 48 }, 5 / 3, 7, { width: 96, depth: 96 })
    : stepPlayerMovement(state.player, commands, seconds, { halfWidth: 48, halfDepth: 48 }))
  const time = state.time + seconds
  let next: VashnikState = expireState({ ...state, time, timeline: advanceEncounterTimeline(state.timeline, seconds), projection, player })
  const expectedPair = PAIR_ORDER[(next.cycle - 1) % PAIR_ORDER.length]
  const selected = contractSelectedMember(next.selectedSlotId)
  const playerOwnsBoss = selected.role === 'tank' && next.aggroOwner === next.selectedSlotId
  const bossTarget = playerOwnsBoss ? { x: next.player.x, z: next.player.z - 4 } : PAIR_POSITIONS[expectedPair]
  next = { ...next, boss: advanceEntityMotion(next.boss, bossTarget, seconds, { speed: 5.5, bounds: { halfWidth: 42, halfDepth: 42 } }) }
  const cycleAge = next.time - next.cycleStartedAt
  next = { ...next, bossEnergy: Math.min(100, cycleAge / timing.imbibeAt * 100), bossHealth: Math.max(0, 100 - ((next.cycle - 1) + Math.min(1, cycleAge / timing.cycleSeconds)) / 3 * 100) }
  next = resolveMain(next, seconds)
  if (next.imbibedCycle < next.cycle && cycleAge >= timing.imbibeAt) next = beginImbibe(next)
  if (next.infectionCycle < next.cycle && cycleAge >= timing.infectionAt) next = beginInfection(next, timing)
  next = stepInfection(next)
  if (next.bileCycle < next.cycle && cycleAge >= timing.bileAt) next = beginBile(next)
  next = resolveBile(next, timing.bileDuration)
  if (next.frothCycle < next.cycle && cycleAge >= timing.frothAt) next = beginFroth(next)
  next = resolveFroth(next, timing.frothDuration)
  next = stepFangs(next, timing)
  next = stepAdds(next, seconds)
  if (cycleAge >= timing.cycleSeconds && next.outcome === 'active') {
    if (next.cycle >= 3) return { ...next, outcome: 'success', bossHealth: 0 }
    return { ...next, cycle: next.cycle + 1, cycleStartedAt: next.time, activePair: undefined, bossEnergy: 0, infection: undefined, bilePositions: [], bileStartedAt: undefined, frothStartedAt: undefined, wavesStartedAt: undefined, tumors: [] }
  }
  return next
}

export function stepVashnikState(state: VashnikState, commands: PlayerCommandState, seconds: number): VashnikState {
  return stepVashnik(state, commands, seconds, 'train3d')
}

export function stepVashnikDiagramState(state: VashnikState, commands: PlayerCommandState, seconds: number): VashnikState {
  return stepVashnik(state, commands, seconds, 'learn2d')
}

export function activeVashnikPrompt(state: VashnikState) {
  const timing = vashnikTiming(state.projection)
  const age = state.time - state.cycleStartedAt
  const expected = PAIR_ORDER[(state.cycle - 1) % PAIR_ORDER.length]
  if (state.infection) {
    if (state.infection.kind === 'exploding') return 'Exploding Infection — take an outer lane'
    if (state.infection.kind === 'stygian') return 'Stygian Infection — keep moving'
    return `Siphoning Infection — join ${contractRaidRoster.findIndex(member => member.id === state.selectedSlotId) % 2 === 0 ? 'camp A' : 'camp B'}`
  }
  if (state.bileStartedAt !== undefined && !state.bileResolved) return 'Catalytic Bile — cover your highlighted circle'
  if (state.frothStartedAt !== undefined && state.wavesStartedAt === undefined) return 'Plague Froth — align a cardinal wave through your Tumor'
  if (state.fangsStartedAt !== undefined) return 'Dripping Fangs — prepare the tank swap'
  if (age < timing.imbibeAt) return `Position for ${expected}`
  if (state.adds.some(add => add.assignedToPlayer && add.health > 0)) return 'Main the marked priority add before it reaches the cavity'
  return `Cycle ${state.cycle} · ${state.activePair ?? expected}`
}

export function nextVashnikTimer(state: VashnikState) {
  const timing = vashnikTiming(state.projection)
  const age = state.time - state.cycleStartedAt
  if (state.infection) return { label: `${state.infection.kind} infection`, seconds: state.infection.expiresAt - state.time }
  if (state.bileStartedAt !== undefined && !state.bileResolved) return { label: 'Bile impact', seconds: timing.bileDuration - (state.time - state.bileStartedAt) }
  if (state.frothStartedAt !== undefined && state.wavesStartedAt === undefined) return { label: 'Plague Waves', seconds: timing.frothDuration - (state.time - state.frothStartedAt) }
  if (age < timing.imbibeAt) return { label: 'Imbibe', seconds: timing.imbibeAt - age }
  if (age < timing.infectionAt) return { label: 'Adaptive Infection', seconds: timing.infectionAt - age }
  if (age < timing.bileAt) return { label: 'Malignant Catalyst', seconds: timing.bileAt - age }
  if (age < timing.frothAt) return { label: 'Plague Froth', seconds: timing.frothAt - age }
  return { label: 'Next fountain pair', seconds: timing.cycleSeconds - age }
}

function infectionAuras(state: VashnikState, actorId: string) {
  if (!state.infection || state.infection.targetId !== actorId) return []
  return [{ id: `${state.infection.kind}-infection`, label: `${state.infection.kind[0].toUpperCase()}${state.infection.kind.slice(1)} Infection`, tone: state.infection.kind === 'stygian' ? 'spectral' as const : 'danger' as const, stacks: 1, expiresAt: state.infection.expiresAt }]
}

export function vashnikSnapshot(state: VashnikState): Train3DSnapshot {
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).map(member => ({ id: member.id, kind: 'ally', role: member.role, playerClass: member.playerClass, position: state.npcPositions[member.id], facing: Math.atan2(state.boss.x - state.npcPositions[member.id].x, state.npcPositions[member.id].z - state.boss.z), color: trainingClassColors[member.playerClass], auras: infectionAuras(state, member.id), health: 100 }))
  const addActors: ActorSnapshot[] = state.adds.filter(add => add.health > 0).map(add => ({ id: add.id, kind: 'enemy', position: add.position, facing: Math.atan2(-add.position.x, add.position.z), color: add.family === 'flame' ? '#ef7b42' : add.family === 'shadow' ? '#856fd1' : '#c34e60', auras: [...(add.assignedToPlayer ? [{ id: 'your-priority', label: 'Your priority', tone: 'danger' as const, stacks: 1 }] : []), ...(add.shield > 0 ? [{ id: 'miasmic-coating', label: 'Miasmic Coating', tone: 'spectral' as const, stacks: Math.ceil(add.shield / 25) }] : []), ...(add.hardened ? [{ id: 'hardened-venom', label: 'Hardened', tone: 'danger' as const, stacks: 1 }] : [])], health: add.health }))
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', role: controlled.role, playerClass: controlled.playerClass, position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], auras: infectionAuras(state, state.selectedSlotId), health: 100 },
    { id: 'vashnik-boss', kind: 'boss', position: state.boss, facing: 0, color: '#67c779', auras: state.activePair ? fountainsForPair(state.activePair).map(fountain => ({ id: `${fountain}-infusion`, label: `${fountain} Infusion`, tone: fountain === 'shadow' ? 'spectral' as const : fountain === 'blood' ? 'danger' as const : 'poison' as const, stacks: state.infusionApplications[fountain].length })) : [], health: state.bossHealth },
    ...npcActors,
    ...addActors,
  ]
  const effects: EffectSnapshot[] = [
    { id: 'malignant-cavity', label: 'Green Malignant Cavity — avoid the center and kill every add before it reaches this zone.', intent: 'avoid', kind: 'ground-harmful', position: { x: 0, z: 0 }, radius: CAVITY_RADIUS, color: '#3a9b55', progress: (state.time % 2) / 2, filled: true },
    ...Object.entries(FOUNTAINS).map(([id, position]) => ({ id: `${id}-fountain`, label: `${id[0].toUpperCase()}${id.slice(1)} Fountain — ${id} adds spawn at this edge ring and follow its lane to the cavity.`, intent: 'objective' as const, kind: 'ground-objective' as const, position, radius: 4.5, color: id === 'flame' ? '#ef7b42' : id === 'shadow' ? '#856fd1' : '#c34e60', progress: 0, filled: state.activePair ? fountainsForPair(state.activePair).includes(id as Fountain) : false })),
    ...Object.entries(VASHNIK_ADD_LANES).map(([id, lane]) => ({ id: `${id}-add-lane`, label: `${id[0].toUpperCase()}${id.slice(1)} add path — adds travel from the fountain to the cavity.`, intent: 'path' as const, kind: 'lane' as const, position: lane.origin, target: lane.destination, radius: .7, color: id === 'flame' ? '#ef7b42' : id === 'shadow' ? '#856fd1' : '#c34e60', progress: 0, filled: false })),
  ]
  if (state.infection) {
    const color = INFECTION_COLORS[state.infection.kind]
    const radius = state.infection.kind === 'siphoning' ? 10 : 6
    effects.push({ id: `${state.infection.kind}-infection-zone`, label: state.infection.kind === 'siphoning' ? 'Rose Siphoning circle — stack in the assigned support camp.' : state.infection.kind === 'stygian' ? 'Purple Stygian circle — keep moving and leave bursts behind.' : 'Orange Exploding circle — move alone to an outer lane.', intent: state.infection.kind === 'siphoning' ? 'soak' : 'avoid', kind: state.infection.kind === 'siphoning' ? 'ground-soak' : 'ground-spread', ownerId: 'controlled-player', position: state.player, radius, color, progress: 1 - (state.infection.expiresAt - state.time) / (state.infection.expiresAt - state.infection.startedAt), filled: true })
    if (state.infection.kind === 'siphoning') effects.push({ id: 'siphon-camp-arrow', kind: 'arrow', position: state.player, target: infectionCamp(state), radius: 1, color: '#ffd87a', progress: 0 })
  }
  state.groundEffects.forEach(effect => effects.push({ id: effect.id, label: 'Purple residual burst — move out.', intent: 'avoid', kind: 'ground-harmful', position: effect.position, radius: effect.radius, color: effect.kind === 'stygian' ? '#856fd1' : '#7b5dc1', progress: Math.min(1, (state.time - effect.createdAt) / Math.max(.1, effect.expiresAt - effect.createdAt)), filled: true }))
  state.bilePositions.forEach((position, index) => effects.push({ id: `bile-${state.cycle}-${index}`, label: index === 0 ? 'Highlighted green Bile circle — stand inside it before impact.' : 'Green Bile circle — at least one raid member must cover it.', intent: 'soak', kind: 'ground-soak', position, radius: BILE_RADIUS, color: '#8ae86e', progress: state.bileStartedAt === undefined ? 0 : Math.min(1, (state.time - state.bileStartedAt) / vashnikTiming(state.projection).bileDuration), filled: index === 0 ? distance(state.player, position) > BILE_RADIUS : false }))
  if (state.bilePositions[0]) effects.push({ id: 'bile-player-arrow', kind: 'arrow', position: state.player, target: state.bilePositions[0], radius: 1, color: '#ffd87a', progress: 0 })
  state.tumors.filter(tumor => !tumor.resolved).forEach(tumor => effects.push({ id: tumor.id, label: tumor.id.endsWith('player') ? 'Pale Tumor target — align one cardinal Plague Wave through it.' : 'Green Tumor target — another raid member resolves it.', intent: 'objective', kind: 'ground-objective', position: tumor.position, radius: 2.2, color: tumor.id.endsWith('player') ? '#efffb3' : '#5ecb75', progress: 0, filled: false }))
  if (state.frothStartedAt !== undefined && state.wavesStartedAt === undefined) {
    effects.push({ id: 'player-plague-froth', label: 'Green Plague Froth circle — spread and align a cardinal wave through your Tumor.', intent: 'avoid', kind: 'ground-spread', ownerId: 'controlled-player', position: state.player, radius: FROTH_RADIUS, color: '#9cdb54', progress: Math.min(1, (state.time - state.frothStartedAt) / vashnikTiming(state.projection).frothDuration), filled: true })
    const target = state.tumors.find(tumor => tumor.id.endsWith('player') && !tumor.resolved)
    if (target && (state.trainingDifficulty === 'test' || state.trainingDifficulty === 'easy')) effects.push({ id: 'tumor-alignment-arrow', kind: 'arrow', position: state.player, target: target.position, radius: 1, color: '#ffd87a', progress: 0 })
  }
  if (state.wavesStartedAt !== undefined && state.time - state.wavesStartedAt < 1.2) {
    const extent = ROOM_RADIUS * Math.min(1, (state.time - state.wavesStartedAt) / 1.2)
    for (const [id, target] of [['north', { x: state.player.x, z: state.player.z - extent }], ['south', { x: state.player.x, z: state.player.z + extent }], ['west', { x: state.player.x - extent, z: state.player.z }], ['east', { x: state.player.x + extent, z: state.player.z }]] as const) effects.push({ id: `plague-wave-${id}`, kind: 'lane', position: state.player, target, radius: WAVE_HALF_WIDTH * 2, color: '#9cdb54', progress: 1, filled: true })
  }
  const ambient = cosmeticClassProjectiles(npcActors, state.adds.some(add => add.health > 0) ? (_actor, index) => addActors[index % Math.max(1, addActors.length)]?.position ?? state.boss : state.boss, state.time)
  const main = state.mainProjectileFiredAt !== undefined && state.mainProjectileOrigin && state.mainProjectileTarget ? classProjectileEffects('player-main', state.mainProjectileOrigin, state.mainProjectileTarget, controlled.playerClass, state.time - state.mainProjectileFiredAt, state.mainProjectileOrdinal, 1.1) : []
  return { time: state.time, timeline: state.timeline, arena: vashnikArena, actors, effects: [...effects, ...ambient, ...main] }
}

export const VASHNIK_TIMING = { projections: { learn2d: vashnikTiming('learn2d'), train3d: vashnikTiming('train3d') }, cavityRadius: CAVITY_RADIUS, frothRadius: FROTH_RADIUS, bileRadius: BILE_RADIUS }
