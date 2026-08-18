import type { Learn2DScenario } from '../../../platform/encounters'
import { abilities } from '../abilities'

export const lostExplorersDiagramArena = { id: 'lost_explorers_raidplan', label: 'Lost Explorers supplied octagonal raid plan', regions: [
  { id: 'center', label: 'Mor’zahi', x: 50, y: 50 }, { id: 'outer', label: 'Bomb edge', x: 50, y: 8 }, { id: 'cleave', label: 'Two-boss cleave route', x: 30, y: 42 }, { id: 'separate', label: 'Separated explorer', x: 72, y: 42 },
] } as const
export const learn2dScenarios = [{ id: 'lost_explorers_full_fight', name: 'The Lost Explorers full fight', kind: 'full-fight', status: 'ready', mode: 'learn2d', arena: lostExplorersDiagramArena, phaseIds: ['lost_iku_cycle', 'lost_gebbo_cycle', 'lost_nama_cycle'], roleIds: ['lost_tank', 'lost_healer', 'lost_melee', 'lost_ranged'], timingProfileIds: ['lost_explorers_pre_live'], tacticIds: ['lost_explorers_default'], abilityIds: abilities.map(ability => ability.id), steps: [
  'Keep one explorer separated so all three never gain United Defense together.',
  'Recover and throw the next fish before Mor’zahi completes Final Ascension.',
  'Dodge the landing junk circles, then search the resulting crates for the fish.',
  'Feed the eligible explorers in the planned Iku, Gebbo, then Nama order.',
  'Use the assigned interrupt on Iku before Icebound Flames completes.',
  'Place Fire outside or Frost inside, then step into the opposite patch to cleanse Frostfire.',
  'Drop Gebbo’s bomb at the outer edge opposite the mushroom the raid will preserve.',
  'Use the preserved mushroom launch—or jump while airborne—to cross Blast Wave.',
  'Read Nama’s three moving shell lanes and move through the open gap.',
  'Join your assigned Mighty Thud soak in sequence and aim every knockback toward safe floor.',
] }] as const satisfies readonly Learn2DScenario[]
