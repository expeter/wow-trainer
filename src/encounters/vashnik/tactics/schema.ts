import { radialRaidPlacements, standardRaidActors, type TacticSchema } from '../../../platform/encounters'

const raid = radialRaidPlacements(27)
const plan = new URL('../../../../inbox/INBOX-20260815-133633-4706bd.png', import.meta.url).href
const actors = [...standardRaidActors, { id: 'vashnik-boss', label: 'VASHNIK', kind: 'boss' as const, color: '#75c97e' }]

export const tacticSchema = { version: 2, fields: [
  { id: 'pair_rotation', label: 'Fountain pair rotation', kind: 'region', required: true },
  { id: 'siphon_camp_a', label: 'Siphoning camp A', kind: 'group', required: true },
  { id: 'siphon_camp_b', label: 'Siphoning camp B', kind: 'group', required: true },
  { id: 'outer_infection_lane', label: 'Exploding Infection lane', kind: 'region', required: true },
], planner: { actors, maps: [
  { id: 'vashnik_virulence_cycle', label: 'Virulence cycle', arenaId: 'vashnik_raidplan', backgroundImage: plan, shape: 'circle', actorIds: [...standardRaidActors.map(actor => actor.id), 'vashnik-boss'], placements: { ...raid, 'vashnik-boss': { x: 50, y: 65 } } },
] } } as const satisfies TacticSchema
