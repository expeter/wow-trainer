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

test('ships only the standalone Season 2 application', () => {
  const main = read('src/main.tsx')
  assert.match(main, /<StrictMode><OnlineProvider><Season2App \/><\/OnlineProvider><\/StrictMode>/)
  assert.doesNotMatch(main, /import\.meta\.env\.DEV|\.\/App|legacyReference/)
  assert.doesNotMatch(read('src/Season2App.tsx'), /from '\.\/online'/)
})

test('preserves the setup shell around automatically discovered package runtimes', () => {
  const shell = read('src/Season2App.tsx')
  const discovery = read('src/platform/encounters/discovery.ts')
  const sentinels = read('src/encounters/entombed-sentinels/index.ts')
  for (const label of ['Game settings', 'Keys & Mouse', 'HUD', 'Tactical plan', 'Audio', 'Statistics', 'Profile']) {
    assert.match(shell, new RegExp(`'${label.replace('&', '\\&')}'`))
  }
  assert.match(shell, /mode === 'learn2d' \? '2D' : '3D'/)
  assert.match(shell, /\(\['learn2d', 'train3d'\] as EncounterMode\[\]\)/)
  assert.match(shell, /loadEncounterCatalogue/)
  assert.match(shell, /selectedEncounter\.runtimeLoaders\[mode\]/)
  assert.match(shell, /import\.meta\.env\.DEV && <article className="season2-contract-room-card">/)
  assert.match(shell, /await import\('\.\/platform\/train3d\/ContractRoom'\)/)
  assert.match(sentinels, /learn2d: \(\) => import\('\.\/learn2d\/Runtime'\)/)
  assert.match(sentinels, /train3d: \(\) => import\('\.\/train3d\/Runtime'\)/)
  assert.match(discovery, /import\.meta\.glob<.*>\('\.\.\/\.\.\/encounters\/\*\/index\.ts'\)/)
  assert.doesNotMatch(discovery, /entombed-sentinels/)
})

test('publishes only through the dedicated Season 2 Pages path', () => {
  const pages = read('.github/workflows/pages.yml')
  assert.match(pages, /actions\/deploy-pages/)
  assert.match(pages, /actions\/upload-pages-artifact/)
  assert.match(pages, /pages: write/)
  assert.doesNotMatch(pages, /lura\.asgard\.website|api\.asgard\.website|scp |ssh /)
})

test('keeps the dedicated Season 2 OAuth client isolated from V1 configuration', () => {
  const scripts = JSON.parse(read('package.json')).scripts
  const onlineServer = read('services/online/server.mjs')
  assert.match(scripts['online:serve'], /--env-file-if-exists=\.env/)
  for (const name of ['V2_BATTLE_NET_CLIENT_ID', 'V2_BATTLE_NET_CLIENT_SECRET', 'V2_BATTLE_NET_CALLBACK_URL']) {
    assert.match(onlineServer, new RegExp(name))
  }
  assert.doesNotMatch(onlineServer, /V1_BATTLE_NET|MIDNIGHT_BATTLENET/)
})

test('keeps focused browser tests audited and trainer-only', () => {
  const playwright = read('playwright.config.ts')
  const wrapper = read('scripts/playwright-local.sh')
  assert.match(wrapper, /sec-helper audit/)
  assert.match(wrapper, /exec npm run test:e2e/)
  assert.match(playwright, /node node_modules\/vite\/bin\/vite\.js --host 127\.0\.0\.1/)
  assert.doesNotMatch(playwright, /npm run dev --/)
})

test('resolves Project Inbox from the current Codex home instead of a stale agent home', () => {
  const scripts = JSON.parse(read('package.json')).scripts
  for (const name of ['dev:inbox', 'inbox', 'inbox:list']) {
    assert.match(scripts[name], /\$HOME\/\.codex\/skills\/project-inbox\/scripts\/project-inbox\.mjs/)
    assert.doesNotMatch(scripts[name], /\/home\/codex\/\.agents/)
  }
})

test('records the ordered migration boundary', () => {
  const ledger = read('docs/README.md')
  const milestones = read('docs/milestones.md')
  const specifications = read('docs/specifications.md')
  const architecture = read('docs/architecture.md')
  for (const ticket of ['CR-230', 'SPEC-018', 'FR-072', 'FR-073']) assert.match(ledger, new RegExp(ticket))
  assert.match(architecture, /No step changes the inherited leaderboard season/)
  assert.match(architecture, /Build Entombed Sentinels as the only encounter package/)

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
