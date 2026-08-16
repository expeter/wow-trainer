import type { AuraTone } from './train3d/types'
import type { EncounterPlayerRole } from './encounters'

export type RaidRole = EncounterPlayerRole
export type ContractPlayerRole = RaidRole
export type ContractDirection = 'north' | 'east' | 'south' | 'west'
export type TrainingClass = 'death-knight' | 'demon-hunter' | 'druid' | 'evoker' | 'hunter' | 'mage' | 'monk' | 'paladin' | 'priest' | 'rogue' | 'shaman' | 'warlock' | 'warrior'

export interface ContractRaidMember { id: string; role: RaidRole; playerClass: TrainingClass; controlled?: boolean }
export interface ContractGroundChoice { id: string; tone: AuraTone; direction: ContractDirection; correct: boolean }
export interface ContractEvent { id: string; tone: AuraTone; groundObjects: readonly ContractGroundChoice[] }

export const CONTRACT_EVENT_SECONDS = 7
export const CONTRACT_LANDING_SECONDS = 1.1
export const contractDirections: readonly ContractDirection[] = ['north', 'east', 'south', 'west']
export const contractTones: readonly AuraTone[] = ['poison', 'danger', 'spectral', 'beneficial']
export const auraToneColors: Record<AuraTone, string> = { beneficial: '#72e5c0', poison: '#70dc87', danger: '#ef7182', spectral: '#9d83f2' }
export const trainingClassColors: Record<TrainingClass, string> = {
  'death-knight': '#c41e3a', 'demon-hunter': '#a330c9', druid: '#ff7c0a', evoker: '#33937f', hunter: '#aad372', mage: '#3fc7eb', monk: '#00ff98', paladin: '#f48cba', priest: '#f5f5f5', rogue: '#fff468', shaman: '#0070dd', warlock: '#8788ee', warrior: '#c69b6d',
}
export const CONTRACT_DEFAULT_PLAYER_SLOT = 'player'

export const contractRaidRoster: readonly ContractRaidMember[] = [
  { id: 'tank-1', role: 'tank', playerClass: 'warrior' }, { id: 'tank-2', role: 'tank', playerClass: 'paladin' },
  { id: 'healer-1', role: 'healer', playerClass: 'priest' }, { id: 'healer-2', role: 'healer', playerClass: 'druid' }, { id: 'healer-3', role: 'healer', playerClass: 'shaman' }, { id: 'healer-4', role: 'healer', playerClass: 'monk' }, { id: 'healer-5', role: 'healer', playerClass: 'evoker' },
  { id: 'melee-1', role: 'melee', playerClass: 'rogue' }, { id: 'melee-2', role: 'melee', playerClass: 'death-knight' }, { id: 'melee-3', role: 'melee', playerClass: 'demon-hunter' }, { id: 'melee-4', role: 'melee', playerClass: 'warrior' }, { id: 'melee-5', role: 'melee', playerClass: 'paladin' },
  { id: CONTRACT_DEFAULT_PLAYER_SLOT, role: 'ranged', playerClass: 'mage', controlled: true },
  { id: 'ranged-2', role: 'ranged', playerClass: 'hunter' }, { id: 'ranged-3', role: 'ranged', playerClass: 'warlock' }, { id: 'ranged-4', role: 'ranged', playerClass: 'shaman' }, { id: 'ranged-5', role: 'ranged', playerClass: 'druid' }, { id: 'ranged-6', role: 'ranged', playerClass: 'priest' }, { id: 'ranged-7', role: 'ranged', playerClass: 'evoker' }, { id: 'ranged-8', role: 'ranged', playerClass: 'mage' },
]

export function contractRosterForSlot(slotId: string): readonly ContractRaidMember[] {
  const validSlot = contractRaidRoster.some(member => member.id === slotId) ? slotId : CONTRACT_DEFAULT_PLAYER_SLOT
  return contractRaidRoster.map(member => ({ ...member, controlled: member.id === validSlot }))
}

export function contractSelectedMember(slotId: string): ContractRaidMember {
  return contractRosterForSlot(slotId).find(member => member.controlled)!
}

export function contractSlotLabel(member: ContractRaidMember) {
  const roleLabel = member.role === 'melee' ? 'Melee' : member.role === 'ranged' ? 'Ranged' : member.role[0].toUpperCase() + member.role.slice(1)
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  return `${roleLabel} ${peers.findIndex(candidate => candidate.id === member.id) + 1}`
}

function nextRandom(value: number) { return (value * 1664525 + 1013904223) >>> 0 }

export function seededContractEvents(seed: number): readonly ContractEvent[] {
  let value = seed >>> 0
  return contractTones.map((tone, eventIndex) => {
    value = nextRandom(value)
    const correctIndex = value % contractDirections.length
    const wrongTones = contractTones.filter(candidate => candidate !== tone)
    return {
      id: `aura-${tone}`,
      tone,
      groundObjects: contractDirections.map((direction, slotIndex) => ({
        id: `event-${eventIndex}-${direction}`,
        tone: slotIndex === correctIndex ? tone : wrongTones[(slotIndex + eventIndex) % wrongTones.length],
        direction,
        correct: slotIndex === correctIndex,
      })),
    }
  })
}
