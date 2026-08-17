import { radialRaidPlacements, standardRaidActors, type TacticSchema } from '../../../platform/encounters'

const raid = radialRaidPlacements()
const realmRaid = Object.fromEntries(standardRaidActors.slice(0, 10).map(actor => [actor.id, raid[actor.id]]))
const raidPlan = new URL('../../../../inbox/INBOX-20260815-124454-f3a9e1.png', import.meta.url).href
const actors = [
  ...standardRaidActors,
  { id: 'nekzali-boss', label: "NEK'ZALI", kind: 'boss' as const, color: '#db657c' },
  { id: 'north-echo', label: 'ECHO N', kind: 'add' as const, color: '#d48cf0' },
  { id: 'south-echo', label: 'ECHO S', kind: 'add' as const, color: '#d48cf0' },
]

export const tacticSchema = { version: 2, fields: [
  { id: 'soak_group_1', label: 'First Echo soak group', kind: 'group', required: true },
  { id: 'soak_group_2', label: 'Second Echo soak group', kind: 'group', required: true },
  { id: 'rend_edge_lane', label: 'Essence Rend edge lane', kind: 'region', required: true },
  { id: 'barrage_lane', label: 'Possession Barrage lane', kind: 'region', required: true },
], planner: { actors, maps: [
  { id: 'nekzali_phase_1', label: 'Phase 1', arenaId: 'nekzali_raidplan', backgroundImage: raidPlan, shape: 'circle', actorIds: [...standardRaidActors.map(actor => actor.id), 'nekzali-boss'], placements: { ...raid, 'nekzali-boss': { x: 50, y: 50 } } },
  { id: 'nekzali_intermission', label: 'Echo intermission', arenaId: 'nekzali_raidplan', backgroundImage: raidPlan, shape: 'circle', actorIds: [...standardRaidActors.map(actor => actor.id), 'north-echo', 'south-echo'], placements: { ...raid, 'north-echo': { x: 50, y: 16 }, 'south-echo': { x: 50, y: 84 } } },
  { id: 'nekzali_phase_2', label: 'Phase 2', arenaId: 'nekzali_raidplan', backgroundImage: raidPlan, shape: 'circle', actorIds: [...standardRaidActors.map(actor => actor.id), 'nekzali-boss'], placements: { ...raid, 'nekzali-boss': { x: 50, y: 50 } } },
  { id: 'nekzali_well_realm', label: 'Grasping Depths realm', arenaId: 'nekzali_raidplan', backgroundImage: raidPlan, shape: 'circle', actorIds: [...standardRaidActors.map(actor => actor.id).slice(0, 10), 'nekzali-boss'], placements: { ...realmRaid, 'nekzali-boss': { x: 50, y: 50 } } },
] } } as const satisfies TacticSchema
