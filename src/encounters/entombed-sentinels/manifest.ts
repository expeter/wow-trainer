import type { EncounterManifest } from '../../platform/encounters'

export const manifest = {
  id: 'entombed-sentinels',
  name: 'Entombed Sentinels',
  raid: 'The Venomous Abyss',
  order: 2,
  contentSeason: 'Midnight Season 2',
  sourceConfidence: 'medium',
  availability: 'ptr-preview',
  supportedModes: ['learn2d', 'train3d'],
  supportedDifficulties: ['heroic', 'mythic'],
  defaults: [
    { mode: 'learn2d', difficulty: 'heroic', scenarioId: 'sentinels_helical_toxins', timingProfileId: 'ptr_2026-08-13', tacticId: 'sentinels_default' },
    { mode: 'learn2d', difficulty: 'mythic', scenarioId: 'sentinels_mythic_protovenom', timingProfileId: 'ptr_2026-08-13', tacticId: 'sentinels_default' },
    { mode: 'train3d', difficulty: 'heroic', scenarioId: 'sentinels_helical_toxins', timingProfileId: 'ptr_2026-08-13', tacticId: 'sentinels_default' },
    { mode: 'train3d', difficulty: 'mythic', scenarioId: 'sentinels_mythic_protovenom', timingProfileId: 'ptr_2026-08-13', tacticId: 'sentinels_default' },
  ],
  capabilities: ['tank-actions', 'pair-matching', 'group-soaks', 'assignment-aware-bots'],
  summary: 'A two-boss split encounter built around side responsibilities, Vitriolic Stasis, and exact toxin partner matching.',
} as const satisfies EncounterManifest
