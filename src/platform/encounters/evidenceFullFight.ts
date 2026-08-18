import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors } from '../contractRoom'
import type { RuntimeFailure } from '../RuntimeFeedback'
import { shouldEndTrainingAttempt, type CombatAction, type TrainingDifficulty } from '../trainingSettings'
import { stepScreenRelativeWorldMovement } from '../learn2d/worldMovement'
import { stepPlayerMovement } from '../train3d/simulation'
import { GROUNDED_VERTICAL_MOTION, launchVerticalMotion, stepVerticalMotion, type VerticalMotionState } from '../train3d/verticalMovement'
import type { ActorSnapshot, EffectSnapshot, PlayerCommandState, Train3DSnapshot, WorldPoint } from '../train3d/types'
import { advanceEncounterTimeline, beginEncounterAction, coreEncounterEntities, createEncounterTimeline, type EncounterTimelineState } from './timeline'
import type { EncounterActionDefinition, EncounterPackageV1, SourceProvenance, WorldArena3D } from '.'
import type { EncounterProjection } from './mechanicState'

export type EvidenceArenaKind = 'circle' | 'triangle-ring' | 'rectangle'
export type EvidenceStepIntent = 'enter' | 'avoid' | 'airborne' | 'action'

export interface EvidenceMechanicStep {
  id: string
  label: string
  prompt: string
  advice: string
  duration2d: number
  duration3d: number
  position: WorldPoint
  radius: number
  intent: EvidenceStepIntent
  color: string
  requiredAction?: CombatAction
  resourceDelta?: number
  failureResourceDelta?: number
  launchVelocity?: number
}

export interface EvidenceEncounterDefinition {
  id: string
  name: string
  order: number
  summary: string
  sourceAsOf: string
  sourceNote: string
  arenaKind: EvidenceArenaKind
  arena2dId: string
  arena2dLabel: string
  arena3d: WorldArena3D
  learn2dBackground?: string
  boardClass: string
  start: WorldPoint
  bosses: readonly { id: string; name: string; position: WorldPoint; color: string }[]
  steps: readonly EvidenceMechanicStep[]
  stepOrderVariants?: readonly (readonly string[])[]
  phaseNames: readonly string[]
  resource: { label: string; initial: number; maximum: number; lethal: number }
  tacticFields: readonly { id: string; label: string; kind: 'group' | 'pair' | 'region' | 'action-owner'; value: string | readonly string[] }[]
}

export interface EvidenceEncounterState {
  time: number
  stepIndex: number
  stepOrder: readonly number[]
  sequenceSeed: number
  stepStartedAt: number
  projection: EncounterProjection
  trainingDifficulty: TrainingDifficulty
  selectedSlotId: string
  player: { x: number; z: number; facing: number }
  vertical: VerticalMotionState
  resource: number
  actionResolved: boolean
  outcome: 'active' | 'success' | 'wipe'
  outcomeReason?: string
  failures: readonly RuntimeFailure[]
  timeline: EncounterTimelineState
}

const insideTriangle = (point: WorldPoint, scale = 1) => {
  const a = { x: 0, z: -44 * scale }; const b = { x: 40 * scale, z: 30 * scale }; const c = { x: -40 * scale, z: 30 * scale }
  const sign = (p1: WorldPoint, p2: WorldPoint, p3: WorldPoint) => (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z)
  const d1 = sign(point, a, b); const d2 = sign(point, b, c); const d3 = sign(point, c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

function clampPlayer(definition: EvidenceEncounterDefinition, previous: EvidenceEncounterState['player'], next: EvidenceEncounterState['player']) {
  if (definition.arenaKind === 'circle') {
    const length = Math.hypot(next.x, next.z); const radius = definition.arena3d.width / 2 - 2
    return length <= radius ? next : { ...next, x: next.x / length * radius, z: next.z / length * radius }
  }
  if (definition.arenaKind === 'triangle-ring') return insideTriangle(next, .96) && !insideTriangle(next, .34) ? next : previous
  return {
    ...next,
    x: Math.max(-definition.arena3d.width / 2 + 2, Math.min(definition.arena3d.width / 2 - 2, next.x)),
    z: Math.max(-definition.arena3d.depth / 2 + 2, Math.min(definition.arena3d.depth / 2 - 2, next.z)),
  }
}

const npcPosition = (index: number): WorldPoint => {
  const angle = index / contractRaidRoster.length * Math.PI * 2
  return { x: Math.cos(angle) * (index % 3 === 0 ? 18 : 24), z: Math.sin(angle) * (index % 3 === 0 ? 18 : 24) }
}

function evidenceStepOrder(definition: EvidenceEncounterDefinition, sequenceSeed: number) {
  if (!definition.stepOrderVariants?.length) return definition.steps.map((_step, index) => index)
  const variant = definition.stepOrderVariants[Math.abs(sequenceSeed) % definition.stepOrderVariants.length]
  const indices = variant.map(id => definition.steps.findIndex(step => step.id === id))
  if (indices.length !== definition.steps.length || indices.some(index => index < 0) || new Set(indices).size !== definition.steps.length) throw new Error(`${definition.name} step-order variant must contain every mechanic exactly once`)
  return indices
}

export function createEvidenceEncounterState(definition: EvidenceEncounterDefinition, selectedSlotId = 'player', trainingDifficulty: TrainingDifficulty = 'normal', projection: EncounterProjection = 'train3d', sequenceSeed = 0): EvidenceEncounterState {
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== selectedSlotId).map(member => member.id), definition.bosses.map(boss => boss.id), definition.arena3d.id))
  return { time: 0, stepIndex: 0, stepOrder: evidenceStepOrder(definition, sequenceSeed), sequenceSeed, stepStartedAt: 0, projection, trainingDifficulty, selectedSlotId, player: { ...definition.start, facing: 0 }, vertical: { ...GROUNDED_VERTICAL_MOTION }, resource: definition.resource.initial, actionResolved: false, outcome: 'active', failures: [], timeline }
}

export function prepareEvidenceEncounterSlot(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState, selectedSlotId: string) {
  return createEvidenceEncounterState(definition, selectedSlotId, state.trainingDifficulty, state.projection, state.sequenceSeed)
}

export function turnEvidenceEncounterPlayer(state: EvidenceEncounterState, yawDelta: number): EvidenceEncounterState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export const evidenceStep = (definition: EvidenceEncounterDefinition, state: EvidenceEncounterState) => definition.steps[state.stepOrder[Math.min(state.stepIndex, definition.steps.length - 1)]]
export const evidenceStepDuration = (definition: EvidenceEncounterDefinition, state: EvidenceEncounterState) => state.projection === 'learn2d' ? evidenceStep(definition, state).duration2d : evidenceStep(definition, state).duration3d
export const evidenceStepRemaining = (definition: EvidenceEncounterDefinition, state: EvidenceEncounterState) => evidenceStepDuration(definition, state) - (state.time - state.stepStartedAt)

export function resolveEvidenceEncounterAction(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState, action: CombatAction): EvidenceEncounterState {
  if (state.outcome !== 'active') return state
  const step = evidenceStep(definition, state)
  if (step.requiredAction !== action) return state
  return { ...state, actionResolved: true, timeline: beginEncounterAction(state.timeline, { id: 'controlled-player', kind: 'controlled-player' }, action, 0, definition.bosses[0].id) }
}

function resolveStep(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState): EvidenceEncounterState {
  const step = evidenceStep(definition, state)
  const distance = Math.hypot(state.player.x - step.position.x, state.player.z - step.position.z)
  const success = step.intent === 'enter' ? distance <= step.radius : step.intent === 'avoid' ? distance > step.radius : step.intent === 'airborne' ? state.vertical.height >= 1.2 : state.actionResolved
  const resource = Math.max(0, state.resource + (step.resourceDelta ?? 0) + (success ? 0 : step.failureResourceDelta ?? 0))
  let next = state
  if (!success) {
    const failure = { id: `${definition.id}-${step.id}-${state.time.toFixed(2)}`, code: step.id, time: state.time, label: `${step.label} failed`, advice: step.advice } satisfies RuntimeFailure
    const failures = [failure, ...state.failures].slice(0, 5)
    const terminal = resource >= definition.resource.lethal || shouldEndTrainingAttempt(state.trainingDifficulty, failures.length, false)
    next = { ...state, resource, failures, outcome: terminal ? 'wipe' : 'active', outcomeReason: terminal ? failure.label : undefined }
  } else if (resource >= definition.resource.lethal) {
    const failure = { id: `${definition.id}-resource-lethal-${state.time.toFixed(2)}`, code: 'resource-lethal', time: state.time, label: `${definition.resource.label} reached a lethal level`, advice: `Keep ${definition.resource.label.toLowerCase()} below ${definition.resource.lethal}.` } satisfies RuntimeFailure
    next = { ...state, resource, failures: [failure, ...state.failures].slice(0, 5), outcome: 'wipe', outcomeReason: failure.label }
  } else next = { ...state, resource }
  if (step.launchVelocity) next = { ...next, vertical: launchVerticalMotion(next.vertical, step.launchVelocity) }
  if (next.outcome !== 'active') return next
  if (state.stepIndex >= definition.steps.length - 1) return { ...next, outcome: 'success', stepIndex: definition.steps.length - 1 }
  return { ...next, stepIndex: state.stepIndex + 1, stepStartedAt: state.time, actionResolved: false }
}

export function stepEvidenceEncounter(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState, commands: PlayerCommandState, seconds: number, projection: EncounterProjection): EvidenceEncounterState {
  if (state.outcome !== 'active') return state
  const bounds = { halfWidth: definition.arena3d.width / 2, halfDepth: definition.arena3d.depth / 2 }
  const moved = projection === 'learn2d'
    ? stepScreenRelativeWorldMovement(state.player, commands, seconds, bounds, definition.arena3d.width / definition.arena3d.depth, 8, { width: definition.arena3d.width, depth: definition.arena3d.depth })
    : stepPlayerMovement(state.player, commands, seconds, bounds)
  const player = clampPlayer(definition, state.player, moved)
  const vertical = projection === 'train3d' ? stepVerticalMotion(state.vertical, commands.jump, seconds) : state.vertical
  const time = state.time + seconds
  const timed = { ...state, time, projection, player, vertical, timeline: advanceEncounterTimeline(state.timeline, seconds) }
  return time - state.stepStartedAt >= evidenceStepDuration(definition, state) ? resolveStep(definition, timed) : timed
}

export function evidenceEncounterSnapshot(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState): Train3DSnapshot {
  const roster = contractRosterForSlot(state.selectedSlotId); const controlled = contractSelectedMember(state.selectedSlotId)
  const progress = Math.min(1, (state.stepIndex + Math.max(0, state.time - state.stepStartedAt) / evidenceStepDuration(definition, state)) / definition.steps.length)
  const step = evidenceStep(definition, state)
  const npcActors: ActorSnapshot[] = roster.filter(member => !member.controlled).map((member, index) => ({ id: member.id, kind: 'ally', role: member.role, playerClass: member.playerClass, position: npcPosition(index), facing: 0, color: trainingClassColors[member.playerClass], auras: [], health: 100 }))
  const actors: ActorSnapshot[] = [
    { id: 'controlled-player', kind: 'player', role: controlled.role, playerClass: controlled.playerClass, position: state.player, elevation: state.vertical.height, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], auras: state.resource > 0 ? [{ id: 'encounter-resource', label: `${definition.resource.label} ${state.resource}`, tone: state.resource >= definition.resource.maximum - 1 ? 'danger' as const : 'poison' as const, stacks: state.resource }] : [], health: 100 },
    ...definition.bosses.map(boss => ({ id: boss.id, kind: 'boss' as const, position: boss.position, facing: 0, color: boss.color, auras: [], health: state.outcome === 'success' ? 0 : Math.max(1, 100 - progress * 96) })),
    ...npcActors,
  ]
  const kind = step.intent === 'enter' ? 'ground-soak' : step.intent === 'avoid' || step.intent === 'airborne' ? 'ground-harmful' : 'ground-objective'
  const effects: EffectSnapshot[] = [{ id: step.id, label: `${step.label} — ${step.prompt}`, intent: step.intent === 'enter' ? 'soak' : step.intent === 'avoid' || step.intent === 'airborne' ? 'avoid' : 'objective', kind, position: step.position, radius: step.radius, color: step.color, progress: Math.max(0, 1 - evidenceStepRemaining(definition, state) / evidenceStepDuration(definition, state)), filled: true }]
  return { time: state.time, timeline: state.timeline, arena: definition.arena3d, actors, effects, markers: [] }
}

const provenance = (definition: EvidenceEncounterDefinition): SourceProvenance => ({ kind: 'ptr-guide', confidence: 'medium', asOf: definition.sourceAsOf, note: definition.sourceNote })

export function createEvidenceEncounterPackage(definition: EvidenceEncounterDefinition, runtimeLoaders: EncounterPackageV1['runtimeLoaders']): EncounterPackageV1 {
  const requiredBindings = [...new Set(definition.steps.flatMap(step => step.requiredAction ? [step.requiredAction] : []))]
  const actions: EncounterActionDefinition[] = requiredBindings.map(binding => ({ id: `${definition.id}_${binding.toLowerCase()}`, binding, label: binding === 'interrupt' ? 'Interrupt' : binding === 'taunt' ? 'Taunt' : 'Main', kind: binding === 'interrupt' ? 'interrupt' : binding === 'taunt' ? 'taunt' : 'special', roles: binding === 'taunt' ? ['tank'] : ['tank', 'healer', 'melee', 'ranged'], modes: ['learn2d', 'train3d'], hud: true }))
  const abilities = definition.steps.map(step => ({ id: `${definition.id}_${step.id}`, name: step.label, description: step.prompt, severity: 'warning' as const, tags: [step.intent], timings: [{ key: 'window', seconds: step.duration3d, provenance: provenance(definition) }], provenance: provenance(definition) }))
  const roleKinds = ['tank', 'healer', 'melee', 'ranged'] as const
  const roleIds = roleKinds.map(role => `${definition.id}_${role}`)
  const actors = [...contractRaidRoster.map(member => ({ id: member.id, label: member.id.replaceAll('-', ' '), kind: 'player' as const, role: member.role, color: trainingClassColors[member.playerClass] })), ...definition.bosses.map(boss => ({ id: boss.id, label: boss.name, kind: 'boss' as const, color: boss.color }))]
  const placements = Object.fromEntries(actors.map((actor, index) => [actor.id, actor.kind === 'player' ? { x: 35 + index % 5 * 7, y: 58 + Math.floor(index / 5) * 5 } : { x: 35 + index % Math.max(1, definition.bosses.length) * 20, y: 35 }]))
  const tacticSchema = { version: 1, fields: definition.tacticFields.map(field => ({ id: field.id, label: field.label, kind: field.kind, required: true })), planner: { actors, maps: [{ id: `${definition.id}_full_plan`, label: 'Full fight', arenaId: definition.arena2dId, backgroundImage: definition.learn2dBackground, shape: 'rectangle' as const, actorIds: actors.map(actor => actor.id), placements }] } }
  const tacticId = `${definition.id}_default`; const timingId = `${definition.id}_pre_live`; const scenarioId = `${definition.id}_full_fight`; const phaseIds = definition.phaseNames.map((_name, index) => `${definition.id}_phase_${index + 1}`)
  return {
    apiVersion: 1,
    manifest: { id: definition.id, name: definition.name, raid: 'The Venomous Abyss', order: definition.order, contentSeason: 'Midnight Season 2', sourceConfidence: 'medium', availability: 'ptr-preview', supportedModes: ['learn2d', 'train3d'], defaults: [{ mode: 'learn2d', scenarioId, timingProfileId: timingId, tacticId }, { mode: 'train3d', scenarioId, timingProfileId: timingId, tacticId }], capabilities: ['full-fight', 'evidence-driven-sequence', 'simulation-owned-collision'], summary: definition.summary },
    actions,
    abilities,
    phases: definition.phaseNames.map((name, index) => ({ id: phaseIds[index], name, description: `${name} mechanics`, abilityIds: abilities.filter((_ability, abilityIndex) => Math.min(definition.phaseNames.length - 1, Math.floor(abilityIndex * definition.phaseNames.length / abilities.length)) === index).map(ability => ability.id) })),
    roles: roleIds.map((id, index) => ({ id, label: ['Tank', 'Healer', 'Melee', 'Ranged'][index], responsibilities: ['Resolve the controlled player assignment'], actionIds: actions.filter(action => action.roles.includes(roleKinds[index])).map(action => action.id) })),
    timingProfiles: [{ id: timingId, encounterId: definition.id, version: 1, status: 'ptr', values: definition.steps.map(step => ({ key: `${step.id}-window`, value: step.duration3d, unit: 'seconds', provenance: provenance(definition) })) }],
    tacticSchema,
    tactics: [{ id: tacticId, name: `${definition.name} default`, schemaVersion: 1, assignments: Object.fromEntries(definition.tacticFields.map(field => [field.id, field.value])), placements }],
    learn2d: [{ id: scenarioId, name: `${definition.name} full fight`, kind: 'full-fight', status: 'ready', mode: 'learn2d', arena: { id: definition.arena2dId, label: definition.arena2dLabel, regions: definition.steps.map(step => ({ id: step.id, label: step.label, x: (step.position.x + definition.arena3d.width / 2) / definition.arena3d.width * 100, y: (step.position.z + definition.arena3d.depth / 2) / definition.arena3d.depth * 100 })) }, steps: definition.steps.map(step => step.prompt), phaseIds, roleIds, timingProfileIds: [timingId], tacticIds: [tacticId], abilityIds: abilities.map(ability => ability.id) }],
    train3d: [{ id: scenarioId, name: `${definition.name} full fight`, kind: 'full-fight', status: 'ready', mode: 'train3d', arenaId: definition.arena3d.id, metricIds: ['mechanics-resolved', 'resource-control', 'positioning'], phaseIds, roleIds, timingProfileIds: [timingId], tacticIds: [tacticId], abilityIds: abilities.map(ability => ability.id) }],
    train3dArenas: [definition.arena3d],
    runtimeLoaders,
  }
}
