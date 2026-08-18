import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createOnlineServer } from './server.mjs'

const origin = 'https://midnight.asgard.website'
const internalKey = 'feedback-internal-test-key'
const hash = value => createHash('sha256').update(value).digest('hex')
let baseUrl
let service

before(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'midnight-online-'))
  service = createOnlineServer({
    databasePath: join(directory, 'online.sqlite'),
    allowedOrigins: [origin],
    callbackUrl: 'https://api.asgard.website/v2/auth/battlenet/callback',
    maintainerAccountIds: ['42'],
    internalKeyHash: hash(internalKey),
    rateLimit: { maximum: 100 },
    oauthClient: {
      authorizationUrl: (region, state) => `https://${region}.battle.net/oauth/authorize?state=${state}`,
      exchange: async () => ({ access_token: 'access' }),
      identity: async () => ({ id: 42 }),
      profile: async () => ({ wow_accounts: [{ characters: [{ id: 1001, name: 'Tester', level: 90, realm: { name: 'Silvermoon', slug: 'silvermoon' }, playable_class: { name: 'Mage' } }] }] }),
    },
  })
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${service.server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => service.server.close(error => error ? reject(error) : resolve()))
  service.database.close()
})

async function login() {
  const start = await fetch(`${baseUrl}/v2/auth/battlenet/start?origin=${encodeURIComponent(origin)}&region=eu`, { redirect: 'manual' })
  assert.equal(start.status, 302)
  const state = new URL(start.headers.get('location')).searchParams.get('state')
  const callback = await fetch(`${baseUrl}/v2/auth/battlenet/callback?state=${state}&code=oauth-code`, { redirect: 'manual' })
  assert.equal(callback.status, 302)
  return callback.headers.get('set-cookie').split(';')[0]
}

test('records identity-free anonymous page views and attempt outcomes', async () => {
  const page = await fetch(`${baseUrl}/v2/events/page-view`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ page: 'setup' }) })
  assert.equal(page.status, 202)
  const started = await fetch(`${baseUrl}/v2/attempts`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ trainerId: 'midnight-season-2', seasonId: 'midnight-s2', encounterId: 'sszorak', encounterName: 'Sszorak', modeId: 'train3d', scenarioId: 'sszorak-full-fight', scenarioKind: 'full-fight', difficulty: 'normal', timingProfileId: 'pre-live', clientVersion: '0.10.0', buildRevision: 'abc' }),
  })
  assert.equal(started.status, 201)
  const issued = await started.json()
  assert.equal(issued.attribution, 'anonymous')
  const completed = await fetch(`${baseUrl}/v2/attempts/${issued.attemptId}/complete`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ reportToken: issued.reportToken, result: 'failure', durationSeconds: 31.5, reasonCode: 'edge-knock', reason: 'Knocked from the platform' }),
  })
  assert.equal(completed.status, 200)
  const repeat = await fetch(`${baseUrl}/v2/attempts/${issued.attemptId}/complete`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ reportToken: issued.reportToken, result: 'failure' }),
  })
  assert.equal((await repeat.json()).idempotent, true)
  const anonymousAttempt = service.database.prepare('SELECT account_id, character_id, result, reason_code FROM attempts WHERE id = ?').get(issued.attemptId)
  assert.equal(anonymousAttempt.account_id, null)
  assert.equal(anonymousAttempt.character_id, null)
  assert.equal(anonymousAttempt.result, 'failure')
  assert.equal(anonymousAttempt.reason_code, 'edge-knock')
})

test('logs in, selects a character, attributes attempts, and protects the event queue', async () => {
  const cookie = await login()
  const meResponse = await fetch(`${baseUrl}/v2/me`, { headers: { origin, cookie } })
  const me = await meResponse.json()
  assert.equal(me.authenticated, true)
  assert.equal(me.isMaintainer, true)
  assert.equal(me.characters[0].name, 'Tester')
  const selectedResponse = await fetch(`${baseUrl}/v2/me/character`, {
    method: 'PUT', headers: { origin, cookie, 'content-type': 'application/json', 'x-csrf-token': me.csrfToken },
    body: JSON.stringify({ characterId: me.characters[0].id }),
  })
  assert.equal(selectedResponse.status, 200)
  const selected = await selectedResponse.json()
  assert.equal(selected.selectedCharacter.name, 'Tester')

  const started = await fetch(`${baseUrl}/v2/attempts`, {
    method: 'POST', headers: { origin, cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ trainerId: 'midnight-season-2', seasonId: 'midnight-s2', encounterId: 'nekzali', encounterName: "Nek'zali", modeId: 'learn2d', scenarioId: 'nekzali-full-fight', scenarioKind: 'full-fight', difficulty: 'easy', clientVersion: '0.10.0', buildRevision: 'abc' }),
  })
  assert.equal((await started.json()).attribution, 'authenticated')
  assert.equal((await fetch(`${baseUrl}/v2/statistics/events`, { headers: { origin } })).status, 401)
  const events = await fetch(`${baseUrl}/v2/statistics/events`, { headers: { origin, cookie } })
  assert.equal(events.status, 200)
  assert.equal((await events.json()).events.some(event => event.characterName === 'Tester'), true)

  const internal = await fetch(`${baseUrl}/v2/internal/session`, { headers: { cookie, authorization: `Bearer ${internalKey}` } })
  assert.deepEqual(await internal.json(), { authenticated: true, accountId: 1, region: 'eu', character: { name: 'Tester', realmName: 'Silvermoon', realmSlug: 'silvermoon' } })
})

test('returns public aggregate statistics without event rows', async () => {
  const response = await fetch(`${baseUrl}/v2/statistics/summary`, { headers: { origin } })
  assert.equal(response.status, 200)
  const summary = await response.json()
  assert.equal(summary.pageViews, 1)
  assert.equal(summary.started >= 2, true)
  assert.equal(summary.failed, 1)
  assert.equal(Array.isArray(summary.encounters), true)
  assert.equal('events' in summary, false)
})
