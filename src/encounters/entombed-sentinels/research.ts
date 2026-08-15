import type { SourceProvenance } from '../../platform/encounters'

export const journalHigh = {
  kind: 'journal',
  confidence: 'high',
  asOf: '2026-08-13',
  note: 'Current Dungeon Journal rule recorded in the Season 2 research handover.',
} as const satisfies SourceProvenance

export const ptrMedium = {
  kind: 'ptr-guide',
  confidence: 'medium',
  asOf: '2026-08-13',
  note: 'PTR guide and footage synthesis; must not be presented as live timing.',
} as const satisfies SourceProvenance

export const localTactic = {
  kind: 'local-tactic',
  confidence: 'medium',
  asOf: '2026-08-13',
  note: 'Initial trainer tactic decision derived from the reviewed raid plan.',
} as const satisfies SourceProvenance
