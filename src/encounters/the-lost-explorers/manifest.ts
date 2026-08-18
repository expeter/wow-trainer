import type { EncounterManifest } from '../../platform/encounters'

export const manifest = {
  id: 'the-lost-explorers', name: 'The Lost Explorers', raid: 'The Venomous Abyss', order: 4,
  contentSeason: 'Midnight Season 2', sourceConfidence: 'medium', availability: 'ptr-preview',
  supportedModes: ['learn2d', 'train3d'],
  defaults: [
    { mode: 'learn2d', scenarioId: 'lost_explorers_full_fight', timingProfileId: 'lost_explorers_pre_live', tacticId: 'lost_explorers_default' },
    { mode: 'train3d', scenarioId: 'lost_explorers_full_fight', timingProfileId: 'lost_explorers_pre_live', tacticId: 'lost_explorers_default' },
  ],
  capabilities: ['full-fight', 'three-boss-council', 'crate-fish-cycle', 'frostfire-cleanse', 'airborne-wave-crossing', 'split-soaks'],
  summary: 'Keep two explorers together, feed Iku, Gebbo, then Nama, and resolve each Ultimate before Mor’zahi ascends.',
} as const satisfies EncounterManifest
