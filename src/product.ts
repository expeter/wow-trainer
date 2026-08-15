export const PRODUCT = {
  id: 'midnight-season-2',
  shortId: 'midnight-s2',
  name: 'Midnight Season 2 Trainer',
  plannedHostname: 'midnight.asgard.website',
  repositoryUrl: 'https://github.com/expeter/wow-trainer',
  firstEncounter: 'Entombed Sentinels',
} as const

export const LEGACY_REFERENCE_QUERY = 'reference=lura-v0.9.1'

export function legacyReferenceRequested(search: string, development: boolean) {
  return development && new URLSearchParams(search).get('reference') === 'lura-v0.9.1'
}
