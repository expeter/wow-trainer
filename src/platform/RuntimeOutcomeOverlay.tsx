import { useState } from 'react'

export default function RuntimeOutcomeOverlay({ resultKey, kind, reason, advice, onRetry, onExit }: {
  resultKey: string
  kind: 'wipe' | 'success'
  reason: string
  advice: string
  onRetry: () => void
  onExit: () => void
}) {
  const [dismissedKey, setDismissedKey] = useState<string>()
  if (dismissedKey === resultKey) return null
  return <section className={`runtime-outcome-card ${kind}`} role="dialog" aria-label={kind === 'wipe' ? 'Drill wipe summary' : 'Drill completion summary'}>
    <button type="button" className="runtime-outcome-dismiss" aria-label="Dismiss outcome summary" onClick={() => setDismissedKey(resultKey)}>−</button>
    <span>{kind === 'wipe' ? 'DRILL ENDED' : 'DRILL COMPLETE'}</span>
    <h2>{kind === 'wipe' ? 'Wiped due to:' : 'Resolved:'}</h2>
    <strong>{reason}</strong>
    <details><summary>Details</summary><p>{advice}</p></details>
    <div><button type="button" className="runtime-outcome-primary" onClick={onRetry}>Try again</button><button type="button" onClick={onExit}>Change setup</button></div>
  </section>
}
