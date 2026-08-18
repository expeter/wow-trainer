import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'
import { ONLINE_API_URL } from './OnlineContext'

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'development'
const GIT_REVISION = typeof __GIT_REVISION__ === 'string' ? __GIT_REVISION__ : 'unknown'

interface AttemptMetadata {
  encounterId: string
  encounterName: string
  modeId: 'learn2d' | 'train3d'
  scenarioId: string
  scenarioKind: 'focused' | 'full-fight'
  difficulty: string
  timingProfileId?: string
  tacticCategory?: string
}

interface AttemptCapability {
  attemptId: string
  reportToken: string
  startedAt: string
  startedPerformance: number
  completed: boolean
}

interface AttemptReporter {
  start: (details?: { roleId?: string; rosterSlot?: string }) => void
  complete: (result: 'success' | 'failure', reasonCode: string, reason: string) => void
  exit: () => void
}

const noop = () => {}
const AttemptReportingContext = createContext<AttemptReporter>({ start: noop, complete: noop, exit: noop })

async function post(path: string, body: unknown) {
  const response = await fetch(`${ONLINE_API_URL}${path}`, {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('Attempt reporting failed.')
  return response.json()
}

export function AttemptReportingProvider({ metadata, children }: { metadata: AttemptMetadata; children: ReactNode }) {
  const capability = useRef<AttemptCapability | undefined>(undefined)
  const pendingOutcome = useRef<{ result: 'success' | 'failure' | 'exit'; reasonCode: string; reason: string } | undefined>(undefined)

  const sendOutcome = useCallback(async (active: AttemptCapability, outcome: { result: 'success' | 'failure' | 'exit'; reasonCode: string; reason: string }) => {
    if (active.completed) return
    active.completed = true
    await post(`/v2/attempts/${encodeURIComponent(active.attemptId)}/complete`, {
      reportToken: active.reportToken,
      result: outcome.result,
      reasonCode: outcome.reasonCode,
      reason: outcome.reason,
      durationSeconds: Math.max(0, (performance.now() - active.startedPerformance) / 1000),
    }).catch(() => {})
  }, [])

  const start = useCallback((details: { roleId?: string; rosterSlot?: string } = {}) => {
    if (capability.current && !capability.current.completed) return
    capability.current = undefined
    pendingOutcome.current = undefined
    const startedPerformance = performance.now()
    void post('/v2/attempts', {
      trainerId: 'midnight-season-2', seasonId: 'midnight-s2', ...metadata,
      roleId: details.roleId, rosterSlot: details.rosterSlot,
      clientVersion: APP_VERSION, buildRevision: GIT_REVISION,
    }).then((issued: { attemptId: string; reportToken: string; startedAt: string }) => {
      const active = { ...issued, startedPerformance, completed: false }
      capability.current = active
      const pending = pendingOutcome.current
      if (pending) void sendOutcome(active, pending)
    }).catch(() => {})
  }, [metadata, sendOutcome])

  const report = useCallback((result: 'success' | 'failure' | 'exit', reasonCode: string, reason: string) => {
    const outcome = { result, reasonCode, reason }
    const active = capability.current
    if (active) void sendOutcome(active, outcome)
    else pendingOutcome.current = outcome
  }, [sendOutcome])

  const value = useMemo<AttemptReporter>(() => ({
    start,
    complete: (result, reasonCode, reason) => report(result, reasonCode, reason),
    exit: () => report('exit', 'change-setup', 'Player changed setup'),
  }), [start, report])

  return <AttemptReportingContext.Provider value={value}>{children}</AttemptReportingContext.Provider>
}

export function useAttemptReporting() { return useContext(AttemptReportingContext) }

export function stableReasonCode(reason: string) {
  return reason.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'failure'
}
