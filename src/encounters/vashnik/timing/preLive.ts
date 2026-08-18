import type { TimingProfile } from '../../../platform/encounters'

const journal = { kind: 'journal', confidence: 'high', asOf: '2026-08-16', note: 'Current pre-live journal/spell value.' } as const
const guide = { kind: 'ptr-guide', confidence: 'medium', asOf: '2026-08-16', note: 'Current guide/PTR value pending live-log validation.' } as const
const trainer = { kind: 'local-tactic', confidence: 'low', asOf: '2026-08-16', note: 'Explicit trainer schedule pending a reliable live cadence.' } as const

export const preLiveTiming = {
  id: 'vashnik_pre_live_2026-08-16', encounterId: 'vashnik', version: 1, status: 'ptr',
  values: [
    { key: 'imbibe_trigger', value: 100, unit: 'energy', provenance: journal },
    { key: 'infusion_duration', value: 90, unit: 'seconds', provenance: guide },
    { key: 'hardened_venom', value: 60, unit: 'seconds', provenance: journal },
    { key: 'caustic_surge_window', value: 3, unit: 'seconds', provenance: journal },
    { key: 'froth_duration', value: 6, unit: 'seconds', provenance: journal },
    { key: 'froth_radius', value: 4.5, unit: 'yards', provenance: journal },
    { key: 'bile_radius', value: 6, unit: 'yards', provenance: journal },
    { key: 'siphon_radius', value: 10, unit: 'yards', provenance: journal },
    { key: 'siphon_pulse', value: 1.5, unit: 'seconds', provenance: journal },
    { key: 'dripping_fangs_cast', value: 2, unit: 'seconds', provenance: journal },
    { key: 'dripping_fangs_duration', value: 32, unit: 'seconds', provenance: journal },
    { key: 'learn2d_cycle', value: 38, unit: 'seconds', provenance: trainer },
    { key: 'train3d_cycle', value: 46, unit: 'seconds', provenance: trainer },
  ],
} as const satisfies TimingProfile
