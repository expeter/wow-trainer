import type { PlannerActorDefinition } from './types'

const roleColor = {
  tank: '#78a7ff',
  healer: '#71dd99',
  melee: '#f0a46b',
  ranged: '#b697ef',
} as const

export const standardRaidActors: readonly PlannerActorDefinition[] = [
  ...Array.from({ length: 2 }, (_, index) => ({ id: `tank-${index + 1}`, label: `T${index + 1}`, kind: 'player' as const, role: 'tank' as const, color: roleColor.tank })),
  ...Array.from({ length: 5 }, (_, index) => ({ id: `healer-${index + 1}`, label: `H${index + 1}`, kind: 'player' as const, role: 'healer' as const, color: roleColor.healer })),
  ...Array.from({ length: 6 }, (_, index) => ({ id: `melee-${index + 1}`, label: `M${index + 1}`, kind: 'player' as const, role: 'melee' as const, color: roleColor.melee })),
  ...Array.from({ length: 7 }, (_, index) => ({ id: `ranged-${index + 1}`, label: `R${index + 1}`, kind: 'player' as const, role: 'ranged' as const, color: roleColor.ranged })),
]

export function splitRaidPlacements(left = 31, right = 69) {
  return Object.fromEntries(standardRaidActors.map((actor, index) => {
    const side = index % 2 === 0 ? left : right
    const row = Math.floor(index / 2)
    return [actor.id, { x: side + ((row % 3) - 1) * 5, y: 19 + row * 6.5 }]
  }))
}

export function radialRaidPlacements(radius = 29) {
  return Object.fromEntries(standardRaidActors.map((actor, index) => {
    const angle = (Math.PI * 2 * index) / standardRaidActors.length - Math.PI / 2
    const ring = index < 7 ? radius * .58 : radius
    return [actor.id, { x: 50 + Math.cos(angle) * ring, y: 50 + Math.sin(angle) * ring }]
  }))
}
