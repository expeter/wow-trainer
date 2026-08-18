import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../platform/encounters'
import encounter from './index'
describe('Twin Fangs package', () => { it('is a ready isolated full fight with supplied toxic-depths plan', () => { expect(validateEncounterPackage(encounter)).toEqual({ ok: true, package: encounter }); expect(encounter.tacticSchema.planner?.maps[0].backgroundImage).toContain('the-twin-fangs'); expect(encounter.train3dArenas[0].theme).toMatchObject({ layout: 'triangle-ring', surroundings: 'toxic-depths', platform: 'floating' }) }) })
