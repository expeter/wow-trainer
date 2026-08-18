import { describe, expect, it } from 'vitest'
import { validateEncounterPackage } from '../../platform/encounters'
import encounter from './index'
describe('Coiled Altar package', () => { it('is a ready isolated full fight with supplied plan', () => { expect(validateEncounterPackage(encounter)).toEqual({ ok: true, package: encounter }); expect(encounter.tacticSchema.planner?.maps[0].backgroundImage).toContain('the-coiled-altar'); expect(encounter.train3dArenas[0].theme.layout).toBe('coiled-altar') }) })
