import type { EncounterManifest } from '../../platform/encounters'

export const manifest = {
  id: 'nekzali', name: "Nek'zali the Soulcoiler", raid: 'The Venomous Abyss', order: 1,
  contentSeason: 'Midnight Season 2', sourceConfidence: 'medium', availability: 'ptr-preview',
  supportedModes: ['learn2d', 'train3d'],
  defaults: [
    { mode: 'learn2d', scenarioId: 'nekzali_full_fight', timingProfileId: 'nekzali_ptr_2026-08-15', tacticId: 'nekzali_default' },
    { mode: 'train3d', scenarioId: 'nekzali_full_fight', timingProfileId: 'nekzali_ptr_2026-08-15', tacticId: 'nekzali_default' },
  ],
  capabilities: ['tank-actions', 'aggro', 'interrupts', 'group-soaks', 'spread', 'target-switching', 'assignment-aware-bots'],
  summary: 'A two-phase Soulwell defense with edge drops, tank-distance play, add control, realm duty, and alternating intermission groups.',
} as const satisfies EncounterManifest
