import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_BODY_BYTES = 28 * 1024 * 1024
const MAX_MESSAGE_LENGTH = 4_000
const MAX_SCREENSHOTS = 4
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const REPORT_ID = /^FEEDBACK-\d{8}-\d{6}-[a-f0-9]{8}$/
const ALLOWED_TYPES = new Map([
  ['image/png', { extension: '.png', signature: bytes => bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) }],
  ['image/jpeg', { extension: '.jpg', signature: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ['image/webp', { extension: '.webp', signature: bytes => bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' }],
])

function sha256(value) {
  return createHash('sha256').update(value).digest()
}

function secretMatches(value, expectedHex) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedHex ?? '')) return false
  return timingSafeEqual(sha256(value), Buffer.from(expectedHex, 'hex'))
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
  response.end(JSON.stringify(payload))
}

function safeContext(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output = {}
  for (const [key, item] of Object.entries(value)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)) continue
    if (typeof item === 'string') output[key] = item.slice(0, 1_000)
    else if (typeof item === 'number' && Number.isFinite(item)) output[key] = item
    else if (typeof item === 'boolean') output[key] = item
  }
  return output
}

function makeReportId(now = new Date()) {
  return `FEEDBACK-${now.toISOString().replace(/[-:]/g, '').slice(0, 8)}-${now.toISOString().replace(/[-:]/g, '').slice(9, 15)}-${randomBytes(4).toString('hex')}`
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request exceeds 28 MiB.')
      error.statusCode = 413
      throw error
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.statusCode = 400
    throw error
  }
}

function validateScreenshots(value) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_SCREENSHOTS) {
    const error = new Error('Attach at most four screenshots.')
    error.statusCode = 400
    throw error
  }
  return value.map((item, index) => {
    const type = typeof item?.type === 'string' ? item.type.toLowerCase() : ''
    const rule = ALLOWED_TYPES.get(type)
    if (!rule || typeof item?.dataBase64 !== 'string') {
      const error = new Error(`Screenshot ${index + 1} must be PNG, JPEG, or WebP.`)
      error.statusCode = 400
      throw error
    }
    const bytes = Buffer.from(item.dataBase64, 'base64')
    const canonicalBase64 = bytes.toString('base64').replace(/=+$/, '')
    if (!bytes.length || canonicalBase64 !== item.dataBase64.replace(/\s/g, '').replace(/=+$/, '') || bytes.length > MAX_SCREENSHOT_BYTES || !rule.signature(bytes)) {
      const error = new Error(`Screenshot ${index + 1} is invalid or exceeds 5 MiB.`)
      error.statusCode = 400
      throw error
    }
    const suppliedName = typeof item.name === 'string' ? basename(item.name).slice(0, 160) : `screenshot-${index + 1}${rule.extension}`
    return { bytes, type, suppliedName, extension: rule.extension }
  })
}

function createRateLimiter({ windowMs = 60 * 60 * 1000, maximum = 6 } = {}) {
  const entries = new Map()
  return address => {
    const now = Date.now()
    const current = entries.get(address)
    if (!current || current.resetAt <= now) {
      entries.set(address, { count: 1, resetAt: now + windowMs })
      return true
    }
    current.count += 1
    if (entries.size > 5_000) {
      for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key)
    }
    return current.count <= maximum
  }
}

function remoteAddress(request) {
  const proxyAddress = request.headers['x-midnight-client-ip']
  return (typeof proxyAddress === 'string' ? proxyAddress : request.socket.remoteAddress ?? 'unknown').trim().slice(0, 80)
}

function corsHeaders(request, origins) {
  const origin = request.headers.origin
  if (!origin || !origins.has(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '600',
    vary: 'Origin',
  }
}

function bearerToken(request) {
  const authorization = request.headers.authorization ?? ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
}

async function storedReports(storageDirectory) {
  const entries = await readdir(storageDirectory, { withFileTypes: true }).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error))
  return entries.filter(entry => entry.isDirectory() && REPORT_ID.test(entry.name)).map(entry => entry.name).sort()
}

async function loadReport(storageDirectory, id) {
  if (!REPORT_ID.test(id)) return undefined
  try {
    return JSON.parse(await readFile(join(storageDirectory, id, 'report.json'), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

export function createFeedbackServer(options = {}) {
  const storageDirectory = resolve(options.storageDirectory ?? process.env.MIDNIGHT_FEEDBACK_STORAGE ?? './.tmp/feedback-service')
  const guildCodeHash = options.guildCodeHash ?? process.env.MIDNIGHT_FEEDBACK_GUILD_CODE_SHA256
  const downloadKeyHash = options.downloadKeyHash ?? process.env.MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_SHA256
  const origins = new Set(options.allowedOrigins ?? (process.env.MIDNIGHT_FEEDBACK_ALLOWED_ORIGINS ?? 'https://midnight.asgard.website,http://127.0.0.1:5173,http://localhost:5173').split(',').map(item => item.trim()).filter(Boolean))
  const allowSubmission = createRateLimiter(options.rateLimit)

  if (!/^[a-f0-9]{64}$/i.test(guildCodeHash ?? '') || !/^[a-f0-9]{64}$/i.test(downloadKeyHash ?? '')) {
    throw new Error('MIDNIGHT_FEEDBACK_GUILD_CODE_SHA256 and MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_SHA256 must be SHA-256 hex digests.')
  }

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://feedback.local')
    const cors = corsHeaders(request, origins)
    try {
      if (request.method === 'OPTIONS') {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' })
        response.writeHead(204, cors)
        return response.end()
      }

      if (request.method === 'GET' && requestUrl.pathname === '/health') {
        return json(response, 200, { ok: true, service: 'midnight-feedback', version: 1 }, cors)
      }

      if (request.method === 'POST' && requestUrl.pathname === '/v2/feedback') {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' }, cors)
        if (!allowSubmission(remoteAddress(request))) return json(response, 429, { error: 'Too many reports. Please try again later.' }, cors)
        const body = await readJsonBody(request)
        if (!secretMatches(body.guildCode, guildCodeHash)) return json(response, 403, { error: 'Guild access code is not valid.' }, cors)
        const message = typeof body.message === 'string' ? body.message.trim() : ''
        if (!message || message.length > MAX_MESSAGE_LENGTH) return json(response, 400, { error: 'Describe the problem in 1–4000 characters.' }, cors)
        const screenshots = validateScreenshots(body.screenshots)
        const id = makeReportId()
        const createdAt = new Date().toISOString()
        const stagingDirectory = join(storageDirectory, `.incoming-${id}`)
        const reportDirectory = join(storageDirectory, id)
        await mkdir(stagingDirectory, { recursive: false })
        try {
          const attachments = []
          for (const [index, screenshot] of screenshots.entries()) {
            const filename = `screenshot-${index + 1}${screenshot.extension}`
            await writeFile(join(stagingDirectory, filename), screenshot.bytes, { flag: 'wx', mode: 0o600 })
            attachments.push({
              filename,
              originalName: screenshot.suppliedName,
              type: screenshot.type,
              bytes: screenshot.bytes.length,
              sha256: createHash('sha256').update(screenshot.bytes).digest('hex'),
            })
          }
          const report = { id, createdAt, message, context: safeContext(body.context), attachments }
          await writeFile(join(stagingDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
          await rename(stagingDirectory, reportDirectory)
        } catch (error) {
          await rm(stagingDirectory, { recursive: true, force: true })
          throw error
        }
        return json(response, 201, { id, createdAt }, cors)
      }

      if (requestUrl.pathname.startsWith('/v2/admin/feedback')) {
        if (!secretMatches(bearerToken(request), downloadKeyHash)) return json(response, 401, { error: 'Download key is required.' })
        const segments = requestUrl.pathname.split('/').filter(Boolean)
        if (request.method === 'GET' && segments.length === 3) {
          const after = requestUrl.searchParams.get('after') ?? ''
          const limit = Math.min(Math.max(Number(requestUrl.searchParams.get('limit')) || 100, 1), 500)
          const ids = (await storedReports(storageDirectory)).filter(id => !after || id > after).slice(0, limit)
          const reports = await Promise.all(ids.map(id => loadReport(storageDirectory, id)))
          return json(response, 200, { reports: reports.filter(Boolean) })
        }
        const id = segments[3]
        const report = id ? await loadReport(storageDirectory, id) : undefined
        if (!report) return json(response, 404, { error: 'Report not found.' })
        if (request.method === 'GET' && segments.length === 4) return json(response, 200, report)
        if (request.method === 'GET' && segments.length === 6 && segments[4] === 'attachments') {
          const attachment = report.attachments.find(item => item.filename === segments[5])
          if (!attachment) return json(response, 404, { error: 'Attachment not found.' })
          const bytes = await readFile(join(storageDirectory, id, attachment.filename))
          response.writeHead(200, { 'content-type': attachment.type, 'content-length': bytes.length, 'cache-control': 'no-store', 'content-disposition': `attachment; filename="${attachment.filename}"` })
          return response.end(bytes)
        }
      }

      return json(response, 404, { error: 'Not found.' }, cors)
    } catch (error) {
      const status = Number(error.statusCode) || 500
      if (status === 500) console.error(error)
      return json(response, status, { error: status === 500 ? 'Feedback service error.' : error.message }, cors)
    }
  })
  return { server, storageDirectory }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { server, storageDirectory } = createFeedbackServer()
  const host = process.env.MIDNIGHT_FEEDBACK_HOST ?? '127.0.0.1'
  const port = Number(process.env.MIDNIGHT_FEEDBACK_PORT ?? 8798)
  await mkdir(storageDirectory, { recursive: true, mode: 0o700 })
  server.listen(port, host, () => console.log(`Midnight feedback listening on http://${host}:${port}`))
}
