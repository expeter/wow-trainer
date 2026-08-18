import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

function yamlString(value) {
  return JSON.stringify(String(value))
}

function markdown(report) {
  const context = Object.entries(report.context ?? {}).map(([key, value]) => `- ${key}: ${yamlString(value)}`).join('\n') || '- none'
  const attachments = report.attachments.map(item => `- [Open ${item.filename}](./${item.filename}) · original ${yamlString(item.originalName || item.filename)} · ${item.type} · ${item.bytes} bytes · sha256 ${item.sha256}`).join('\n') || '- none'
  return `---\nsource: guild-feedback\nid: ${yamlString(report.id)}\ncreated_at: ${yamlString(report.createdAt)}\nstatus: untriaged\n---\n\n# ${report.id}\n\n## Report\n\n${report.message}\n\n## Context\n\n${context}\n\n## Screenshots\n\n${attachments}\n`
}

async function downloadKey() {
  if (process.env.MIDNIGHT_FEEDBACK_DOWNLOAD_KEY) return process.env.MIDNIGHT_FEEDBACK_DOWNLOAD_KEY
  if (process.env.MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_FILE) return (await readFile(resolve(process.env.MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_FILE), 'utf8')).trim()
  throw new Error('Set MIDNIGHT_FEEDBACK_DOWNLOAD_KEY or MIDNIGHT_FEEDBACK_DOWNLOAD_KEY_FILE.')
}

async function apiFetch(url, key) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${key}` } })
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`
    try { detail = (await response.json()).error ?? detail } catch { /* Non-JSON proxy errors remain status text. */ }
    throw new Error(`Feedback download failed: ${detail}`)
  }
  return response
}

const apiUrl = (process.env.MIDNIGHT_FEEDBACK_API_URL ?? 'https://api.asgard.website').replace(/\/$/, '')
const outputDirectory = resolve(process.env.MIDNIGHT_FEEDBACK_OUTPUT ?? '.tmp/player-feedback')
const key = await downloadKey()
const response = await apiFetch(`${apiUrl}/v2/admin/feedback?limit=500`, key)
const { reports } = await response.json()

if (!Array.isArray(reports)) throw new Error('Feedback service returned an invalid report list.')
await mkdir(outputDirectory, { recursive: true })
let downloaded = 0
let existing = 0

for (const report of reports) {
  if (!/^FEEDBACK-\d{8}-\d{6}-[a-f0-9]{8}$/.test(report.id)) throw new Error(`Feedback service returned an invalid report ID: ${report.id}`)
  const reportDirectory = join(outputDirectory, report.id)
  try {
    await readFile(join(reportDirectory, 'report.md'))
    existing += 1
    continue
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const stagingDirectory = await mkdtemp(join(outputDirectory, `.incoming-${report.id}-`))
  try {
    for (const attachment of report.attachments) {
      if (!/^screenshot-[1-4]\.(png|jpg|webp)$/.test(attachment.filename)) throw new Error(`Unsafe attachment name in ${report.id}.`)
      const fileResponse = await apiFetch(`${apiUrl}/v2/admin/feedback/${encodeURIComponent(report.id)}/attachments/${encodeURIComponent(attachment.filename)}`, key)
      const bytes = Buffer.from(await fileResponse.arrayBuffer())
      const digest = createHash('sha256').update(bytes).digest('hex')
      if (bytes.length !== attachment.bytes || digest !== attachment.sha256) throw new Error(`Attachment integrity failed for ${report.id}/${attachment.filename}.`)
      await writeFile(join(stagingDirectory, attachment.filename), bytes, { flag: 'wx', mode: 0o600 })
    }
    await writeFile(join(stagingDirectory, 'report.md'), markdown(report), { flag: 'wx', mode: 0o600 })
    await rename(stagingDirectory, reportDirectory)
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true })
    throw error
  }
  downloaded += 1
}

console.log(`Guild feedback: ${downloaded} downloaded, ${existing} already present, ${reports.length} total.`)
