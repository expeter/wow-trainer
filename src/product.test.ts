import { describe, expect, it } from 'vitest'
import { PRODUCT } from './product'

describe('Season 2 product boundary', () => {
  it('exposes the standalone product identity', () => {
    expect(PRODUCT.id).toBe('midnight-season-2')
    expect(PRODUCT.shortId).toBe('midnight-s2')
    expect(PRODUCT.plannedHostname).toBe('midnight.asgard.website')
  })
})
