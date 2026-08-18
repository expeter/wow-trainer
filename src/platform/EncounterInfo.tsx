import { useEffect } from 'react'
import type { EncounterPackageV1 } from './encounters'

export default function EncounterInfo({ encounter, onClose }: { encounter: EncounterPackageV1; onClose: () => void }) {
  const hasMaintainedTactics = encounter.phases.length > 0 || encounter.abilities.length > 0 || encounter.roles.length > 0

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return <div className="encounter-info-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="encounter-info-dialog" role="dialog" aria-modal="true" aria-labelledby="encounter-info-title">
      <button type="button" className="encounter-info-close" aria-label="Close tactic breakdown" onClick={onClose}>×</button>
      <p className="eyebrow">FIGHT TACTICS · {encounter.manifest.availability.replace('-', ' ')}</p>
      <h2 id="encounter-info-title">{encounter.manifest.name}</h2>
      <p className="encounter-info-summary">{encounter.manifest.summary}</p>
      {!hasMaintainedTactics ? <div className="encounter-info-unavailable">
        <strong>No maintained tactic breakdown yet.</strong>
        <p>This encounter remains research-only. The arena reference is catalogued, but mechanics and role responsibilities will stay unavailable until reliable encounter evidence exists.</p>
      </div> : <div className="encounter-info-sections">
        {encounter.phases.length > 0 && <section aria-labelledby="encounter-info-flow">
          <h3 id="encounter-info-flow">Fight flow</h3>
          <ol>{encounter.phases.map(phase => <li key={phase.id}><strong>{phase.name}</strong><span>{phase.description}</span></li>)}</ol>
        </section>}
        {encounter.abilities.length > 0 && <section aria-labelledby="encounter-info-mechanics">
          <h3 id="encounter-info-mechanics">Key mechanics</h3>
          <dl>{encounter.abilities.map(ability => <div key={ability.id} data-severity={ability.severity}><dt>{ability.name}</dt><dd>{ability.description}</dd></div>)}</dl>
        </section>}
        {encounter.roles.length > 0 && <section aria-labelledby="encounter-info-roles">
          <h3 id="encounter-info-roles">Role responsibilities</h3>
          <div className="encounter-info-roles">{encounter.roles.map(role => <article key={role.id}><strong>{role.label}</strong><ul>{role.responsibilities.map(responsibility => <li key={responsibility}>{responsibility}</li>)}</ul></article>)}</div>
        </section>}
      </div>}
    </section>
  </div>
}
