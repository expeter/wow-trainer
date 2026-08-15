import type {
  EncounterDefaultSelection,
  EncounterPackageV1,
  Learn2DScenario,
  Train3DScenario,
} from './types'

export type EncounterValidationResult =
  | { ok: true; package: EncounterPackageV1 }
  | { ok: false; errors: readonly string[] }

const stableIdPattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function ids(items: readonly { id: string }[]) {
  return new Set(items.map(item => item.id))
}

function checkIds(label: string, items: readonly { id: string }[], errors: string[]) {
  const seen = new Set<string>()
  for (const item of items) {
    if (!stableIdPattern.test(item.id)) errors.push(`${label} ID "${item.id}" is not stable lowercase ASCII.`)
    if (seen.has(item.id)) errors.push(`${label} ID "${item.id}" is duplicated.`)
    seen.add(item.id)
  }
}

function checkReferences(
  owner: string,
  references: readonly string[],
  available: ReadonlySet<string>,
  target: string,
  errors: string[],
) {
  for (const reference of references) {
    if (!available.has(reference)) errors.push(`${owner} references unknown ${target} "${reference}".`)
  }
}

function scenarioSupportsDefault(
  selection: EncounterDefaultSelection,
  learn2d: readonly Learn2DScenario[],
  train3d: readonly Train3DScenario[],
) {
  const scenarios = selection.mode === 'learn2d' ? learn2d : train3d
  return scenarios.some(scenario => scenario.id === selection.scenarioId && scenario.difficulty === selection.difficulty)
}

function validatePackageShape(value: unknown): EncounterValidationResult {
  if (!isRecord(value)) return { ok: false, errors: ['Package export must be an object.'] }
  if (value.apiVersion !== 1) return { ok: false, errors: ['Package apiVersion must be 1.'] }

  const requiredObjects = ['manifest', 'tacticSchema']
  const requiredArrays = [
    'abilities', 'phases', 'roles', 'timingProfiles', 'tactics', 'learn2d', 'train3d', 'train3dArenas',
  ]
  const shapeErrors = [
    ...requiredObjects.filter(key => !isRecord(value[key])).map(key => `${key} must be an object.`),
    ...requiredArrays.filter(key => !Array.isArray(value[key])).map(key => `${key} must be an array.`),
  ]
  if (shapeErrors.length) return { ok: false, errors: shapeErrors }

  const pkg = value as unknown as EncounterPackageV1
  const errors: string[] = []
  if (!stableIdPattern.test(pkg.manifest.id)) errors.push(`Encounter ID "${pkg.manifest.id}" is not stable lowercase ASCII.`)
  if (!pkg.manifest.name?.trim()) errors.push('Encounter manifest name is required.')
  if (!Number.isInteger(pkg.manifest.order) || pkg.manifest.order < 1) errors.push('Encounter order must be a positive integer.')
  if (!pkg.manifest.supportedModes.includes('learn2d') || !pkg.manifest.supportedModes.includes('train3d')) {
    errors.push('The reference package must support Learn 2D and Train 3D.')
  }

  checkIds('Ability', pkg.abilities, errors)
  checkIds('Phase', pkg.phases, errors)
  checkIds('Role', pkg.roles, errors)
  checkIds('Timing profile', pkg.timingProfiles, errors)
  checkIds('Tactic', pkg.tactics, errors)
  checkIds('Learn 2D scenario', pkg.learn2d, errors)
  checkIds('Train 3D scenario', pkg.train3d, errors)
  checkIds('Train 3D arena', pkg.train3dArenas, errors)
  checkIds('Tactic field', pkg.tacticSchema.fields, errors)

  const abilityIds = ids(pkg.abilities)
  const phaseIds = ids(pkg.phases)
  const roleIds = ids(pkg.roles)
  const timingProfileIds = ids(pkg.timingProfiles)
  const tacticIds = ids(pkg.tactics)
  const arenaIds = ids(pkg.train3dArenas)
  const tacticFieldIds = ids(pkg.tacticSchema.fields)

  for (const phase of pkg.phases) checkReferences(`Phase "${phase.id}"`, phase.abilityIds, abilityIds, 'ability', errors)
  for (const profile of pkg.timingProfiles) {
    if (profile.encounterId !== pkg.manifest.id) errors.push(`Timing profile "${profile.id}" targets another encounter.`)
    for (const valueDefinition of profile.values) {
      if (!valueDefinition.provenance?.kind || !valueDefinition.provenance.confidence || !valueDefinition.provenance.asOf) {
        errors.push(`Timing value "${profile.id}.${valueDefinition.key}" lacks provenance.`)
      }
    }
  }
  for (const ability of pkg.abilities) {
    if (!ability.provenance?.kind || !ability.provenance.confidence || !ability.provenance.asOf) {
      errors.push(`Ability "${ability.id}" lacks provenance.`)
    }
    for (const timing of ability.timings) {
      if (!timing.provenance?.kind || !timing.provenance.confidence || !timing.provenance.asOf) {
        errors.push(`Ability timing "${ability.id}.${timing.key}" lacks provenance.`)
      }
    }
  }

  const scenarios = [...pkg.learn2d, ...pkg.train3d]
  for (const scenario of scenarios) {
    checkReferences(`Scenario "${scenario.id}"`, scenario.abilityIds, abilityIds, 'ability', errors)
    checkReferences(`Scenario "${scenario.id}"`, scenario.phaseIds, phaseIds, 'phase', errors)
    checkReferences(`Scenario "${scenario.id}"`, scenario.roleIds, roleIds, 'role', errors)
    checkReferences(`Scenario "${scenario.id}"`, scenario.timingProfileIds, timingProfileIds, 'timing profile', errors)
    checkReferences(`Scenario "${scenario.id}"`, scenario.tacticIds, tacticIds, 'tactic', errors)
  }
  for (const scenario of pkg.train3d) {
    if (!arenaIds.has(scenario.arenaId)) errors.push(`Scenario "${scenario.id}" references unknown 3D arena "${scenario.arenaId}".`)
  }
  for (const mode of ['learn2d', 'train3d'] as const) {
    const modeScenarios = mode === 'learn2d' ? pkg.learn2d : pkg.train3d
    if (!modeScenarios.some(scenario => scenario.kind === 'focused')) errors.push(`${mode} needs a focused scenario.`)
    if (!modeScenarios.some(scenario => scenario.kind === 'full-fight')) errors.push(`${mode} needs a full-fight scenario.`)
  }
  for (const selection of pkg.manifest.defaults) {
    if (!pkg.manifest.supportedModes.includes(selection.mode)) errors.push(`Default uses unsupported mode "${selection.mode}".`)
    if (!pkg.manifest.supportedDifficulties.includes(selection.difficulty)) errors.push(`Default uses unsupported difficulty "${selection.difficulty}".`)
    if (!scenarioSupportsDefault(selection, pkg.learn2d, pkg.train3d)) errors.push(`Default references unsupported scenario "${selection.scenarioId}".`)
    if (!timingProfileIds.has(selection.timingProfileId)) errors.push(`Default references unknown timing profile "${selection.timingProfileId}".`)
    if (!tacticIds.has(selection.tacticId)) errors.push(`Default references unknown tactic "${selection.tacticId}".`)
  }
  for (const tactic of pkg.tactics) {
    if (tactic.schemaVersion !== pkg.tacticSchema.version) errors.push(`Tactic "${tactic.id}" uses another schema version.`)
    for (const field of pkg.tacticSchema.fields) {
      if (field.required && !(field.id in tactic.assignments)) errors.push(`Tactic "${tactic.id}" is missing "${field.id}".`)
    }
    for (const fieldId of Object.keys(tactic.assignments)) {
      if (!tacticFieldIds.has(fieldId)) errors.push(`Tactic "${tactic.id}" assigns unknown field "${fieldId}".`)
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, package: pkg }
}

export function validateEncounterPackage(value: unknown): EncounterValidationResult {
  try {
    return validatePackageShape(value)
  } catch {
    return { ok: false, errors: ['Package shape is malformed.'] }
  }
}
