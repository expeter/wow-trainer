import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const SESSION_COOKIE = 'midnight_session'
const SESSION_SECONDS = 7 * 24 * 60 * 60
const STATE_SECONDS = 10 * 60
const MAX_BODY_BYTES = 32 * 1024
const ID = /^[a-z0-9][a-z0-9_-]{0,79}$/
const MODES = new Set(['learn2d', 'train3d'])
const RESULTS = new Set(['success', 'failure', 'exit'])
const REGIONS = new Set(['eu', 'us', 'kr', 'tw'])

function nowIso() { return new Date().toISOString() }
function token(bytes = 32) { return randomBytes(bytes).toString('base64url') }
function sha256(value) { return createHash('sha256').update(value).digest('hex') }
function safeEqual(value, expectedHash) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedHash ?? '')) return false
  return timingSafeEqual(Buffer.from(sha256(value), 'hex'), Buffer.from(expectedHash, 'hex'))
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
  response.end(JSON.stringify(payload))
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, { location, 'cache-control': 'no-store', ...headers })
  response.end()
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Request is too large.'), { statusCode: 413 })
    chunks.push(chunk)
  }
  try {
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 })
  }
}

function cookies(request) {
  const result = {}
  for (const part of String(request.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=')
    if (index < 1) continue
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim())
  }
  return result
}

function sessionCookie(value, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

function corsHeaders(request, origins) {
  const origin = request.headers.origin
  if (!origin || !origins.has(origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-csrf-token',
    'access-control-max-age': '600',
    vary: 'Origin',
  }
}

function remoteAddress(request) {
  const forwarded = request.headers['x-midnight-client-ip']
  return (typeof forwarded === 'string' ? forwarded : request.socket.remoteAddress ?? 'unknown').slice(0, 80)
}

function createRateLimiter({ windowMs = 60 * 60 * 1000, maximum = 180 } = {}) {
  const entries = new Map()
  return address => {
    const now = Date.now()
    const current = entries.get(address)
    if (!current || current.resetAt <= now) {
      entries.set(address, { count: 1, resetAt: now + windowMs })
      return true
    }
    current.count += 1
    if (entries.size > 5_000) for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key)
    return current.count <= maximum
  }
}

function openDatabase(path) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const database = new DatabaseSync(path)
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      provider_region TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      selected_character_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(provider_region, provider_user_id)
    );
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      provider_character_id TEXT NOT NULL,
      name TEXT NOT NULL,
      realm_name TEXT NOT NULL,
      realm_slug TEXT NOT NULL,
      level INTEGER,
      class_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(account_id, provider_character_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS oauth_states (
      state_hash TEXT PRIMARY KEY,
      region TEXT NOT NULL,
      origin TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      report_token_hash TEXT NOT NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
      character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
      trainer_id TEXT NOT NULL,
      season_id TEXT NOT NULL,
      encounter_id TEXT NOT NULL,
      encounter_name TEXT NOT NULL,
      mode_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      scenario_kind TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      timing_profile_id TEXT,
      tactic_category TEXT,
      role_id TEXT,
      roster_slot TEXT,
      client_version TEXT NOT NULL,
      build_revision TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_seconds REAL,
      result TEXT,
      reason_code TEXT,
      reason TEXT
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
      character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
      attempt_id TEXT REFERENCES attempts(id) ON DELETE CASCADE,
      page TEXT
    );
    CREATE INDEX IF NOT EXISTS events_created_idx ON events(created_at DESC);
    CREATE INDEX IF NOT EXISTS attempts_encounter_idx ON attempts(encounter_id, mode_id, started_at DESC);
  `)
  return database
}

function cleanText(value, maximum = 120) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function requiredId(value, label) {
  if (typeof value !== 'string' || !ID.test(value)) throw Object.assign(new Error(`${label} is invalid.`), { statusCode: 400 })
  return value
}

function normalizeCharacters(profile) {
  const accounts = Array.isArray(profile?.wow_accounts) ? profile.wow_accounts : []
  const characters = accounts.flatMap(account => Array.isArray(account?.characters) ? account.characters : [])
  const seen = new Set()
  return characters.flatMap(character => {
    const providerId = String(character?.id ?? '')
    const name = cleanText(character?.name, 80)
    const realmName = cleanText(character?.realm?.name, 100)
    const realmSlug = cleanText(character?.realm?.slug, 100)
    if (!providerId || !name || !realmName || !realmSlug || seen.has(providerId)) return []
    seen.add(providerId)
    return [{
      providerId,
      name,
      realmName,
      realmSlug,
      level: Number.isFinite(character?.level) ? Number(character.level) : null,
      className: cleanText(character?.playable_class?.name, 80) || null,
    }]
  })
}

function defaultOauthClient({ clientId, clientSecret, callbackUrl }) {
  return {
    authorizationUrl(region, state) {
      const url = new URL(`https://${region}.battle.net/oauth/authorize`)
      url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, scope: 'wow.profile', redirect_uri: callbackUrl, state }).toString()
      return url.toString()
    },
    async exchange(region, code) {
      const response = await fetch(`https://${region}.battle.net/oauth/token`, {
        method: 'POST',
        signal: AbortSignal.timeout(12_000),
        headers: {
          authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callbackUrl }),
      })
      if (!response.ok) throw new Error(`Battle.net token exchange failed (${response.status}).`)
      return response.json()
    },
    async identity(region, accessToken) {
      const response = await fetch(`https://${region}.battle.net/oauth/userinfo`, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(12_000) })
      if (!response.ok) throw new Error(`Battle.net identity request failed (${response.status}).`)
      return response.json()
    },
    async profile(region, accessToken) {
      const response = await fetch(`https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_GB`, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(12_000) })
      if (!response.ok) throw new Error(`Battle.net character request failed (${response.status}).`)
      return response.json()
    },
  }
}

export function createOnlineServer(options = {}) {
  const databasePath = resolve(options.databasePath ?? process.env.MIDNIGHT_ONLINE_DATABASE ?? './.tmp/online-service/midnight.sqlite')
  const database = options.database ?? openDatabase(databasePath)
  const origins = new Set(options.allowedOrigins ?? (process.env.MIDNIGHT_ONLINE_ALLOWED_ORIGINS ?? 'https://midnight.asgard.website,http://127.0.0.1:5173,http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean))
  const callbackUrl = options.callbackUrl ?? process.env.MIDNIGHT_BATTLENET_CALLBACK_URL ?? 'https://api.asgard.website/v2/auth/battlenet/callback'
  const clientId = options.clientId ?? process.env.MIDNIGHT_BATTLENET_CLIENT_ID ?? ''
  const clientSecret = options.clientSecret ?? process.env.MIDNIGHT_BATTLENET_CLIENT_SECRET ?? ''
  const oauth = options.oauthClient ?? defaultOauthClient({ clientId, clientSecret, callbackUrl })
  const maintainerIds = new Set(options.maintainerAccountIds ?? (process.env.MIDNIGHT_ONLINE_MAINTAINER_ACCOUNT_IDS ?? '').split(',').map(value => value.trim()).filter(Boolean))
  const internalKeyHash = options.internalKeyHash ?? process.env.MIDNIGHT_ONLINE_INTERNAL_KEY_SHA256
  const allowEvent = createRateLimiter(options.rateLimit)

  const sessionForRequest = request => {
    const raw = cookies(request)[SESSION_COOKIE]
    if (!raw) return undefined
    return database.prepare(`
      SELECT s.token_hash, s.csrf_token, s.expires_at, a.id account_id,
             a.provider_region, a.provider_user_id, a.selected_character_id,
             c.name character_name, c.realm_name, c.realm_slug, c.class_name
      FROM sessions s JOIN accounts a ON a.id = s.account_id
      LEFT JOIN characters c ON c.id = a.selected_character_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(sha256(raw), nowIso())
  }

  const requireSession = request => {
    const session = sessionForRequest(request)
    if (!session) throw Object.assign(new Error('Battle.net login is required.'), { statusCode: 401 })
    return session
  }

  const requireCsrf = (request, session) => {
    if (request.headers['x-csrf-token'] !== session.csrf_token) throw Object.assign(new Error('CSRF token is invalid.'), { statusCode: 403 })
  }

  function publicSession(session) {
    if (!session) return { authenticated: false }
    const characters = database.prepare('SELECT id, provider_character_id providerId, name, realm_name realmName, realm_slug realmSlug, level, class_name className FROM characters WHERE account_id = ? ORDER BY level DESC, name').all(session.account_id)
    return {
      authenticated: true,
      region: session.provider_region,
      selectedCharacterId: session.selected_character_id ?? null,
      selectedCharacter: session.selected_character_id ? {
        id: session.selected_character_id,
        name: session.character_name,
        realmName: session.realm_name,
        realmSlug: session.realm_slug,
        className: session.class_name,
      } : null,
      characters,
      csrfToken: session.csrf_token,
      isMaintainer: maintainerIds.has(String(session.provider_user_id)),
    }
  }

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://online.local')
    const cors = corsHeaders(request, origins)
    try {
      if (request.method === 'OPTIONS') {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' })
        response.writeHead(204, cors)
        return response.end()
      }

      if (request.method === 'GET' && requestUrl.pathname === '/health') {
        return json(response, 200, { ok: true, service: 'midnight-online', version: 1 })
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/auth/battlenet/start') {
        if (!allowEvent(remoteAddress(request))) return json(response, 429, { error: 'Login rate limit reached.' }, cors)
        const origin = requestUrl.searchParams.get('origin') ?? ''
        const region = requestUrl.searchParams.get('region') ?? 'eu'
        if (!origins.has(origin) || !REGIONS.has(region)) return json(response, 400, { error: 'Origin or Battle.net region is invalid.' }, cors)
        const rawState = token()
        const createdAt = nowIso()
        const expiresAt = new Date(Date.now() + STATE_SECONDS * 1000).toISOString()
        database.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').run(createdAt)
        database.prepare('INSERT INTO oauth_states(state_hash, region, origin, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(sha256(rawState), region, origin, createdAt, expiresAt)
        return redirect(response, oauth.authorizationUrl(region, rawState))
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/auth/battlenet/callback') {
        const state = requestUrl.searchParams.get('state') ?? ''
        const code = requestUrl.searchParams.get('code') ?? ''
        const stored = database.prepare('SELECT * FROM oauth_states WHERE state_hash = ? AND expires_at > ?').get(sha256(state), nowIso())
        if (!stored || !code) return json(response, 400, { error: 'Battle.net login state is invalid or expired.' })
        database.prepare('DELETE FROM oauth_states WHERE state_hash = ?').run(stored.state_hash)
        const credentials = await oauth.exchange(stored.region, code)
        const identity = await oauth.identity(stored.region, credentials.access_token)
        const providerUserId = String(identity?.id ?? identity?.sub ?? '')
        if (!providerUserId) throw new Error('Battle.net did not return an account identifier.')
        const profile = await oauth.profile(stored.region, credentials.access_token)
        const createdAt = nowIso()
        database.prepare(`
          INSERT INTO accounts(provider_region, provider_user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(provider_region, provider_user_id) DO UPDATE SET updated_at = excluded.updated_at
        `).run(stored.region, providerUserId, createdAt, createdAt)
        const account = database.prepare('SELECT id, selected_character_id FROM accounts WHERE provider_region = ? AND provider_user_id = ?').get(stored.region, providerUserId)
        const normalizedCharacters = normalizeCharacters(profile)
        const currentProviderIds = new Set(normalizedCharacters.map(character => character.providerId))
        for (const character of normalizedCharacters) {
          database.prepare(`
            INSERT INTO characters(account_id, provider_character_id, name, realm_name, realm_slug, level, class_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(account_id, provider_character_id) DO UPDATE SET
              name = excluded.name, realm_name = excluded.realm_name, realm_slug = excluded.realm_slug,
              level = excluded.level, class_name = excluded.class_name, updated_at = excluded.updated_at
          `).run(account.id, character.providerId, character.name, character.realmName, character.realmSlug, character.level, character.className, createdAt, createdAt)
        }
        for (const character of database.prepare('SELECT id, provider_character_id providerId FROM characters WHERE account_id = ?').all(account.id)) {
          if (!currentProviderIds.has(character.providerId)) database.prepare('DELETE FROM characters WHERE id = ?').run(character.id)
        }
        if (account.selected_character_id && !database.prepare('SELECT 1 FROM characters WHERE id = ? AND account_id = ?').get(account.selected_character_id, account.id)) {
          database.prepare('UPDATE accounts SET selected_character_id = NULL WHERE id = ?').run(account.id)
        }
        const rawSession = token()
        database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(createdAt)
        database.prepare('INSERT INTO sessions(token_hash, account_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(sha256(rawSession), account.id, token(18), createdAt, new Date(Date.now() + SESSION_SECONDS * 1000).toISOString())
        return redirect(response, `${stored.origin}/?online=connected#profile`, { 'set-cookie': sessionCookie(rawSession) })
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/me') {
        return json(response, 200, publicSession(sessionForRequest(request)), cors)
      }

      if (request.method === 'PUT' && requestUrl.pathname === '/v2/me/character') {
        const session = requireSession(request)
        requireCsrf(request, session)
        const body = await readJsonBody(request)
        const character = database.prepare('SELECT id FROM characters WHERE id = ? AND account_id = ?').get(Number(body.characterId), session.account_id)
        if (!character) return json(response, 400, { error: 'Select one of the imported characters.' }, cors)
        database.prepare('UPDATE accounts SET selected_character_id = ?, updated_at = ? WHERE id = ?').run(character.id, nowIso(), session.account_id)
        return json(response, 200, publicSession(sessionForRequest(request)), cors)
      }

      if (request.method === 'POST' && requestUrl.pathname === '/v2/auth/logout') {
        const session = requireSession(request)
        requireCsrf(request, session)
        database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.token_hash)
        return json(response, 200, { ok: true }, { ...cors, 'set-cookie': sessionCookie('', 0) })
      }

      if (request.method === 'DELETE' && requestUrl.pathname === '/v2/me') {
        const session = requireSession(request)
        requireCsrf(request, session)
        database.prepare('DELETE FROM accounts WHERE id = ?').run(session.account_id)
        return json(response, 200, { ok: true }, { ...cors, 'set-cookie': sessionCookie('', 0) })
      }

      if (request.method === 'POST' && requestUrl.pathname === '/v2/events/page-view') {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' }, cors)
        if (!allowEvent(remoteAddress(request))) return json(response, 429, { error: 'Event rate limit reached.' }, cors)
        const body = await readJsonBody(request)
        const session = sessionForRequest(request)
        database.prepare('INSERT INTO events(kind, created_at, account_id, character_id, page) VALUES (?, ?, ?, ?, ?)').run('page_view', nowIso(), session?.account_id ?? null, session?.selected_character_id ?? null, cleanText(body.page, 80) || 'trainer')
        return json(response, 202, { accepted: true }, cors)
      }

      if (request.method === 'POST' && requestUrl.pathname === '/v2/attempts') {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' }, cors)
        if (!allowEvent(remoteAddress(request))) return json(response, 429, { error: 'Event rate limit reached.' }, cors)
        const body = await readJsonBody(request)
        const session = sessionForRequest(request)
        const trainerId = requiredId(body.trainerId, 'Trainer')
        const seasonId = requiredId(body.seasonId, 'Season')
        if (trainerId !== 'midnight-season-2' || seasonId !== 'midnight-s2') return json(response, 400, { error: 'Trainer or season is invalid.' }, cors)
        const modeId = requiredId(body.modeId, 'Mode')
        if (!MODES.has(modeId)) return json(response, 400, { error: 'Mode is invalid.' }, cors)
        const attemptId = `ATTEMPT-${Date.now().toString(36)}-${token(8)}`
        const reportToken = token()
        const startedAt = nowIso()
        database.prepare(`
          INSERT INTO attempts(id, report_token_hash, account_id, character_id, trainer_id, season_id,
            encounter_id, encounter_name, mode_id, scenario_id, scenario_kind, difficulty,
            timing_profile_id, tactic_category, role_id, roster_slot, client_version, build_revision, started_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          attemptId, sha256(reportToken), session?.account_id ?? null, session?.selected_character_id ?? null,
          trainerId, seasonId,
          requiredId(body.encounterId, 'Encounter'), cleanText(body.encounterName, 120) || body.encounterId,
          modeId, requiredId(body.scenarioId, 'Scenario'), requiredId(body.scenarioKind, 'Scenario kind'),
          requiredId(body.difficulty, 'Difficulty'), cleanText(body.timingProfileId, 80) || null,
          cleanText(body.tacticCategory, 80) || null, cleanText(body.roleId, 80) || null,
          cleanText(body.rosterSlot, 80) || null, cleanText(body.clientVersion, 40) || 'unknown',
          cleanText(body.buildRevision, 80) || 'unknown', startedAt,
        )
        database.prepare('INSERT INTO events(kind, created_at, account_id, character_id, attempt_id) VALUES (?, ?, ?, ?, ?)').run('run_started', startedAt, session?.account_id ?? null, session?.selected_character_id ?? null, attemptId)
        return json(response, 201, { attemptId, reportToken, startedAt, attribution: session ? 'authenticated' : 'anonymous' }, cors)
      }

      const completionMatch = requestUrl.pathname.match(/^\/v2\/attempts\/([^/]+)\/complete$/)
      if (request.method === 'POST' && completionMatch) {
        if (!request.headers.origin || !origins.has(request.headers.origin)) return json(response, 403, { error: 'Origin is not allowed.' }, cors)
        if (!allowEvent(remoteAddress(request))) return json(response, 429, { error: 'Event rate limit reached.' }, cors)
        const body = await readJsonBody(request)
        const result = cleanText(body.result, 20)
        if (!RESULTS.has(result)) return json(response, 400, { error: 'Attempt result is invalid.' }, cors)
        const attempt = database.prepare('SELECT * FROM attempts WHERE id = ?').get(completionMatch[1])
        if (!attempt || !safeEqual(body.reportToken, attempt.report_token_hash)) return json(response, 404, { error: 'Attempt capability is invalid.' }, cors)
        if (attempt.completed_at) {
          if (attempt.result !== result) return json(response, 409, { error: 'Attempt already has a different outcome.' }, cors)
          return json(response, 200, { accepted: true, completedAt: attempt.completed_at, idempotent: true }, cors)
        }
        const completedAt = nowIso()
        const durationSeconds = Math.max(0, Math.min(Number(body.durationSeconds) || 0, 6 * 60 * 60))
        const reason = cleanText(body.reason, 500) || null
        const reasonCode = cleanText(body.reasonCode, 120) || (result === 'success' ? 'completed' : result)
        database.prepare('UPDATE attempts SET completed_at = ?, duration_seconds = ?, result = ?, reason_code = ?, reason = ? WHERE id = ?').run(completedAt, durationSeconds, result, reasonCode, reason, attempt.id)
        const kind = result === 'success' ? 'run_completed' : result === 'failure' ? 'run_failed' : 'run_exited'
        database.prepare('INSERT INTO events(kind, created_at, account_id, character_id, attempt_id) VALUES (?, ?, ?, ?, ?)').run(kind, completedAt, attempt.account_id, attempt.character_id, attempt.id)
        return json(response, 200, { accepted: true, completedAt }, cors)
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/statistics/summary') {
        const pageViews = database.prepare("SELECT COUNT(*) total FROM events WHERE kind = 'page_view'").get().total
        const attempts = database.prepare(`SELECT COUNT(*) started,
          SUM(CASE WHEN result IS NOT NULL THEN 1 ELSE 0 END) finished,
          SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) completed,
          SUM(CASE WHEN result = 'failure' THEN 1 ELSE 0 END) failed,
          SUM(CASE WHEN result = 'exit' THEN 1 ELSE 0 END) exited,
          SUM(CASE WHEN account_id IS NOT NULL THEN 1 ELSE 0 END) authenticated
          FROM attempts`).get()
        const modes = database.prepare('SELECT mode_id modeId, COUNT(*) started, SUM(CASE WHEN result = \'success\' THEN 1 ELSE 0 END) completed, SUM(CASE WHEN result = \'failure\' THEN 1 ELSE 0 END) failed FROM attempts GROUP BY mode_id ORDER BY mode_id').all()
        const encounters = database.prepare('SELECT encounter_id encounterId, MAX(encounter_name) encounterName, COUNT(*) started, SUM(CASE WHEN result = \'success\' THEN 1 ELSE 0 END) completed, SUM(CASE WHEN result = \'failure\' THEN 1 ELSE 0 END) failed FROM attempts GROUP BY encounter_id ORDER BY started DESC, encounterName').all()
        const recent = database.prepare(`SELECT
          SUM(CASE WHEN created_at >= datetime('now', '-7 days') AND kind = 'page_view' THEN 1 ELSE 0 END) pageViews7d,
          SUM(CASE WHEN created_at >= datetime('now', '-7 days') AND kind = 'run_started' THEN 1 ELSE 0 END) attempts7d
          FROM events`).get()
        return json(response, 200, { generatedAt: nowIso(), pageViews: Number(pageViews), ...Object.fromEntries(Object.entries(attempts).map(([key, value]) => [key, Number(value ?? 0)])), pageViews7d: Number(recent.pageViews7d ?? 0), attempts7d: Number(recent.attempts7d ?? 0), modes, encounters }, cors)
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/statistics/events') {
        const session = requireSession(request)
        if (!maintainerIds.has(String(session.provider_user_id))) return json(response, 403, { error: 'Maintainer access is required.' }, cors)
        const limit = Math.min(Math.max(Number(requestUrl.searchParams.get('limit')) || 50, 1), 200)
        const events = database.prepare(`
          SELECT e.id, e.kind, e.created_at createdAt, e.page,
            a.id attemptId, a.encounter_id encounterId, a.encounter_name encounterName,
            a.mode_id modeId, a.scenario_id scenarioId, a.difficulty, a.result,
            a.reason_code reasonCode, a.reason, a.duration_seconds durationSeconds,
            c.name characterName, c.realm_name realmName
          FROM events e
          LEFT JOIN attempts a ON a.id = e.attempt_id
          LEFT JOIN characters c ON c.id = e.character_id
          ORDER BY e.id DESC LIMIT ?
        `).all(limit)
        return json(response, 200, { events }, cors)
      }

      if (request.method === 'GET' && requestUrl.pathname === '/v2/internal/session') {
        const authorization = String(request.headers.authorization ?? '')
        const internalKey = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
        if (!safeEqual(internalKey, internalKeyHash)) return json(response, 401, { error: 'Internal key is required.' })
        const session = sessionForRequest(request)
        if (!session) return json(response, 200, { authenticated: false })
        return json(response, 200, {
          authenticated: true,
          accountId: session.account_id,
          region: session.provider_region,
          character: session.selected_character_id ? { name: session.character_name, realmName: session.realm_name, realmSlug: session.realm_slug } : null,
        })
      }

      return json(response, 404, { error: 'Not found.' }, cors)
    } catch (error) {
      const status = Number(error.statusCode) || 500
      if (status === 500) console.error(error)
      return json(response, status, { error: status === 500 ? 'Season 2 online service error.' : error.message }, cors)
    }
  })

  return { server, database, databasePath }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { server } = createOnlineServer()
  const host = process.env.MIDNIGHT_ONLINE_HOST ?? '127.0.0.1'
  const port = Number(process.env.MIDNIGHT_ONLINE_PORT ?? 8799)
  server.listen(port, host, () => console.log(`Midnight online listening on http://${host}:${port}`))
}
