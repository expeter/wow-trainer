import { describe, expect, it } from 'vitest'
import { contractRaidRoster, contractRosterForSlot, contractSelectedMember, trainingClassColors } from './contractRoom'

describe('development contract-room raid plan', () => {
  it('offers 20 selectable positions without changing the raid composition', () => {
    expect(contractRaidRoster).toHaveLength(20)
    for (const slot of contractRaidRoster) {
      const roster = contractRosterForSlot(slot.id)
      expect(roster.filter(member => member.controlled)).toHaveLength(1)
      expect(roster.filter(member => member.role === 'tank')).toHaveLength(2)
      expect(roster.filter(member => member.role === 'healer')).toHaveLength(5)
      expect(roster.filter(member => member.role === 'melee')).toHaveLength(5)
      expect(roster.filter(member => member.role === 'ranged')).toHaveLength(8)
      expect(contractSelectedMember(slot.id)).toMatchObject({ id: slot.id, role: slot.role, playerClass: slot.playerClass })
    }
  })

  it('assigns every abstract slot a readable class color', () => {
    expect(contractRaidRoster.every(member => /^#[0-9a-f]{6}$/i.test(trainingClassColors[member.playerClass]))).toBe(true)
  })
})
