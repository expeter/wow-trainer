import { useEffect } from 'react'
import type { EncounterPackageV1 } from './encounters'

export function wowheadSpellSearch(spellName: string) {
  return `https://www.wowhead.com/ptr/search?q=${encodeURIComponent(spellName)}`
}

export default function EncounterInfo({ encounter, onClose }: { encounter: EncounterPackageV1; onClose: () => void }) {
  const tacticalScenario = encounter.learn2d.find(scenario => scenario.kind === 'full-fight' && scenario.status === 'ready')
    ?? encounter.learn2d.find(scenario => scenario.status === 'ready')
  const tacticalSteps = tacticalScenario?.steps ?? []
  const scenarioAbilities = tacticalScenario?.abilityIds.map(id => encounter.abilities.find(ability => ability.id === id)).filter(ability => ability !== undefined) ?? []
  const stepsMatchAbilities = tacticalSteps.length > 0 && tacticalSteps.length === scenarioAbilities.length
  const hasMaintainedTactics = tacticalSteps.length > 0 || encounter.phases.length > 0
  const rolesById = new Map(encounter.roles.map(role => [role.id, role]))

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
        {tacticalSteps.length > 0 && <section aria-labelledby="encounter-info-tactics">
          <h3 id="encounter-info-tactics">What to do</h3>
          <ol className="encounter-info-tactics">{tacticalSteps.map((instruction, index) => <li key={`${index}-${instruction}`}>
            <strong>{stepsMatchAbilities ? scenarioAbilities[index]?.name : `Fight step ${index + 1}`}</strong>
            <span>{instruction}</span>
          </li>)}</ol>
        </section>}
        {encounter.phases.length > 0 && <section aria-labelledby="encounter-info-flow">
          <h3 id="encounter-info-flow">Fight flow and responsibilities</h3>
          <ol className="encounter-info-phases">{encounter.phases.map(phase => <li key={phase.id}>
            <strong>{phase.name}</strong>
            <span>{phase.description}</span>
            <div className="encounter-info-phase-roles">{phase.roleResponsibilities.map(entry => {
              const role = rolesById.get(entry.roleId)
              return <article key={entry.roleId}><strong>{role?.label ?? entry.roleId}</strong><ul>{entry.responsibilities.map(responsibility => <li key={responsibility}>{responsibility}</li>)}</ul></article>
            })}</div>
          </li>)}</ol>
        </section>}
        {encounter.abilities.length > 0 && <details className="encounter-info-reference">
          <summary>Spell reference · {encounter.abilities.length}</summary>
          <p>Technical spell descriptions are secondary to the instructions above.</p>
          <dl>{encounter.abilities.map(ability => <div key={ability.id} data-severity={ability.severity}><dt>{ability.name}<a href={wowheadSpellSearch(ability.name)} target="_blank" rel="noreferrer" aria-label={`${ability.name} on Wowhead`}>Wowhead ↗</a></dt><dd>{ability.description}</dd></div>)}</dl>
        </details>}
      </div>}
    </section>
  </div>
}
