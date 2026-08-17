import type { ComponentType } from 'react'
import type { CombatAction, MovementKeyBindings, TrainingCameraSettings, TrainingDifficulty, TrainingHudSettings } from '../trainingSettings'

export type EncounterMode = 'learn2d' | 'train3d'
export type EncounterAvailability = 'research' | 'ptr-preview' | 'live-validated' | 'retired'
export type ScenarioKind = 'focused' | 'full-fight'
export type ScenarioStatus = 'planned' | 'ready'
export type SourceKind = 'journal' | 'ptr-guide' | 'ptr-video' | 'live-log' | 'hotfix' | 'local-tactic'
export type Confidence = 'high' | 'medium' | 'low'
export type EncounterPlayerRole = 'tank' | 'healer' | 'melee' | 'ranged'

export interface SourceProvenance {
  kind: SourceKind
  confidence: Confidence
  asOf: string
  note: string
}

export interface EncounterDefaultSelection {
  mode: EncounterMode
  scenarioId: string
  timingProfileId: string
  tacticId: string
}

export interface EncounterManifest {
  id: string
  name: string
  raid: string
  order: number
  contentSeason: string
  sourceConfidence: Confidence
  availability: EncounterAvailability
  supportedModes: readonly EncounterMode[]
  defaults: readonly EncounterDefaultSelection[]
  capabilities: readonly string[]
  summary: string
}

export interface AbilityTiming {
  key: string
  seconds: number
  provenance: SourceProvenance
}

export interface AbilityDefinition {
  id: string
  name: string
  description: string
  severity: 'informational' | 'warning' | 'lethal'
  tags: readonly string[]
  timings: readonly AbilityTiming[]
  provenance: SourceProvenance
}

export interface PhaseDefinition {
  id: string
  name: string
  description: string
  abilityIds: readonly string[]
}

export interface EncounterActionDefinition {
  id: string
  binding: CombatAction
  label: string
  kind: 'interrupt' | 'taunt' | 'swap' | 'claim' | 'soak' | 'dispel' | 'special'
  roles: readonly EncounterPlayerRole[]
  modes: readonly EncounterMode[]
  hud: boolean
  cooldown?: number
}

export interface BoundEncounterAction extends EncounterActionDefinition {
  keyCode: string
}

export interface RoleDefinition {
  id: string
  label: string
  responsibilities: readonly string[]
  actionIds: readonly string[]
}

export interface TimingValue {
  key: string
  value: number
  unit: 'seconds' | 'energy' | 'yards'
  provenance: SourceProvenance
}

export interface TimingProfile {
  id: string
  encounterId: string
  version: number
  status: 'ptr' | 'live' | 'superseded'
  values: readonly TimingValue[]
}

export interface TacticFieldDefinition {
  id: string
  label: string
  kind: 'player' | 'group' | 'pair' | 'region' | 'action-owner'
  required: boolean
}

export interface PlannerActorDefinition {
  id: string
  label: string
  kind: 'player' | 'boss' | 'add'
  role?: EncounterPlayerRole
  color: string
}

export interface PlannerMapDefinition {
  id: string
  label: string
  arenaId: string
  backgroundImage?: string
  shape?: 'rectangle' | 'circle'
  actorIds: readonly string[]
  placements: Readonly<Record<string, { x: number; y: number }>>
}

export interface TacticPlannerDefinition {
  actors: readonly PlannerActorDefinition[]
  maps: readonly PlannerMapDefinition[]
}

export interface TacticSchema {
  version: number
  fields: readonly TacticFieldDefinition[]
  planner?: TacticPlannerDefinition
}

export interface TacticPreset {
  id: string
  name: string
  schemaVersion: number
  assignments: Readonly<Record<string, string | readonly string[]>>
  placements?: Readonly<Record<string, { x: number; y: number }>>
}

export interface DiagramRegion2D {
  id: string
  label: string
  x: number
  y: number
}

export interface DiagramArena2D {
  id: string
  label: string
  regions: readonly DiagramRegion2D[]
}

export interface WorldAnchor3D {
  id: string
  label: string
  x: number
  z: number
}

export interface WorldArena3D {
  id: string
  label: string
  shape: 'rectangle' | 'circle'
  width: number
  depth: number
  anchors: readonly WorldAnchor3D[]
  theme: Readonly<Record<string, string>>
}

interface ScenarioBase {
  id: string
  name: string
  kind: ScenarioKind
  status: ScenarioStatus
  abilityIds: readonly string[]
  phaseIds: readonly string[]
  roleIds: readonly string[]
  timingProfileIds: readonly string[]
  tacticIds: readonly string[]
}

export interface Learn2DScenario extends ScenarioBase {
  mode: 'learn2d'
  arena: DiagramArena2D
  steps: readonly string[]
}

export interface Train3DScenario extends ScenarioBase {
  mode: 'train3d'
  arenaId: string
  metricIds: readonly string[]
}

export interface EncounterRuntimeProps {
  scenarioId: string
  trainingDifficulty: TrainingDifficulty
  keyBindings: MovementKeyBindings
  actions: readonly BoundEncounterAction[]
  hudSettings: TrainingHudSettings
  cameraSettings: TrainingCameraSettings
  onCameraSettingsChange: (settings: TrainingCameraSettings) => void
  onExit: () => void
}

export type EncounterRuntimeLoader = () => Promise<{ default: ComponentType<EncounterRuntimeProps> }>

export interface EncounterPackageV1 {
  apiVersion: 1
  manifest: EncounterManifest
  actions: readonly EncounterActionDefinition[]
  abilities: readonly AbilityDefinition[]
  phases: readonly PhaseDefinition[]
  roles: readonly RoleDefinition[]
  timingProfiles: readonly TimingProfile[]
  tacticSchema: TacticSchema
  tactics: readonly TacticPreset[]
  learn2d: readonly Learn2DScenario[]
  train3d: readonly Train3DScenario[]
  train3dArenas: readonly WorldArena3D[]
  runtimeLoaders: Readonly<Record<EncounterMode, EncounterRuntimeLoader>>
}
