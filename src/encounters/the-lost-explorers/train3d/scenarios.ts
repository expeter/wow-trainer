import type { Train3DScenario } from '../../../platform/encounters'
import { abilities } from '../abilities'

export const train3dScenarios = [{ id: 'lost_explorers_full_fight', name: 'The Lost Explorers full fight', kind: 'full-fight', status: 'ready', mode: 'train3d', arenaId: 'lost_explorers_octagonal_world', phaseIds: ['lost_iku_cycle', 'lost_gebbo_cycle', 'lost_nama_cycle'], roleIds: ['lost_tank', 'lost_healer', 'lost_melee', 'lost_ranged'], timingProfileIds: ['lost_explorers_pre_live'], tacticIds: ['lost_explorers_default'], abilityIds: abilities.map(ability => ability.id), metricIds: ['fish-deadline', 'element-cleanse', 'wave-clearance', 'thud-soaks', 'health-sync'] }] as const satisfies readonly Train3DScenario[]
