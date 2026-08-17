import { describe, expect, it } from 'vitest'
import nekzali from '../encounters/nekzali'
import { validateSavedTactic } from './TacticalPlanner'

const valid = {
  format: 'midnight-season-2-tactic', version: 1, encounterId: 'nekzali',
  tactic: { ...nekzali.tactics[0], id: 'local', placements: { soak_group_1: { x: 30, y: 40 } } },
} as const

describe('versioned tactical plan imports', () => {
  it('accepts the matching encounter schema and optional marker positions', () => {
    expect(validateSavedTactic(valid, nekzali)).toEqual(valid)
  })

  it('rejects cross-encounter, stale-schema, missing-required, and unknown fields', () => {
    expect(validateSavedTactic({ ...valid, encounterId: 'another' }, nekzali)).toBeUndefined()
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, schemaVersion: 2 } }, nekzali)).toBeUndefined()
    const incomplete = Object.fromEntries(Object.entries(valid.tactic.assignments).filter(([key]) => key !== 'soak_group_1'))
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, assignments: incomplete } }, nekzali)).toBeUndefined()
    expect(validateSavedTactic({ ...valid, tactic: { ...valid.tactic, assignments: { ...valid.tactic.assignments, foreign: 'value' } } }, nekzali)).toBeUndefined()
  })
})
