import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../platform/encounters'
import encounter from './index'
describe('Sszorak package', () => { it('is a ready isolated full fight with the supplied toxic-depths plan', () => { expect(validateEncounterPackage(encounter)).toEqual({ ok: true, package: encounter }); expect(encounter.learn2d[0].status).toBe('ready'); expect(encounter.tacticSchema.planner?.maps[0].backgroundImage).toContain('sszorak'); expect(encounter.train3d[0].status).toBe('ready'); expect(encounter.train3dArenas[0].theme).toMatchObject({ layout: 'poison-octagon', surroundings: 'toxic-depths', platform: 'floating' }) }) })
