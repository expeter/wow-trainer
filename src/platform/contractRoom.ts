import type { AuraTone } from './train3d/types'

export type RaidRole = 'tank' | 'healer' | 'melee' | 'ranged'
export type ContractDirection = 'north' | 'east' | 'south' | 'west'

export interface ContractRaidMember { id: string; role: RaidRole; controlled?: boolean }
export interface ContractGroundChoice { id: string; tone: AuraTone; direction: ContractDirection; correct: boolean }
export interface ContractEvent { id: string; tone: AuraTone; groundObjects: readonly ContractGroundChoice[] }

export const CONTRACT_EVENT_SECONDS = 7
export const CONTRACT_LANDING_SECONDS = 1.1
export const contractDirections: readonly ContractDirection[] = ['north', 'east', 'south', 'west']
export const contractTones: readonly AuraTone[] = ['poison', 'danger', 'spectral', 'beneficial']
export const auraToneColors: Record<AuraTone, string> = { beneficial: '#72e5c0', poison: '#70dc87', danger: '#ef7182', spectral: '#9d83f2' }

export const contractRaidRoster: readonly ContractRaidMember[] = [
  { id: 'tank-1', role: 'tank' }, { id: 'tank-2', role: 'tank' },
  ...Array.from({ length: 5 }, (_, index) => ({ id: `healer-${index + 1}`, role: 'healer' as const })),
  ...Array.from({ length: 5 }, (_, index) => ({ id: `melee-${index + 1}`, role: 'melee' as const })),
  { id: 'player', role: 'ranged', controlled: true },
  ...Array.from({ length: 7 }, (_, index) => ({ id: `ranged-${index + 2}`, role: 'ranged' as const })),
]

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
