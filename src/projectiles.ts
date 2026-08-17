import type { TrainingClass } from './platform/contractRoom'

export interface Point { x: number; y: number }
export type CombatProjectileShape = 'firebolt' | 'frostbolt' | 'lightning' | 'arrow' | 'spear' | 'shadowbolt' | 'naturebolt' | 'holybolt'
export interface NpcProjectileShot { age: number; npcOrdinal: number; shotOrdinal: number }

export const COMBAT_PROJECTILE_TRAVEL_SECONDS = 1.15
export const COMBAT_PROJECTILE_IMPACT_SECONDS = .08
export const NPC_PROJECTILE_MIN_INTERVAL_SECONDS = 1
export const NPC_PROJECTILE_MAX_INTERVAL_SECONDS = 3
export const MAX_VISIBLE_NPC_PROJECTILES = 20

function deterministicUnit(seed: number) {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  value = Math.imul(value ^ value >>> 13, 0xc2b2ae35)
  return ((value ^ value >>> 16) >>> 0) / 0x100000000
}

export function combatProjectileShape(playerClass: TrainingClass, shotOrdinal = 0): CombatProjectileShape {
  if (playerClass === 'mage') return shotOrdinal % 2 === 0 ? 'firebolt' : 'frostbolt'
  if (playerClass === 'shaman' || playerClass === 'evoker') return 'lightning'
  if (playerClass === 'hunter') return 'arrow'
  if (playerClass === 'warrior' || playerClass === 'death-knight' || playerClass === 'demon-hunter') return 'spear'
  if (playerClass === 'warlock') return 'shadowbolt'
  if (playerClass === 'druid' || playerClass === 'monk') return 'naturebolt'
  return 'holybolt'
}

export function combatProjectileTravelSeconds(shape: CombatProjectileShape) {
  if (shape === 'arrow') return 1.15
  if (shape === 'spear') return .92
  if (shape === 'lightning') return .64
  return .52
}

export function npcProjectileIntervalSeconds(npcOrdinal: number) {
  return NPC_PROJECTILE_MIN_INTERVAL_SECONDS + deterministicUnit(npcOrdinal * 17 + 11) * (NPC_PROJECTILE_MAX_INTERVAL_SECONDS - NPC_PROJECTILE_MIN_INTERVAL_SECONDS)
}

export function combatProjectilePosition(origin: Point, target: Point, age: number, travelSeconds = COMBAT_PROJECTILE_TRAVEL_SECONDS): Point {
  const progress = Math.max(0, Math.min(1, age / travelSeconds)); const eased = 1 - (1 - progress) * (1 - progress)
  return { x: origin.x + (target.x - origin.x) * eased, y: origin.y + (target.y - origin.y) * eased }
}

export function combatProjectileImpactPoint(origin: Point, bossCenter: Point, bossRadius: number, shotOrdinal = 0): Point {
  const angle = Math.atan2(origin.y - bossCenter.y, origin.x - bossCenter.x) + (deterministicUnit(shotOrdinal * 43 + 29) - .5) * .72
  return { x: bossCenter.x + Math.cos(angle) * bossRadius, y: bossCenter.y + Math.sin(angle) * bossRadius }
}

export function npcProjectileShots(time: number, npcCount: number): NpcProjectileShot[] {
  if (npcCount <= 0 || time < 0) return []
  const shots: NpcProjectileShot[] = []
  for (let npcOrdinal = 0; npcOrdinal < Math.min(npcCount, MAX_VISIBLE_NPC_PROJECTILES); npcOrdinal += 1) {
    const interval = npcProjectileIntervalSeconds(npcOrdinal); const firstShot = .05 + deterministicUnit(npcOrdinal * 31 + 7) * (interval - .05)
    if (time < firstShot) continue
    const shotOrdinal = Math.floor((time - firstShot) / interval); const age = time - (firstShot + shotOrdinal * interval)
    if (age <= COMBAT_PROJECTILE_TRAVEL_SECONDS + COMBAT_PROJECTILE_IMPACT_SECONDS) shots.push({ age, npcOrdinal, shotOrdinal })
  }
  return shots
}
