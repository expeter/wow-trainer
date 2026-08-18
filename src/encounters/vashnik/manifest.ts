import type { EncounterManifest } from '../../platform/encounters'

export const manifest = {
  id: 'vashnik',
  name: 'Vashnik the Malignant',
  raid: 'The Venomous Abyss',
  order: 3,
  contentSeason: 'Midnight Season 2',
  sourceConfidence: 'medium',
  availability: 'ptr-preview',
  supportedModes: ['learn2d', 'train3d'],
  defaults: [
    { mode: 'learn2d', scenarioId: 'vashnik_full_fight', timingProfileId: 'vashnik_pre_live_2026-08-16', tacticId: 'vashnik_default' },
    { mode: 'train3d', scenarioId: 'vashnik_full_fight', timingProfileId: 'vashnik_pre_live_2026-08-16', tacticId: 'vashnik_default' },
  ],
  capabilities: ['tank-actions', 'aggro', 'fountain-selection', 'target-switching', 'group-soaks', 'spread', 'assignment-aware-bots'],
  summary: 'A three-fountain positioning fight with mapped infection pairs, priority adds, support camps, cardinal waves, and Tumor alignment.',
} as const satisfies EncounterManifest
