import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors } from '../../platform/contractRoom'
import type { RuntimeFailure } from '../../platform/RuntimeFeedback'
import { advanceEncounterTimeline, beginEncounterAction, coreEncounterEntities, createEncounterTimeline, type EncounterTimelineState } from '../../platform/encounters/timeline'
import type { EncounterProjection } from '../../platform/encounters/mechanicState'
import { stepScreenRelativeWorldMovement } from '../../platform/learn2d/worldMovement'
import { shouldEndTrainingAttempt, type TrainingDifficulty } from '../../platform/trainingSettings'
import { cosmeticClassProjectiles } from '../../platform/train3d/cosmeticCombat'
import { distance, stepPlayerMovement } from '../../platform/train3d/simulation'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../../platform/train3d/types'
import { GROUNDED_VERTICAL_MOTION, isAirborne, launchVerticalMotion, stepVerticalMotion, type VerticalMotionState } from '../../platform/train3d/verticalMovement'
import { lostTiming } from './timing/projections'
import { lostExplorersArena } from './train3d/arenas'

export type LostBoss = 'iku' | 'gebbo' | 'nama'
export type ElementKind = 'fire' | 'frost'
export type LostOutcome = 'active' | 'success' | 'wipe'
export interface LostCrate { id: string; position: WorldPoint; landedAt: number; opened: boolean; containsFish: boolean }
export interface LostPatch { id: string; kind: ElementKind; position: WorldPoint; radius: number }
export interface LostAftershock { id: string; position: WorldPoint; createdAt: number; expiresAt: number }
export interface LostBossState { position: WorldPoint; health: number }

export interface LostExplorersState {
  time: number
  timeline: EncounterTimelineState
  projection: EncounterProjection
  trainingDifficulty: TrainingDifficulty
  selectedSlotId: string
  player: { x: number; z: number; facing: number }
  vertical: VerticalMotionState
  npcPositions: Readonly<Record<string, WorldPoint>>
  bosses: Readonly<Record<LostBoss, LostBossState>>
  cycle: 1 | 2 | 3
  cycleStartedAt: number
  energy: number
  crates: readonly LostCrate[]
  fishHeld: boolean
  fedBosses: readonly LostBoss[]
  ultimateStartedAt?: number
  ikuCastStartedAt?: number
  ikuCastResolved: boolean
  frostfireMark?: ElementKind
  frostfireImpactPosition?: WorldPoint
  frostfirePatches: readonly LostPatch[]
  elementDebuff?: ElementKind
  elementCleansed: boolean
  mushroom?: WorldPoint
  mushroomTriggeredAt?: number
  bombMarkedAt?: number
  bombPosition?: WorldPoint
  bombDetonatedAt?: number
  waveChecked: boolean
  aftershocks: readonly LostAftershock[]
  thudIndex: number
  thudResolved: readonly number[]
  mistakes: number
  failures: readonly RuntimeFailure[]
  outcome: LostOutcome
  outcomeReason?: string
}

const BOSS_ORDER: readonly LostBoss[] = ['iku', 'gebbo', 'nama']
const THUD_POINTS: readonly WorldPoint[] = [{ x: -20, z: -13 }, { x: 0, z: 21 }, { x: 20, z: -13 }]
const OCTAGON_EDGE = 44
const OCTAGON_DIAGONAL = 62

export function clampToLostExplorersArena<T extends WorldPoint>(point: T): T {
  let x = Math.max(-OCTAGON_EDGE, Math.min(OCTAGON_EDGE, point.x))
  let z = Math.max(-OCTAGON_EDGE, Math.min(OCTAGON_EDGE, point.z))
  const diagonal = Math.abs(x) + Math.abs(z)
  if (diagonal > OCTAGON_DIAGONAL) { const scale = OCTAGON_DIAGONAL / diagonal; x *= scale; z *= scale }
  return { ...point, x, z }
}

function rosterPositions(slotId: string) {
  const roster = contractRosterForSlot(slotId)
  return Object.fromEntries(roster.filter(member => !member.controlled).map((member, index) => {
    const angle = index / Math.max(1, roster.length - 1) * Math.PI * 2
    const radius = member.role === 'melee' || member.role === 'tank' ? 10 : member.role === 'healer' ? 18 : 23
    return [member.id, { x: Math.cos(angle) * radius - 8, z: Math.sin(angle) * radius - 5 }]
  }))
}

function cratesForCycle(cycle: number, startedAt: number): readonly LostCrate[] {
  const positions = cycle === 1 ? [{ x: -17, z: 2 }, { x: 7, z: -20 }, { x: 23, z: 9 }]
    : cycle === 2 ? [{ x: 16, z: 4 }, { x: -8, z: 22 }, { x: -25, z: -8 }]
      : [{ x: 0, z: -23 }, { x: 23, z: 5 }, { x: -20, z: 14 }]
  return positions.map((position, index) => ({ id: `crate-${cycle}-${index}`, position, landedAt: startedAt + 3, opened: false, containsFish: index === (cycle - 1) % positions.length }))
}

function bossPositions(time: number): Readonly<Record<LostBoss, LostBossState>> {
  const angle = time * .075 + Math.PI * .85
  const gebbo = { x: Math.cos(angle) * 23, z: Math.sin(angle) * 23 }
  const iku = { x: gebbo.x + Math.cos(angle + Math.PI / 2) * 8, z: gebbo.z + Math.sin(angle + Math.PI / 2) * 8 }
  const nama = { x: Math.cos(angle + Math.PI) * 30, z: Math.sin(angle + Math.PI) * 30 }
  return { iku: { position: iku, health: 100 }, gebbo: { position: gebbo, health: 100 }, nama: { position: nama, health: 100 } }
}

export function createLostExplorersState(selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal', projection: EncounterProjection = 'train3d'): LostExplorersState {
  const selected = contractSelectedMember(selectedSlotId)
  const start = selected.role === 'tank' ? { x: -12, z: -8 } : { x: -8, z: 8 }
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== selectedSlotId).map(member => member.id), ['lost-iku', 'lost-gebbo', 'lost-nama'], lostExplorersArena.id))
  return {
    time: 0, timeline, projection, trainingDifficulty, selectedSlotId, player: { ...start, facing: 0 }, vertical: { ...GROUNDED_VERTICAL_MOTION }, npcPositions: rosterPositions(selectedSlotId), bosses: bossPositions(0),
    cycle: 1, cycleStartedAt: 0, energy: 0, crates: cratesForCycle(1, 0), fishHeld: false, fedBosses: [], ikuCastResolved: false,
    frostfirePatches: [], elementCleansed: false, waveChecked: false, aftershocks: [], thudIndex: 0, thudResolved: [], mistakes: 0, failures: [], outcome: 'active',
  }
}

export function prepareLostExplorersSlot(state: LostExplorersState, selectedSlotId: string) {
  return createLostExplorersState(selectedSlotId, state.trainingDifficulty, state.projection)
}

export function turnLostExplorersPlayer(state: LostExplorersState, yawDelta: number): LostExplorersState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

function addFailure(state: LostExplorersState, code: string, label: string, advice: string, encounterFailure = false): LostExplorersState {
  if (state.failures.some(failure => failure.code === code)) return state
  const mistakes = state.mistakes + 1
  const failure = { id: `${code}-${state.time.toFixed(3)}`, code, time: state.time, label, advice } satisfies RuntimeFailure
  const wipe = shouldEndTrainingAttempt(state.trainingDifficulty, mistakes, encounterFailure)
  return { ...state, mistakes, failures: [failure, ...state.failures].slice(0, 6), outcome: wipe ? 'wipe' : state.outcome, outcomeReason: wipe ? label : state.outcomeReason }
}

export function throwLostExplorersFish(state: LostExplorersState): LostExplorersState {
  if (!state.fishHeld || state.ultimateStartedAt !== undefined || state.outcome !== 'active') return state
  const target = BOSS_ORDER[state.cycle - 1]
  if (state.fedBosses.includes(target)) return addFailure(state, 'fish-target-ineligible', `${target} already received a fish`, 'Each explorer is fed once in Iku, Gebbo, Nama order.', true)
  return { ...state, fishHeld: false, fedBosses: [...state.fedBosses, target], ultimateStartedAt: state.time, energy: 0, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'throw-fish', .5, `lost-${target}`) }
}

export function interruptLostExplorersIku(state: LostExplorersState): LostExplorersState {
  if (state.ikuCastStartedAt === undefined || state.ikuCastResolved || state.time - state.ikuCastStartedAt > 4) return state
  return { ...state, ikuCastResolved: true, ikuCastStartedAt: undefined, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'interrupt', 0, 'lost-iku') }
}

export function tauntLostExplorers(state: LostExplorersState): LostExplorersState {
  return { ...state, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, 'taunt', 0, `lost-${state.cycle === 3 ? 'nama' : 'iku'}`) }
}

function beginNextCycle(state: LostExplorersState): LostExplorersState {
  if (state.cycle === 3) return { ...state, outcome: 'success', bosses: Object.fromEntries(BOSS_ORDER.map(id => [id, { ...state.bosses[id], health: 0 }])) as Readonly<Record<LostBoss, LostBossState>> }
  const cycle = (state.cycle + 1) as 2 | 3
  return { ...state, cycle, cycleStartedAt: state.time, energy: 0, crates: cratesForCycle(cycle, state.time), fishHeld: false, ultimateStartedAt: undefined, ikuCastStartedAt: undefined, ikuCastResolved: false, frostfireMark: undefined, frostfireImpactPosition: undefined, frostfirePatches: [], elementDebuff: undefined, elementCleansed: false, mushroom: undefined, mushroomTriggeredAt: undefined, bombMarkedAt: undefined, bombPosition: undefined, bombDetonatedAt: undefined, waveChecked: false, thudIndex: 0, thudResolved: [] }
}

function oppositePoint(position: WorldPoint, distanceFromCenter: number): WorldPoint {
  const length = Math.max(1, Math.hypot(position.x, position.z))
  return { x: -position.x / length * distanceFromCenter, z: -position.z / length * distanceFromCenter }
}

function resolveIkuUltimate(state: LostExplorersState, age: number): LostExplorersState {
  let next = state
  if (!next.frostfireMark) next = { ...next, frostfireMark: contractRaidRoster.findIndex(member => member.id === state.selectedSlotId) % 2 ? 'frost' : 'fire' }
  if (age >= 6 && !next.frostfireImpactPosition) {
    const mark = next.frostfireMark!
    const radius = Math.hypot(next.player.x, next.player.z)
    const valid = mark === 'fire' ? radius >= 30 : radius >= 15 && radius <= 29
    if (!valid) next = addFailure(next, 'frostfire-placement', `${mark} was placed in the wrong band`, mark === 'fire' ? 'Place Fire at the outer edge.' : 'Place Frost inside the Fire ring.')
    const own = { ...next.player }
    const oppositeKind: ElementKind = mark === 'fire' ? 'frost' : 'fire'
    next = { ...next, frostfireImpactPosition: own, elementDebuff: mark, frostfirePatches: [{ id: `own-${mark}`, kind: mark, position: own, radius: 5 }, { id: `cleanse-${oppositeKind}`, kind: oppositeKind, position: oppositePoint(own, mark === 'fire' ? 21 : 37), radius: 5 }] }
  }
  if (next.elementDebuff && !next.elementCleansed) {
    const target = next.frostfirePatches.find(patch => patch.kind !== next.elementDebuff)
    if (target && distance(next.player, target.position) <= target.radius) next = { ...next, elementDebuff: undefined, elementCleansed: true, frostfirePatches: next.frostfirePatches.filter(patch => patch.id !== target.id) }
  }
  if (age >= 16) {
    if (!next.elementCleansed) next = addFailure(next, 'element-uncleared', 'Frostfire debuff remained active', 'Enter the opposite-element patch after the impacts.', true)
    if (next.outcome === 'active') next = beginNextCycle(next)
  }
  return next
}

function resolveGebboUltimate(state: LostExplorersState, age: number): LostExplorersState {
  let next = state
  if (age >= 2 && !next.mushroom) next = { ...next, mushroom: { ...next.player } }
  if (age >= 5 && next.bombMarkedAt === undefined) next = { ...next, bombMarkedAt: next.time }
  if (age >= 10 && !next.bombPosition) {
    const bombPosition = { ...next.player }
    const mushroom = next.mushroom ?? { x: 0, z: 0 }
    const valid = Math.hypot(bombPosition.x, bombPosition.z) >= 34 && distance(bombPosition, mushroom) >= 42
    next = { ...next, bombPosition }
    if (!valid) next = addFailure(next, 'bomb-placement', 'Explosive Surprise was not placed at the opposite edge', 'Take the bomb to the outer edge opposite the preserved mushroom.')
  }
  if (age >= 12 && next.bombPosition && next.bombDetonatedAt === undefined) next = { ...next, bombDetonatedAt: next.time }
  if (next.mushroom && next.bombPosition && next.bombDetonatedAt !== undefined && next.mushroomTriggeredAt === undefined) {
    const waveRadius = (next.time - next.bombDetonatedAt) * 8
    const mushroomRadius = distance(next.bombPosition, next.mushroom)
    if (waveRadius >= mushroomRadius - 7 && distance(next.player, next.mushroom) <= 4) next = { ...next, mushroomTriggeredAt: next.time, vertical: launchVerticalMotion(next.vertical, 11.5) }
  }
  if (next.bombPosition && next.bombDetonatedAt !== undefined && !next.waveChecked) {
    const waveRadius = (next.time - next.bombDetonatedAt) * 8
    const playerRadius = distance(next.player, next.bombPosition)
    if (waveRadius >= playerRadius - 1.7) {
      const clear = isAirborne(next.vertical, 1.2) || (next.projection === 'learn2d' && next.mushroomTriggeredAt !== undefined)
      next = { ...next, waveChecked: true }
      if (!clear) next = addFailure(next, 'blast-wave-hit', 'Blast Wave hit while grounded', 'Trigger the mushroom as the wave approaches or jump with enough clearance.', true)
    }
  }
  if (age >= 23) {
    if (!next.waveChecked) next = addFailure(next, 'wave-not-crossed', 'Blast Wave crossing was not resolved', 'Return to the mushroom and cross the visible wave.', true)
    if (next.outcome === 'active') next = beginNextCycle(next)
  }
  return next
}

function resolveNamaUltimate(state: LostExplorersState, age: number): LostExplorersState {
  let next = state
  const targetIndex = Math.min(2, Math.floor(Math.max(0, age - 3) / 5))
  const resolutionAt = 7 + targetIndex * 5
  if (targetIndex >= next.thudIndex && age >= resolutionAt && !next.thudResolved.includes(targetIndex)) {
    const target = THUD_POINTS[targetIndex]
    const inside = distance(next.player, target) <= 6
    if (!inside) next = addFailure(next, `thud-${targetIndex}-empty`, `Mighty Thud group ${targetIndex + 1} resolved without you`, 'Move into the highlighted six-yard group before Nama lands.', true)
    const length = Math.max(1, Math.hypot(next.player.x, next.player.z))
    const knocked = clampToLostExplorersArena({ ...next.player, x: next.player.x + next.player.x / length * 7, z: next.player.z + next.player.z / length * 7 })
    next = { ...next, player: knocked, vertical: launchVerticalMotion(next.vertical, 5.4), thudIndex: targetIndex + 1, thudResolved: [...next.thudResolved, targetIndex], aftershocks: [...next.aftershocks, { id: `aftershock-${targetIndex}`, position: target, createdAt: next.time, expiresAt: next.time + 30 }] }
  }
  if (age >= 22 && next.thudResolved.length >= 3 && next.outcome === 'active') next = beginNextCycle(next)
  return next
}

function stepLostExplorers(state: LostExplorersState, commands: PlayerCommandState, seconds: number, projection: EncounterProjection): LostExplorersState {
  if (state.outcome !== 'active') return state
  const horizontal = projection === 'learn2d'
    ? stepScreenRelativeWorldMovement(state.player, commands, seconds, { halfWidth: 46, halfDepth: 46 }, 5 / 3, 7, { width: 96, depth: 96 })
    : stepPlayerMovement(state.player, commands, seconds, { halfWidth: 46, halfDepth: 46 })
  const player = clampToLostExplorersArena(horizontal)
  const vertical = projection === 'train3d' ? stepVerticalMotion(state.vertical, commands.jump, seconds) : state.vertical
  const time = state.time + seconds
  const timing = lostTiming(projection)
  const cycleAge = time - state.cycleStartedAt
  const progress = Math.min(1, cycleAge / timing.cycleSeconds)
  const positions = bossPositions(time)
  const bosses = Object.fromEntries(BOSS_ORDER.map((id, index) => [id, { position: positions[id].position, health: Math.max(0, 100 - (state.cycle - 1) * 30 - progress * (index === 1 ? 28 : 30)) }])) as Readonly<Record<LostBoss, LostBossState>>
  let next: LostExplorersState = { ...state, time, projection, player, vertical, bosses, timeline: advanceEncounterTimeline(state.timeline, seconds), aftershocks: state.aftershocks.filter(effect => effect.expiresAt > time) }
  if (cycleAge >= 4 && next.ikuCastStartedAt === undefined && !next.ikuCastResolved) next = { ...next, ikuCastStartedAt: time }
  if (next.ikuCastStartedAt !== undefined && !next.ikuCastResolved && time - next.ikuCastStartedAt >= 4) next = addFailure({ ...next, ikuCastResolved: true }, `icebound-${next.cycle}`, 'Icebound Flames was not interrupted', 'Use the assigned Interrupt during Iku’s four-second cast.')
  let pickedUpFish = false
  const crates = next.crates.map(crate => {
    if (crate.opened || time < crate.landedAt || distance(player, crate.position) > 3.2) return crate
    if (crate.containsFish) pickedUpFish = true
    return { ...crate, opened: true }
  })
  next = { ...next, crates, fishHeld: next.fishHeld || pickedUpFish }
  if (next.ultimateStartedAt === undefined) {
    next = { ...next, energy: Math.min(100, cycleAge / timing.energyDeadline * 100) }
    if (cycleAge >= timing.energyDeadline + 5) next = addFailure(next, `ascension-${next.cycle}`, 'Mor’zahi completed Final Ascension', 'Open the fish crate and throw the fish before full energy.', true)
    return next
  }
  const ultimateAge = time - next.ultimateStartedAt - timing.ultimateTransition
  if (ultimateAge < 0) return next
  if (next.cycle === 1) return resolveIkuUltimate(next, ultimateAge)
  if (next.cycle === 2) return resolveGebboUltimate(next, ultimateAge)
  return resolveNamaUltimate(next, ultimateAge)
}

export function stepLostExplorersState(state: LostExplorersState, commands: PlayerCommandState, seconds: number) { return stepLostExplorers(state, commands, seconds, 'train3d') }
export function stepLostExplorersDiagramState(state: LostExplorersState, commands: PlayerCommandState, seconds: number) { return stepLostExplorers(state, commands, seconds, 'learn2d') }

export function activeLostExplorersPrompt(state: LostExplorersState) {
  const target = BOSS_ORDER[state.cycle - 1]
  if (state.ultimateStartedAt === undefined) {
    if (state.ikuCastStartedAt !== undefined && !state.ikuCastResolved) return 'Interrupt Icebound Flames'
    if (state.fishHeld) return `Throw the fish to ${target[0].toUpperCase()}${target.slice(1)}`
    return 'Dodge and open the highlighted fish crate'
  }
  if (state.cycle === 1) return !state.frostfireImpactPosition ? `Place ${state.frostfireMark ?? 'your element'} in its ring` : state.elementCleansed ? 'Regroup after Frostfire' : 'Cleanse in the opposite-element patch'
  if (state.cycle === 2) return !state.bombPosition ? state.mushroom ? 'Preserve mushroom; take bomb to the opposite edge' : 'Stack to bait the mushroom' : state.waveChecked ? 'Clear the fire zone and regroup' : 'Return to the mushroom and cross Blast Wave airborne'
  return `Mighty Thud group ${Math.min(3, state.thudIndex + 1)} — enter the highlighted soak`
}

export function nextLostExplorersTimer(state: LostExplorersState) {
  const timing = lostTiming(state.projection)
  if (state.ultimateStartedAt === undefined) return { label: state.energy >= 100 ? 'Final Ascension' : 'Mor’zahi full energy', seconds: timing.energyDeadline - (state.time - state.cycleStartedAt) }
  const age = state.time - state.ultimateStartedAt - timing.ultimateTransition
  if (state.cycle === 1) return { label: state.frostfireImpactPosition ? 'Cleanse deadline' : 'Frostfire impact', seconds: (state.frostfireImpactPosition ? 16 : 6) - age }
  if (state.cycle === 2) return { label: state.bombPosition ? 'Blast Wave' : 'Bomb landing', seconds: (state.bombPosition ? 12 : 10) - age }
  return { label: `Thud ${Math.min(3, state.thudIndex + 1)}`, seconds: 7 + state.thudIndex * 5 - age }
}

export function lostExplorersSnapshot(state: LostExplorersState): Train3DSnapshot {
  const roster = contractRosterForSlot(state.selectedSlotId)
  const controlled = roster.find(member => member.controlled)!
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).map(member => ({ id: member.id, kind: 'ally', role: member.role, playerClass: member.playerClass, position: state.npcPositions[member.id], facing: 0, color: trainingClassColors[member.playerClass], auras: [], health: 100 }))
  const bossColors: Record<LostBoss, string> = { iku: '#71bde3', gebbo: '#d8a85d', nama: '#7bcf8e' }
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', role: controlled.role, playerClass: controlled.playerClass, position: state.player, elevation: state.vertical.height, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], auras: [...(state.fishHeld ? [{ id: 'disgusting-fish', label: 'Disgusting Fish', tone: 'beneficial' as const, stacks: 1 }] : []), ...(state.elementDebuff ? [{ id: state.elementDebuff, label: state.elementDebuff === 'fire' ? 'Burning Flames' : 'Piercing Frost', tone: state.elementDebuff === 'fire' ? 'danger' as const : 'spectral' as const, stacks: 1 }] : [])], health: 100 },
    ...BOSS_ORDER.map(id => ({ id: `lost-${id}`, kind: 'boss' as const, position: state.bosses[id].position, facing: 0, color: bossColors[id], auras: state.fedBosses.includes(id) ? [{ id: 'fish-used', label: 'Already fed', tone: 'poison' as const, stacks: 1 }] : [], health: state.bosses[id].health })),
    { id: 'lost-morzahi', kind: 'enemy', position: { x: 0, z: 0 }, facing: 0, color: '#9c78e8', auras: [{ id: 'energy', label: `Energy ${Math.round(state.energy)}`, tone: 'spectral', stacks: Math.ceil(state.energy / 10) }], health: 100 },
    ...npcActors,
  ]
  const effects: EffectSnapshot[] = [
    { id: 'morzahi-center', label: 'Mor’zahi — untargetable; recover fish before full energy.', intent: 'avoid', kind: 'ground-harmful', position: { x: 0, z: 0 }, radius: 4.5, color: '#815ab7', progress: state.energy / 100, filled: true },
    ...state.crates.filter(crate => !crate.opened).map(crate => ({ id: crate.id, label: crate.containsFish && state.time >= crate.landedAt ? 'Fish crate — enter after it lands to recover the Disgusting Fish.' : 'Junk crate — avoid the landing, then open deliberately.', intent: 'objective' as const, kind: 'ground-objective' as const, position: crate.position, radius: 3, color: crate.containsFish ? '#f0cf64' : '#aa8559', progress: Math.min(1, state.time / Math.max(.1, crate.landedAt)), filled: state.time < crate.landedAt })),
    ...state.frostfirePatches.map(patch => ({ id: patch.id, label: `${patch.kind === 'fire' ? 'Fire' : 'Frost'} patch — ${patch.kind === state.elementDebuff ? 'same element; avoid' : 'opposite element; enter to cleanse'}.`, intent: patch.kind === state.elementDebuff ? 'avoid' as const : 'objective' as const, kind: patch.kind === state.elementDebuff ? 'ground-harmful' as const : 'ground-objective' as const, position: patch.position, radius: patch.radius, color: patch.kind === 'fire' ? '#ef7645' : '#77c8ef', progress: 0, filled: true })),
    ...state.aftershocks.map(effect => ({ id: effect.id, label: 'Aftershock — harmful residue from Mighty Thud.', intent: 'avoid' as const, kind: 'ground-harmful' as const, position: effect.position, radius: 6, color: '#d89c58', progress: (state.time - effect.createdAt) / (effect.expiresAt - effect.createdAt), filled: true })),
  ]
  if (state.ultimateStartedAt !== undefined && state.cycle === 1 && !state.frostfireImpactPosition) effects.push({ id: 'player-frostfire', label: `${state.frostfireMark ?? 'Element'} placement — Fire outside, Frost inside.`, intent: 'avoid', kind: 'ground-spread', ownerId: 'controlled-player', position: state.player, radius: 10, color: state.frostfireMark === 'frost' ? '#77c8ef' : '#ef7645', progress: 0, filled: true })
  if (state.mushroom) effects.push({ id: 'bouncy-mushroom', label: state.mushroomTriggeredAt ? 'Perturbed mushroom — move away before Fungal Burst.' : 'Bouncy Mushroom — preserve until Blast Wave approaches.', intent: 'objective', kind: 'ground-objective', position: state.mushroom, radius: 4, color: '#9edb68', progress: 0, filled: state.mushroomTriggeredAt !== undefined })
  if (state.bombPosition) effects.push({ id: 'explosive-surprise', label: 'Bomb and Spreading Flames — move out.', intent: 'avoid', kind: 'ground-harmful', position: state.bombPosition, radius: 10, color: '#ef6c42', progress: 0, filled: true })
  if (state.bombPosition && state.bombDetonatedAt !== undefined && !state.waveChecked) effects.push({ id: 'blast-wave', label: 'Blast Wave — be airborne when the ring reaches you.', intent: 'avoid', kind: 'ground-harmful', position: state.bombPosition, radius: Math.max(1, (state.time - state.bombDetonatedAt) * 8), color: '#ff9a4d', progress: 0, filled: false })
  if (state.ultimateStartedAt !== undefined && state.cycle === 3 && state.thudIndex < 3) effects.push({ id: `thud-target-${state.thudIndex}`, label: `Mighty Thud group ${state.thudIndex + 1} — enter this six-yard split soak.`, intent: 'soak', kind: 'ground-soak', position: THUD_POINTS[state.thudIndex], radius: 6, color: '#e5bd6a', progress: 0, filled: false })
  return { time: state.time, timeline: state.timeline, arena: lostExplorersArena, actors, effects: [...effects, ...cosmeticClassProjectiles(npcActors, (_actor, index) => state.bosses[BOSS_ORDER[index % 3]].position, state.time)] }
}

export const LOST_EXPLORERS_TIMING = { bossOrder: BOSS_ORDER, thudPoints: THUD_POINTS, projections: { learn2d: lostTiming('learn2d'), train3d: lostTiming('train3d') } }
