import { describe, expect, it } from 'vitest'
import nekzali from '../encounters/nekzali'
import { validateSavedTactic } from './TacticalPlanner'

const valid = {
  format: 'midnight-season-2-tactic', version: 2, encounterId: 'nekzali',
  tactic: { ...nekzali.tactics[0], id: 'local' },
  layouts: Object.fromEntries(nekzali.tacticSchema.planner.maps.map(map => [map.id, map.placements])),
} as const

describe('versioned tactical plan imports', () => {
  it('accepts matching assignment and per-phase actor layouts', () => {
    expect(validateSavedTactic(valid, nekzali)).toEqual(valid)
  })

  it('rejects cross-encounter, stale-schema, missing-required, unknown fields, and missing actors', () => {
    expect(validateSavedTactic({ ...valid, encounterId: 'another' }, nekzali)).toBeUndefined()
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, schemaVersion: 1 } }, nekzali)).toBeUndefined()
    const incomplete = Object.fromEntries(Object.entries(valid.tactic.assignments).filter(([key]) => key !== 'soak_group_1'))
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, assignments: incomplete } }, nekzali)).toBeUndefined()
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, assignments: { ...valid.tactic.assignments, foreign: 'value' } } }, nekzali)).toBeUndefined()
    expect(validateSavedTactic({ ...valid, layouts: { ...valid.layouts, nekzali_phase_1: {} } }, nekzali)).toBeUndefined()
  })
})
