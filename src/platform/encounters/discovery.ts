import type { EncounterPackageV1 } from './types'
import { validateEncounterPackage } from './validate'

export interface EncounterDiagnostic {
  source: string
  errors: readonly string[]
}

export interface EncounterCatalogue {
  packages: readonly EncounterPackageV1[]
  diagnostics: readonly EncounterDiagnostic[]
}

export type EncounterPackageLoader = () => Promise<{ default: unknown }>

const discoveredLoaders = import.meta.glob<{ default: unknown }>('../../encounters/*/index.ts')

export async function loadEncounterCatalogue(
  loaders: Record<string, EncounterPackageLoader> = discoveredLoaders,
): Promise<EncounterCatalogue> {
  const packages: EncounterPackageV1[] = []
  const loaded: { source: string; package: EncounterPackageV1 }[] = []
  const diagnostics: EncounterDiagnostic[] = []

  await Promise.all(Object.entries(loaders).map(async ([source, load]) => {
    try {
      const result = validateEncounterPackage((await load()).default)
      if (result.ok) loaded.push({ source, package: result.package })
      else diagnostics.push({ source, errors: result.errors })
    } catch (error) {
      diagnostics.push({
        source,
        errors: [error instanceof Error ? error.message : 'Encounter package failed to load.'],
      })
    }
  }))

  const idCounts = new Map<string, number>()
  for (const entry of loaded) {
    idCounts.set(entry.package.manifest.id, (idCounts.get(entry.package.manifest.id) ?? 0) + 1)
  }
  for (const entry of loaded) {
    if (idCounts.get(entry.package.manifest.id) === 1) packages.push(entry.package)
    else diagnostics.push({
      source: entry.source,
      errors: [`Encounter ID "${entry.package.manifest.id}" is exported by more than one package.`],
    })
  }

  packages.sort((left, right) => left.manifest.order - right.manifest.order || left.manifest.name.localeCompare(right.manifest.name))
  diagnostics.sort((left, right) => left.source.localeCompare(right.source))
  return { packages, diagnostics }
}
