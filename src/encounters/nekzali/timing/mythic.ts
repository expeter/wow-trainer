import type { TimingProfile } from '../../../platform/encounters'

const supplied = { kind: 'local-tactic', confidence: 'low', asOf: '2026-08-15', note: 'Replaceable Mythic trainer cadence supplied after withdrawn PTR testing; encounter rules remain isolated from Heroic.' } as const

export const mythicTiming = {
  id: 'nekzali_mythic_training_2026-08-15', encounterId: 'nekzali', version: 1, status: 'ptr', difficulties: ['mythic'],
  values: [
    { key: 'realm-entry-pull', value: 3, unit: 'seconds', provenance: supplied },
    { key: 'drowned-echo-player-hits', value: 20, unit: 'energy', provenance: supplied },
    { key: 'assigned-interrupt-cast', value: 5, unit: 'seconds', provenance: supplied },
    { key: 'outward-spirit-interval', value: 10, unit: 'seconds', provenance: supplied },
    { key: 'disruption-cast', value: 3, unit: 'seconds', provenance: supplied },
    { key: 'realm-return-cast', value: 5, unit: 'seconds', provenance: supplied },
  ],
} as const satisfies TimingProfile
