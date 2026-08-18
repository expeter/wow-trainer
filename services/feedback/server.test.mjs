import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { promisify } from 'node:util'
import { createFeedbackServer } from './server.mjs'

const guildCode = 'guild-test-code'
const downloadKey = 'download-test-key'
const hash = value => createHash('sha256').update(value).digest('hex')
const png = Buffer.from('89504e470d0a1a0a00000000', 'hex')
const execFileAsync = promisify(execFile)
let baseUrl
let service

before(async () => {
  const storageDirectory = await mkdtemp(join(tmpdir(), 'midnight-feedback-'))
  service = createFeedbackServer({
    storageDirectory,
    guildCodeHash: hash(guildCode),
    downloadKeyHash: hash(downloadKey),
    allowedOrigins: ['https://midnight.asgard.website'],
    rateLimit: { maximum: 20 },
  })
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${service.server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => service.server.close(error => error ? reject(error) : resolve()))
})

test('accepts a guild report and keeps screenshots in private storage', async () => {
  const response = await fetch(`${baseUrl}/v2/feedback`, {
    method: 'POST',
    headers: { origin: 'https://midnight.asgard.website', 'content-type': 'application/json' },
    body: JSON.stringify({
      guildCode,
      message: 'The boss marker clips through the platform.',
      context: { encounterId: 'sszorak', mode: 'train3d', nested: { ignored: true } },
      screenshots: [{ name: 'screen.png', type: 'image/png', dataBase64: png.toString('base64') }],
    }),
  })
  assert.equal(response.status, 201)
  const receipt = await response.json()
  assert.match(receipt.id, /^FEEDBACK-/)
  const stored = JSON.parse(await readFile(join(service.storageDirectory, receipt.id, 'report.json'), 'utf8'))
  assert.equal(stored.message, 'The boss marker clips through the platform.')
  assert.deepEqual(stored.context, { encounterId: 'sszorak', mode: 'train3d' })
  assert.equal(await readFile(join(service.storageDirectory, receipt.id, 'screenshot-1.png'), 'hex'), png.toString('hex'))

  const list = await fetch(`${baseUrl}/v2/admin/feedback`, { headers: { authorization: `Bearer ${downloadKey}` } })
  assert.equal(list.status, 200)
  const manifest = await list.json()
  assert.equal(manifest.reports[0].id, receipt.id)
  const attachment = await fetch(`${baseUrl}/v2/admin/feedback/${receipt.id}/attachments/screenshot-1.png`, { headers: { authorization: `Bearer ${downloadKey}` } })
  assert.equal(Buffer.from(await attachment.arrayBuffer()).toString('hex'), png.toString('hex'))

  const pullDirectory = await mkdtemp(join(tmpdir(), 'midnight-feedback-pull-'))
  const { stdout } = await execFileAsync(process.execPath, ['scripts/pull-feedback.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, MIDNIGHT_FEEDBACK_API_URL: baseUrl, MIDNIGHT_FEEDBACK_DOWNLOAD_KEY: downloadKey, MIDNIGHT_FEEDBACK_OUTPUT: pullDirectory },
  })
  assert.match(stdout, /1 downloaded/)
  assert.match(await readFile(join(pullDirectory, receipt.id, 'report.md'), 'utf8'), /boss marker clips through the platform/)
  assert.equal(await readFile(join(pullDirectory, receipt.id, 'screenshot-1.png'), 'hex'), png.toString('hex'))
})

test('rejects missing origin, invalid access, oversized count, and unauthenticated downloads', async () => {
  const request = body => fetch(`${baseUrl}/v2/feedback`, {
    method: 'POST',
    headers: { origin: 'https://midnight.asgard.website', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  assert.equal((await fetch(`${baseUrl}/v2/feedback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 403)
  assert.equal((await request({ guildCode: 'wrong', message: 'No' })).status, 403)
  assert.equal((await request({ guildCode, message: 'Too many', screenshots: Array.from({ length: 5 }, () => ({ type: 'image/png', dataBase64: png.toString('base64') })) })).status, 400)
  assert.equal((await fetch(`${baseUrl}/v2/admin/feedback`)).status, 401)
})

test('answers health and accepted CORS preflight without exposing secrets', async () => {
  const health = await fetch(`${baseUrl}/health`)
  assert.deepEqual(await health.json(), { ok: true, service: 'midnight-feedback', version: 1 })
  const preflight = await fetch(`${baseUrl}/v2/feedback`, { method: 'OPTIONS', headers: { origin: 'https://midnight.asgard.website' } })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://midnight.asgard.website')
})
