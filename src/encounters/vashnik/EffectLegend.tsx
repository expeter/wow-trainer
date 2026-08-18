import type { VashnikState } from './simulation'

export default function VashnikEffectLegend({ state }: { state: VashnikState }) {
  const active = state.infection
    ? state.infection.kind === 'siphoning'
      ? { tone: 'soak', label: 'Rose circle', action: 'Stack in the assigned support camp.' }
      : state.infection.kind === 'stygian'
        ? { tone: 'danger', label: 'Purple circle', action: 'Keep moving; leave each burst behind.' }
        : { tone: 'danger', label: 'Orange circle', action: 'Take it alone to an outer lane.' }
    : state.bilePositions.length > 0
      ? { tone: 'soak', label: 'Green circle', action: 'Stand in your highlighted Bile.' }
      : state.tumors.some(tumor => !tumor.resolved)
        ? { tone: 'objective', label: 'Pale target', action: 'Line a cardinal wave through the Tumor.' }
        : undefined

  return <aside className="vashnik-effect-legend" aria-label="Vashnik circle and lane meanings">
    <p><i className="path" /><strong>Fountain lanes</strong><span>Colored edge rings spawn matching adds. Kill them before the green cavity.</span></p>
    {active && <p><i className={active.tone} /><strong>{active.label}</strong><span>{active.action}</span></p>}
  </aside>
}
