import { describe, expect, it } from 'vitest'
import { classProjectileEffects, cosmeticClassProjectiles } from './cosmeticCombat'
import type { ActorSnapshot } from './types'

describe('ambient NPC class casts', () => {
  it('creates stable visual-only projectiles for classed allies', () => {
    const actors: ActorSnapshot[] = [
      { id: 'mage', kind: 'ally', playerClass: 'mage', position: { x: 4, z: 2 }, facing: 0, color: '#fff', auras: [] },
      { id: 'boss', kind: 'boss', position: { x: 0, z: 0 }, facing: 0, color: '#fff', auras: [] },
    ]
    const active = Array.from({ length: 100 }, (_, index) => cosmeticClassProjectiles(actors, { x: 0, z: 0 }, index * .05)).find(effects => effects.some(effect => effect.kind === 'cosmetic-projectile'))!
    expect(active[0]).toMatchObject({ kind: 'cosmetic-projectile', projectileShape: expect.stringMatching(/firebolt|frostbolt/), originHeight: 1.45, targetHeight: 2.7 })
    expect(active[0].id).toContain('cosmetic-class-cast-mage')
    expect(active[0].target).not.toEqual(active[0].position)
  })

  it('reuses class-specific L\'ura silhouettes and ends in an impact', () => {
    expect(classProjectileEffects('hunter-shot', { x: 6, z: 0 }, { x: 0, z: 0 }, 'hunter', .2)[0]).toMatchObject({ projectileShape: 'arrow' })
    expect(classProjectileEffects('shaman-shot', { x: 6, z: 0 }, { x: 0, z: 0 }, 'shaman', .2)[0]).toMatchObject({ projectileShape: 'lightning' })
    expect(classProjectileEffects('mage-shot', { x: 6, z: 0 }, { x: 0, z: 0 }, 'mage', .54)[0]).toMatchObject({ kind: 'projectile-impact' })
  })
})
