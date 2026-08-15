import { useState } from 'react'

export interface RuntimeFailure {
  id: string
  code: string
  time: number
  label: string
  advice: string
}

export default function RuntimeFeedback({ failures, elapsed, points = null }: {
  failures: readonly RuntimeFailure[]
  elapsed: number
  points?: number | null
}) {
  const [helpId, setHelpId] = useState<string>()
  const [copied, setCopied] = useState(false)

  async function copyFailures() {
    const text = failures.length
      ? failures.slice(0, 5).map(failure => `${failure.time.toFixed(1)}s · ${failure.code} · ${failure.label}`).join('\n')
      : 'No failures yet.'
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return <>
    <aside className="runtime-failure-log" aria-label="Recent failures">
      <header><span>RECENT FAILURES</span><span className="runtime-failure-actions"><time>{elapsed.toFixed(1)}s</time><button type="button" aria-label={copied ? 'Failure log copied' : 'Copy failure log'} title="Copy failure log" onClick={() => void copyFailures()}>{copied ? '✓' : '⧉'}</button></span></header>
      {failures.length ? <ol>{failures.slice(0, 5).map(failure => <li key={failure.id}>
        <time>{failure.time.toFixed(1)}s</time>
        <span>{failure.label}</span>
        <button type="button" className="runtime-failure-help" aria-label={`Help for ${failure.label}`} aria-expanded={helpId === failure.id} onClick={() => setHelpId(current => current === failure.id ? undefined : failure.id)}>i</button>
        {helpId === failure.id && <small className="runtime-failure-advice" role="status">{failure.advice}</small>}
      </li>)}</ol> : <p>No failures yet.</p>}
    </aside>
    <aside className="runtime-points" aria-label="Points">
      <span>POINTS</span>
      <strong>{points === null ? '—' : Math.round(points)}</strong>
      {points === null && <small>Not scored</small>}
    </aside>
  </>
}
