import { contractRaidRoster, trainingClassColors } from '../../../platform/contractRoom'
import type { TacticSchema } from '../../../platform/encounters'

const actors = [
  ...contractRaidRoster.map(member => ({ id: member.id, label: member.id === 'player' ? 'Player' : member.id.replaceAll('-', ' '), kind: 'player' as const, role: member.role, color: trainingClassColors[member.playerClass] })),
  { id: 'lost-iku', label: 'Scrollsage Iku', kind: 'boss' as const, color: '#71bde3' },
  { id: 'lost-gebbo', label: 'Trader Gebbo', kind: 'boss' as const, color: '#d8a85d' },
  { id: 'lost-nama', label: 'First Mate Nama', kind: 'boss' as const, color: '#7bcf8e' },
  { id: 'lost-morzahi', label: 'Mor’zahi', kind: 'add' as const, color: '#9c78e8' },
]
const placements = Object.fromEntries(actors.map((actor, index) => [actor.id, actor.kind === 'player' ? { x: 38 + index % 5 * 6, y: 58 + Math.floor(index / 5) * 5 } : actor.id === 'lost-morzahi' ? { x: 50, y: 50 } : actor.id === 'lost-nama' ? { x: 70, y: 35 } : { x: 32 + index % 2 * 9, y: 40 }]))
export const tacticSchema = {
  version: 1,
  fields: [
    { id: 'fish-order', label: 'Fish order', kind: 'group', required: true },
    { id: 'thud-groups', label: 'Mighty Thud groups', kind: 'group', required: true },
    { id: 'interrupt-owner', label: 'Iku interrupt owner', kind: 'action-owner', required: true },
  ],
  planner: { actors, maps: [{ id: 'lost-council-route', label: 'Council route', arenaId: 'lost_explorers_raidplan', backgroundImage: new URL('../../../../inbox/the-lost-explorers.png', import.meta.url).href, shape: 'rectangle', actorIds: actors.map(actor => actor.id), placements }] },
} as const satisfies TacticSchema
