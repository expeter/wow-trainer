import { describe, expect, it } from 'vitest'
import { cosmeticClassProjectiles } from './cosmeticCombat'
import type { ActorSnapshot } from './types'

describe('ambient NPC class casts', () => {
  it('creates stable visual-only projectiles for classed allies', () => {
    const actors: ActorSnapshot[] = [
      { id: 'mage', kind: 'ally', playerClass: 'mage', position: { x: 4, z: 2 }, facing: 0, color: '#fff', auras: [] },
      { id: 'boss', kind: 'boss', position: { x: 0, z: 0 }, facing: 0, color: '#fff', auras: [] },
    ]
    expect(cosmeticClassProjectiles(actors, { x: 0, z: 0 }, 1.25)).toEqual([expect.objectContaining({ id: 'cosmetic-class-cast-mage', kind: 'cosmetic-projectile', target: { x: 0, z: 0 } })])
  })
})
