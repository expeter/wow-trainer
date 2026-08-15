import type { TimingProfile } from '../../../platform/encounters'

const ptr = { kind: 'local-tactic', confidence: 'medium', asOf: '2026-08-15', note: 'Replaceable trainer pacing pending live EU Heroic logs.' } as const
export const ptrTiming = {
  id: 'nekzali_ptr_2026-08-15', encounterId: 'nekzali', version: 1, status: 'ptr', difficulties: ['heroic', 'mythic'],
  values: [
    { key: 'phase_1_target', value: 90, unit: 'seconds', provenance: ptr },
    { key: 'essence_pull', value: 5, unit: 'seconds', provenance: { ...ptr, kind: 'journal', confidence: 'high' } },
    { key: 'essence_duration', value: 15, unit: 'seconds', provenance: { ...ptr, kind: 'journal', confidence: 'high' } },
    { key: 'adds_spawn', value: 60, unit: 'seconds', provenance: ptr },
    { key: 'invoke_cast', value: 5, unit: 'seconds', provenance: ptr },
    { key: 'arena_diameter', value: 90, unit: 'yards', provenance: ptr },
  ],
} as const satisfies TimingProfile
