import { useCallback, useEffect, useState } from 'react'
import EncounterIcon from '../EncounterIcon'
import type { EncounterPackageV1 } from '../encounters'
import { ONLINE_API_URL, useOnline } from './OnlineContext'

interface Summary {
  generatedAt: string
  pageViews: number
  pageViews7d: number
  attempts7d: number
  started: number
  finished: number
  completed: number
  failed: number
  exited: number
  authenticated: number
  modes: Array<{ modeId: string; started: number; completed: number; failed: number }>
  encounters: Array<{ encounterId: string; encounterName: string; started: number; completed: number; failed: number }>
}

interface RecentEvent {
  id: number
  kind: string
  createdAt: string
  page?: string
  encounterId?: string
  encounterName?: string
  modeId?: string
  difficulty?: string
  reason?: string
  durationSeconds?: number
  characterName?: string
  realmName?: string
}

async function getJson(path: string) {
  const response = await fetch(`${ONLINE_API_URL}${path}`, { credentials: 'include' })
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'Statistics are unavailable.')
  return body
}

function eventLabel(event: RecentEvent) {
  if (event.kind === 'page_view') return 'Opened the trainer'
  if (event.kind === 'run_started') return 'Started a run'
  if (event.kind === 'run_completed') return 'Completed the fight'
  if (event.kind === 'run_failed') return event.reason ? `Wiped: ${event.reason}` : 'Run wiped'
  return 'Changed setup'
}

export default function StatisticsPanel({ encounters }: { encounters: readonly EncounterPackageV1[] }) {
  const { session } = useOnline()
  const [summary, setSummary] = useState<Summary>()
  const [events, setEvents] = useState<RecentEvent[]>([])
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    try {
      const next = await getJson('/v2/statistics/summary') as unknown as Summary
      setSummary(next)
      if (session.isMaintainer) setEvents(((await getJson('/v2/statistics/events?limit=60')) as unknown as { events: RecentEvent[] }).events)
      else setEvents([])
      setNotice('')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Statistics are unavailable.') }
  }, [session.isMaintainer])
  useEffect(() => { void load() }, [load])

  if (!summary) return <p className="season2-boundary-note">{notice || 'Loading play statistics…'}</p>
  const rate = summary.finished ? Math.round(summary.completed / summary.finished * 100) : 0
  const encounterById = new Map(encounters.map(encounter => [encounter.manifest.id, encounter]))
  return <div className="statistics-dashboard">
    <div className="statistics-summary" aria-label="Usage totals">
      <article><span>Page views</span><strong>{summary.pageViews}</strong><small>{summary.pageViews7d} in the last 7 days</small></article>
      <article><span>Runs started</span><strong>{summary.started}</strong><small>{summary.attempts7d} in the last 7 days</small></article>
      <article><span>Completed</span><strong>{summary.completed}</strong><small>{rate}% of finished runs</small></article>
      <article><span>Wipes</span><strong>{summary.failed}</strong><small>{summary.exited} explicit exits</small></article>
    </div>
    <section className="statistics-section"><header><div><p className="eyebrow">MODE SPLIT</p><h3>2D and 3D activity</h3></div><button type="button" className="secondary" onClick={() => void load()}>Refresh</button></header><div className="statistics-mode-grid">{summary.modes.map(mode => <article key={mode.modeId}><strong>{mode.modeId === 'learn2d' ? 'Learn 2D' : 'Train 3D'}</strong><span>{mode.started} starts</span><small>{mode.completed} completions · {mode.failed} wipes</small></article>)}</div></section>
    <section className="statistics-section"><header><div><p className="eyebrow">BOSSES</p><h3>Encounter activity</h3></div></header><div className="statistics-boss-grid">{summary.encounters.map(row => { const encounter = encounterById.get(row.encounterId); const name = encounter?.manifest.name ?? row.encounterName; return <article key={row.encounterId}><EncounterIcon name={name} /><div><strong>{name}</strong><span>{row.started} starts</span><small>{row.completed} completions · {row.failed} wipes</small></div></article> })}{!summary.encounters.length && <p>No boss runs have been reported yet.</p>}</div></section>
    {session.isMaintainer && <section className="statistics-section private-events"><header><div><p className="eyebrow">PRIVATE · MAINTAINER</p><h3>Recent event queue</h3></div></header><ol>{events.map(event => { const encounter = event.encounterId ? encounterById.get(event.encounterId) : undefined; const name = encounter?.manifest.name ?? event.encounterName; return <li key={event.id}>{name ? <EncounterIcon name={name} /> : <span className="statistics-page-event">↗</span>}<div><strong>{eventLabel(event)}</strong><span>{name ?? 'Trainer'}{event.modeId ? ` · ${event.modeId === 'learn2d' ? '2D' : '3D'}` : ''}{event.difficulty ? ` · ${event.difficulty}` : ''}</span><small>{event.characterName ? `${event.characterName} · ${event.realmName}` : 'Anonymous'} · {new Date(event.createdAt).toLocaleString()}</small></div></li> })}{!events.length && <li>No events yet.</li>}</ol></section>}
    <p className="statistics-footnote">Anonymous totals count events and attempts, not unique players. Anonymous telemetry stores no durable browser, device, account, IP, or user-agent identity.</p>
  </div>
}
