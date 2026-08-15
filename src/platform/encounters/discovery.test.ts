import { describe, expect, it } from 'vitest'
import sentinels from '../../encounters/entombed-sentinels'
import { loadEncounterCatalogue } from './discovery'

describe('automatic encounter discovery', () => {
  it('discovers every isolated raid entry without a central encounter list', async () => {
    const catalogue = await loadEncounterCatalogue()

    expect(catalogue.diagnostics).toEqual([])
    expect(catalogue.packages.map(entry => entry.manifest.id)).toEqual([
      'nekzali', 'entombed-sentinels', 'vashnik', 'the-lost-explorers',
      'sszorak', 'the-twin-fangs', 'the-coiled-altar', 'ulatek',
    ])
  })

  it('excludes malformed packages and reports their source without crashing the catalogue', async () => {
    const catalogue = await loadEncounterCatalogue({
      '/encounters/valid/index.ts': async () => ({ default: sentinels }),
      '/encounters/broken/index.ts': async () => ({ default: { apiVersion: 2 } }),
    })

    expect(catalogue.packages).toHaveLength(1)
    expect(catalogue.diagnostics).toEqual([{
      source: '/encounters/broken/index.ts',
      errors: ['Package apiVersion must be 1.'],
    }])
  })

  it('excludes every package involved in a duplicate encounter ID', async () => {
    const catalogue = await loadEncounterCatalogue({
      '/encounters/copy-a/index.ts': async () => ({ default: sentinels }),
      '/encounters/copy-b/index.ts': async () => ({ default: sentinels }),
    })

    expect(catalogue.packages).toEqual([])
    expect(catalogue.diagnostics).toHaveLength(2)
    expect(catalogue.diagnostics.every(diagnostic =>
      diagnostic.errors[0] === 'Encounter ID "entombed-sentinels" is exported by more than one package.',
    )).toBe(true)
  })
})
