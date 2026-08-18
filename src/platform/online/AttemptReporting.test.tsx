import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useContractPullGate } from '../ContractPullGate'
import RuntimeOutcomeOverlay from '../RuntimeOutcomeOverlay'
import { AttemptReportingProvider } from './AttemptReporting'

const metadata = {
  encounterId: 'sszorak', encounterName: 'Sszorak', modeId: 'train3d' as const,
  scenarioId: 'sszorak-full-fight', scenarioKind: 'full-fight' as const,
  difficulty: 'normal', timingProfileId: 'pre-live',
}

function ReportingHarness() {
  const gate = useContractPullGate()
  return <>
    <button type="button" onClick={gate.start}>Start pull</button>
    {gate.phase === 'active' && <RuntimeOutcomeOverlay resultKey="result-1" kind="wipe" reason="Knocked from the platform" reasonCode="edge-knock" advice="Counter the final wind." onRetry={gate.restart} onExit={() => {}} />}
  </>
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('attempt reporting boundary', () => {
  it('starts when the pull countdown begins and sends the terminal shared outcome with stable boss/mode facts', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      const url = String(input)
      if (url.endsWith('/v2/attempts')) return new Response(JSON.stringify({ attemptId: 'ATTEMPT-1', reportToken: 'report-token', startedAt: '2026-08-18T12:00:00.000Z' }), { status: 201 })
      if (url.endsWith('/complete')) return new Response(JSON.stringify({ accepted: true }), { status: 200 })
      return new Response('{}', { status: 404 })
    })

    render(<AttemptReportingProvider metadata={metadata}><ReportingHarness /></AttemptReportingProvider>)
    screen.getByRole('button', { name: 'Start pull' }).click()
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(3100) })
    await act(async () => { await Promise.resolve(); await Promise.resolve() })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const startBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(startBody).toMatchObject({ encounterId: 'sszorak', encounterName: 'Sszorak', modeId: 'train3d', scenarioId: 'sszorak-full-fight', difficulty: 'normal' })
    expect(startBody.roleId).toBeTruthy()
    const outcomeBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
    expect(outcomeBody).toMatchObject({ reportToken: 'report-token', result: 'failure', reasonCode: 'edge-knock', reason: 'Knocked from the platform' })
  })
})
