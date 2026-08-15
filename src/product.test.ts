import { describe, expect, it } from 'vitest'
import { legacyReferenceRequested, PRODUCT } from './product'

describe('Season 2 product boundary', () => {
  it('exposes the standalone product identity', () => {
    expect(PRODUCT.id).toBe('midnight-season-2')
    expect(PRODUCT.shortId).toBe('midnight-s2')
    expect(PRODUCT.plannedHostname).toBe('midnight.asgard.website')
  })

  it('allows the L’ura baseline reference in development only', () => {
    expect(legacyReferenceRequested('?reference=lura-v0.9.1', true)).toBe(true)
    expect(legacyReferenceRequested('?reference=lura-v0.9.1', false)).toBe(false)
    expect(legacyReferenceRequested('?reference=another-build', true)).toBe(false)
  })
})
