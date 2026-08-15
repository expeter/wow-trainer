import type { TimingProfile } from '../../../platform/encounters'
import { journalHigh, ptrMedium } from '../research'

export const ptrTiming = {
  id: 'ptr_2026-08-13',
  encounterId: 'entombed-sentinels',
  version: 1,
  status: 'ptr',
  difficulties: ['heroic', 'mythic'],
  values: [
    { key: 'stasis-energy', value: 100, unit: 'energy', provenance: journalHigh },
    { key: 'stasis-duration', value: 30, unit: 'seconds', provenance: journalHigh },
    { key: 'helical-window', value: 28, unit: 'seconds', provenance: journalHigh },
    { key: 'mark-interval', value: 5, unit: 'seconds', provenance: journalHigh },
    { key: 'mark-duration', value: 40, unit: 'seconds', provenance: journalHigh },
    { key: 'reported-pull-energy', value: 50, unit: 'energy', provenance: ptrMedium },
    { key: 'planned-boss-separation', value: 40, unit: 'yards', provenance: ptrMedium },
    { key: 'toxic-droplet-expiry', value: 12, unit: 'seconds', provenance: journalHigh },
    { key: 'living-venom-return', value: 4, unit: 'seconds', provenance: journalHigh },
    { key: 'miasma-eruption', value: 8, unit: 'seconds', provenance: journalHigh },
    { key: 'blighted-blood-duration', value: 18, unit: 'seconds', provenance: journalHigh },
    { key: 'training-pool-drop-after-soak', value: 5, unit: 'seconds', provenance: ptrMedium },
  ],
} as const satisfies TimingProfile
