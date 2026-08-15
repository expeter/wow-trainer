import { useEffect, useState } from 'react'
import type { EncounterCatalogue } from './platform/encounters/discovery'
import { loadEncounterCatalogue } from './platform/encounters'
import { LEGACY_REFERENCE_QUERY, PRODUCT } from './product'
import './styles.css'
import './styles/tokens.css'
import './styles/season2.css'

const tabs = ['Game settings', 'Keys & Mouse', 'HUD', 'Tactical plan', 'Statistics', 'Profile'] as const
type SetupTab = typeof tabs[number]

const panelCopy: Record<SetupTab, { eyebrow: string; title: string; body: string }> = {
  'Game settings': {
    eyebrow: 'TRAINING CONFIGURATION',
    title: 'Choose how you want to learn',
    body: 'Learn 2D and Train 3D use the same encounter vocabulary, while their simulations and arena geometry remain independent.',
  },
  'Keys & Mouse': {
    eyebrow: 'CONTROLS',
    title: 'Familiar inputs, package-owned actions',
    body: 'The reviewed keyboard, mouse, camera, and rebinding patterns will be extracted here without coupling either runtime to the L’ura simulation.',
  },
  HUD: {
    eyebrow: 'HUD',
    title: 'Shared language, runtime-specific state',
    body: 'Callouts, timers, assignments, and accessibility preferences belong to the shell. Each runtime supplies only the state it owns.',
  },
  'Tactical plan': {
    eyebrow: 'TACTICAL PLANNER',
    title: 'One encounter package, two arena projections',
    body: 'Planning data will come from EncounterPackageV1. Learn 2D and Train 3D will render it through separate arena models.',
  },
  Statistics: {
    eyebrow: 'LATER MILESTONE',
    title: 'Statistics are intentionally offline',
    body: 'API /v2, public statistics, achievements, and rankings are deferred until the offline trainer and Entombed Sentinels are stable.',
  },
  Profile: {
    eyebrow: 'LATER MILESTONE',
    title: 'Profiles are not connected yet',
    body: 'The Season 2 shell does not contact the inherited L’ura /v1 service. Identity and account work will begin with the API /v2 milestone.',
  },
}

export default function Season2App() {
  const [activeTab, setActiveTab] = useState<SetupTab>('Game settings')
  const [catalogue, setCatalogue] = useState<EncounterCatalogue>()
  const panel = panelCopy[activeTab]
  const encounter = catalogue?.packages[0]
  const catalogueFailed = catalogue && !encounter
  const learn2dReady = encounter?.learn2d.some(scenario => scenario.status === 'ready') ?? false
  const train3dReady = encounter?.train3d.some(scenario => scenario.status === 'ready') ?? false

  useEffect(() => {
    let active = true
    loadEncounterCatalogue().then(result => {
      if (active) setCatalogue(result)
    })
    return () => { active = false }
  }, [])

  return <main className="shell setup-shell season2-shell" id="setup-top">
    <aside className="season2-safety-note">Standalone workspace · public deployment disabled during extraction</aside>
    <header className="season2-hero">
      <p className="eyebrow">MIDNIGHT · SEASON 2 · RAID PRACTICE</p>
      <h1>{PRODUCT.name}</h1>
      <p className="lede">A reuse-first training platform for learning encounter plans in 2D and rehearsing movement in 3D.</p>
      <div className="season2-status" aria-label="Migration status">
        <span>Platform extraction</span>
        <strong>Entombed Sentinels first</strong>
        <small>No encounter runtime is launchable in this bootstrap slice.</small>
      </div>
    </header>

    <section className="season2-encounter" aria-labelledby="encounter-catalog-title">
      <div>
        <p className="eyebrow">ENCOUNTER CATALOG</p>
        <h2 id="encounter-catalog-title">
          {encounter?.manifest.name ?? (catalogueFailed ? 'No conforming encounter package' : 'Discovering encounter packages…')}
        </h2>
        <p>{encounter?.manifest.summary ?? (catalogueFailed
          ? 'The catalogue excluded every package. Check development diagnostics before continuing.'
          : 'Loading validated package metadata from isolated encounter directories.')}</p>
      </div>
      {encounter && <span className="season2-badge">
        {encounter.manifest.availability} · {encounter.timingProfiles[0]?.status ?? 'timing pending'} · runtimes pending
      </span>}
    </section>

    {import.meta.env.DEV && Boolean(catalogue?.diagnostics.length) && <aside className="season2-catalogue-diagnostics">
      <strong>Encounter package diagnostics</strong>
      {catalogue?.diagnostics.map(diagnostic => <p key={diagnostic.source}>
        {diagnostic.source}: {diagnostic.errors.join(' ')}
      </p>)}
    </aside>}

    <nav className="setup-tabs" aria-label="Setup sections">
      {tabs.map(tab => <button
        type="button"
        key={tab}
        className={activeTab === tab ? 'selected' : ''}
        aria-current={activeTab === tab ? 'page' : undefined}
        onClick={() => setActiveTab(tab)}
      >{tab}</button>)}
    </nav>

    <section className="setup-tab-panel season2-panel" aria-label={activeTab}>
      <div className="plan-heading setup-section-heading">
        <p className="eyebrow">{panel.eyebrow}</p>
        <h2>{panel.title}</h2>
        <p className="hint">{panel.body}</p>
      </div>
      {activeTab === 'Game settings' && <div className="season2-mode-grid">
        <article>
          <span>01</span>
          <h3>Learn 2D</h3>
          <p>Study mechanic order, assignments, timing, and tactical diagrams in a dedicated two-dimensional runtime.</p>
          <button type="button" disabled={!learn2dReady}>{learn2dReady ? 'Launch Learn 2D' : 'Runtime pending'}</button>
        </article>
        <article>
          <span>02</span>
          <h3>Train 3D</h3>
          <p>Rehearse positioning and movement in an independent three-dimensional arena model using the same encounter terms.</p>
          <button type="button" disabled={!train3dReady}>{train3dReady ? 'Launch Train 3D' : 'Runtime pending'}</button>
        </article>
      </div>}
      {activeTab !== 'Game settings' && <p className="season2-boundary-note">This shell boundary is reserved; implementation follows EncounterPackageV1 and the Entombed Sentinels package.</p>}
    </section>

    <footer className="season2-footer">
      <a href={PRODUCT.repositoryUrl}>Project repository</a>
      {import.meta.env.DEV && <a href={`?${LEGACY_REFERENCE_QUERY}`}>Open development-only L’ura v0.9.1 reference</a>}
      <span>{PRODUCT.shortId} · planned host {PRODUCT.plannedHostname}</span>
    </footer>
  </main>
}
