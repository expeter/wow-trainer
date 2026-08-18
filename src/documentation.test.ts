import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('maintained project documentation', () => {
  it('keeps operating guidance in active documentation instead of handoff snapshots', () => {
    expect(existsSync(resolve(process.cwd(), 'docs/maintainer-handoff.md'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'docs/leaderboard-api-handoff.md'))).toBe(false)

    const activeDocumentation = [
      read('AGENTS.md'),
      read('README.md'),
      read('docs/README.md'),
      read('docs/specifications.md'),
      read('docs/milestones.md'),
    ].join('\n')
    expect(activeDocumentation).not.toContain('maintainer-handoff.md')
    expect(activeDocumentation).not.toContain('leaderboard-api-handoff.md')
  })

  it('separates the inherited baseline from the Season 2 release candidate', () => {
    expect(read('docs/milestones.md')).toContain('L’ura v0.9.1 source')
    expect(read('docs/milestones.md')).toContain('v0.10.0')
  })

  it('groups every open request into a delivery milestone', () => {
    const requestLog = read('docs/README.md')
    const milestones = read('docs/milestones.md')
    const openTickets = [...requestLog.matchAll(
      /\| `((?:FR|CR|BUG|SPEC)-\d+)` \| (?:Planned|In progress|Backlog[^|]*|Deferred) \|/g,
    )].map(match => match[1])

    expect(openTickets.length).toBeGreaterThan(0)
    for (const ticket of openTickets) {
      expect(
        milestones.match(new RegExp(`^(?:-|\\d+\\.) \\\`${ticket}\\\``, 'gm')) ?? [],
        `${ticket} must appear in exactly one milestone`,
      ).toHaveLength(1)
    }
  })

  it('keeps released Phase 1 work out of the localhost-preview status', () => {
    expect(read('docs/README.md')).not.toMatch(/\| Implemented behind localhost preview \|/)
  })

  it('records every stable specification in the request ledger', () => {
    const specifications = read('docs/specifications.md')
    const requestLog = read('docs/README.md')
    const ids = [...specifications.matchAll(/^## (SPEC-\d+) ·/gm)].map(match => match[1])

    for (const id of ids) expect(requestLog).toContain(`\`${id}\``)
  })

  it('keeps publication isolated from inherited services and domains', () => {
    const workflow = read('.github/workflows/pages.yml')
    expect(workflow).toContain('actions/deploy-pages')
    expect(workflow).toContain('pages: write')
    expect(workflow).not.toContain('lura.asgard.website')
    expect(workflow).not.toContain('api.asgard.website')
    expect(existsSync(resolve(process.cwd(), 'api'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), '.github/workflows/api.yml'))).toBe(false)
  })

  it('wires the global project inbox into the Season 2 ticket workflow', () => {
    const packageJson = JSON.parse(read('package.json'))
    const inboxConfig = JSON.parse(read('.project-inbox.json'))

    expect(packageJson.scripts.dev).toBe('node scripts/dev.mjs')
    expect(read('scripts/dev.mjs')).toContain("start('dev:inbox')")
    expect(read('scripts/dev.mjs')).toContain("start('dev:trainer')")
    expect(packageJson.scripts['dev:inbox']).toContain('$HOME/.codex/skills/project-inbox/scripts/project-inbox.mjs')
    expect(packageJson.scripts['dev:inbox']).toContain('serve --root .')
    expect(packageJson.scripts.inbox).toContain('serve --root .')
    expect(packageJson.scripts['inbox:list']).toContain('$HOME/.codex/skills/project-inbox/scripts/project-inbox.mjs')
    expect(packageJson.scripts['dev:trainer']).toBe('vite')
    expect(read('vite.config.ts')).not.toContain('feedbackInboxPlugin')
    expect(existsSync(resolve(process.cwd(), 'tools/feedbackInboxPlugin.ts'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'tools/feedbackInboxPlugin.test.ts'))).toBe(false)
    expect(inboxConfig.projectName).toBe('Midnight Season 2 Trainer')
    expect(inboxConfig.inboxDir).toBe('inbox')
    expect(inboxConfig.workflow.label).toContain('FR/CR/BUG')
    expect(inboxConfig.workflow.instructions).toContain('docs/README.md')
    expect(inboxConfig.workflow.instructions).toContain('Processing remains explicit')
  })

  it('keeps the original trainer acknowledgement in repository documentation only', () => {
    expect(read('README.md')).toContain('## Project lineage')
    expect(read('README.md')).toContain('[L’ura Trainer](https://lura.asgard.website)')
    expect(read('README.md')).toContain('wow-midnight-fall-lura-trainer')
    expect(read('src/Season2App.tsx')).not.toContain('https://lura.asgard.website')
  })

  it('catalogues supplied future raid plans without authorizing their runtimes', () => {
    const evidence = read('docs/raid-plan-evidence.md')
    for (const asset of ['the-coiled-altar.png', 'the-twin-fangs.png', 'ulatek.png']) {
      expect(existsSync(resolve(process.cwd(), `inbox/${asset}`))).toBe(true)
      expect(evidence).toContain(asset)
    }
    expect(evidence).toContain('Catalogue only')
    expect(evidence).toContain('do not establish collision coordinates')
  })

  it('keeps measured performance budgets and the Lost Explorers contract durable', () => {
    expect(read('docs/performance-baseline.md')).toContain('npm run measure:build')
    expect(read('docs/lost-explorers-encounter.md')).toContain('authoritative trainer contract')
    expect(read('docs/specifications.md')).toContain('SPEC-027 · Train 3D vertical movement')
  })
})
