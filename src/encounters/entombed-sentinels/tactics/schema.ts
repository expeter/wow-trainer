import { splitRaidPlacements, standardRaidActors, type TacticSchema } from '../../../platform/encounters'

const split = splitRaidPlacements()
const stasis = splitRaidPlacements(43, 57)
const raidPlan = new URL('../../../../inbox/INBOX-20260815-131711-f9dac6.png', import.meta.url).href
const bossActors = [
  { id: 'acid-boss', label: 'ACID', kind: 'boss' as const, color: '#71d49a' },
  { id: 'blood-boss', label: 'BLOOD', kind: 'boss' as const, color: '#d66b78' },
]

export const tacticSchema = {
  version: 2,
  fields: [
    { id: 'acid_tank', label: 'Acid tank', kind: 'player', required: true },
    { id: 'blood_tank', label: 'Blood tank', kind: 'player', required: true },
    { id: 'acid_group', label: 'Acid-side group', kind: 'group', required: true },
    { id: 'blood_group', label: 'Blood-side group', kind: 'group', required: true },
    { id: 'helical_pairs', label: 'Helical Toxin pairs', kind: 'pair', required: true },
    { id: 'meeting_sectors', label: 'Helical meeting sectors', kind: 'region', required: true },
    { id: 'protovenom_pairs', label: 'Protovenom pairs', kind: 'pair', required: false },
    { id: 'protovenom_lanes', label: 'Protovenom meeting lanes', kind: 'region', required: false },
    { id: 'swap_action_owner', label: 'Tank swap action owner', kind: 'action-owner', required: true },
    { id: 'dispel_action_owner', label: 'Blighted Blood dispel owner', kind: 'action-owner', required: true },
    { id: 'droplet_owners', label: 'Toxic Droplet owners', kind: 'group', required: true },
    { id: 'miasma_soak_group', label: 'Miasma soak group', kind: 'group', required: true },
    { id: 'pool_drop_regions', label: 'Blood Venom drop regions', kind: 'region', required: true },
  ],
  planner: {
    actors: [...standardRaidActors, ...bossActors],
    maps: [
      { id: 'sentinels_active_cycle', label: 'Split-side cycle', arenaId: 'sentinels_split_diagram', backgroundImage: raidPlan, shape: 'rectangle', actorIds: [...standardRaidActors.map(actor => actor.id), 'acid-boss', 'blood-boss'], placements: { ...split, 'acid-boss': { x: 78, y: 50 }, 'blood-boss': { x: 22, y: 50 } } },
      { id: 'sentinels_stasis', label: 'Vitriolic Stasis', arenaId: 'sentinels_split_diagram', backgroundImage: raidPlan, shape: 'rectangle', actorIds: [...standardRaidActors.map(actor => actor.id), 'acid-boss', 'blood-boss'], placements: { ...stasis, 'acid-boss': { x: 47, y: 50 }, 'blood-boss': { x: 53, y: 50 } } },
    ],
  },
} as const satisfies TacticSchema
