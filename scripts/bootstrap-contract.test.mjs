import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('uses the standalone Season 2 product identity', () => {
  const packageJson = JSON.parse(read('package.json'))
  assert.equal(packageJson.name, 'midnight-season-2-trainer')
  assert.match(read('index.html'), /<title>Midnight Season 2 Trainer<\/title>/)
  assert.match(read('src/product.ts'), /id: 'midnight-season-2'/)
  assert.match(read('src/product.ts'), /shortId: 'midnight-s2'/)
})

test('keeps the legacy application behind the development gate', () => {
  const main = read('src/main.tsx')
  const product = read('src/product.ts')
  assert.match(main, /import\.meta\.env\.DEV && legacyReferenceRequested\(window\.location\.search, true\)/)
  assert.match(main, /await import\('\.\/App'\)/)
  assert.match(product, /return development &&/)
  assert.doesNotMatch(read('src/Season2App.tsx'), /from '\.\/online'/)
})

test('preserves the six-section shell around automatically discovered package runtimes', () => {
  const shell = read('src/Season2App.tsx')
  const discovery = read('src/platform/encounters/discovery.ts')
  const sentinels = read('src/encounters/entombed-sentinels/index.ts')
  for (const label of ['Game settings', 'Keys & Mouse', 'HUD', 'Tactical plan', 'Statistics', 'Profile']) {
    assert.match(shell, new RegExp(`'${label.replace('&', '\\&')}'`))
  }
  assert.match(shell, />Learn 2D</)
  assert.match(shell, />Train 3D</)
  assert.match(shell, /loadEncounterCatalogue/)
  assert.match(shell, /encounter\.runtimeLoaders\[mode\]/)
  assert.match(shell, /import\.meta\.env\.DEV && <article className="season2-contract-room-card">/)
  assert.match(shell, /await import\('\.\/platform\/train3d\/ContractRoom'\)/)
  assert.match(sentinels, /learn2d: \(\) => import\('\.\/learn2d\/Runtime'\)/)
  assert.match(sentinels, /train3d: \(\) => import\('\.\/train3d\/Runtime'\)/)
  assert.match(discovery, /import\.meta\.glob<.*>\('\.\.\/\.\.\/encounters\/\*\/index\.ts'\)/)
  assert.doesNotMatch(discovery, /entombed-sentinels/)
})

test('disables both inherited production deployment paths', () => {
  const pages = read('.github/workflows/pages.yml')
  const api = read('.github/workflows/api.yml')
  assert.doesNotMatch(pages, /actions\/deploy-pages|actions\/upload-pages-artifact|pages: write/)
  assert.doesNotMatch(api, /deploy-api:|api\.asgard\.website|scp |ssh /)
  assert.match(api, /workflow_dispatch:/)
})

test('records the ordered migration boundary', () => {
  const ledger = read('docs/README.md')
  const milestones = read('docs/milestones.md')
  const specifications = read('docs/specifications.md')
  const architecture = read('docs/architecture.md')
  for (const ticket of ['CR-230', 'SPEC-018', 'FR-072', 'FR-073']) assert.match(ledger, new RegExp(ticket))
  assert.match(architecture, /No step changes the inherited leaderboard season/)
  assert.match(architecture, /Entombed Sentinels as the only encounter package/)

  const openTickets = [...ledger.matchAll(
    /\| `((?:FR|CR|BUG|SPEC)-\d+)` \| (?:Planned|In progress|Backlog[^|]*|Deferred) \|/g,
  )].map(match => match[1])
  for (const ticket of openTickets) {
    assert.equal((milestones.match(new RegExp('^(?:-|\\d+\\.) `' + ticket + '`', 'gm')) ?? []).length, 1)
  }
  for (const [, specification] of specifications.matchAll(/^## (SPEC-\d+) ·/gm)) {
    assert.ok(ledger.includes('`' + specification + '`'))
  }
})
