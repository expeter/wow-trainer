import type { TimingProfile } from '../../../platform/encounters'

const supplied = { kind: 'ptr-guide', confidence: 'medium', asOf: '2026-08-16', note: 'Verified duration or radius from the reconciled pre-live specification.' } as const
const configurable = { kind: 'ptr-video', confidence: 'low', asOf: '2026-08-16', note: 'Replaceable trainer cadence pending live combat-log validation.' } as const
export const preLiveTiming = {
  id: 'lost_explorers_pre_live', encounterId: 'the-lost-explorers', version: 1, status: 'ptr', values: [
    { key: 'final-ascension-cast', value: 5, unit: 'seconds', provenance: supplied },
    { key: 'crate-impact-radius', value: 3, unit: 'yards', provenance: supplied },
    { key: 'crate-rupture', value: 25, unit: 'seconds', provenance: supplied },
    { key: 'frostfire-impact-radius', value: 10, unit: 'yards', provenance: supplied },
    { key: 'blast-wave-speed', value: 8, unit: 'yards', provenance: configurable },
    { key: 'mighty-thud-radius', value: 6, unit: 'yards', provenance: supplied },
    { key: 'cycle-seconds', value: 34, unit: 'seconds', provenance: configurable },
  ],
} as const satisfies TimingProfile
