import { useEffect, useState, type ComponentType } from 'react'
import TrainingHud from './platform/TrainingHud'
import CreatorCard from './platform/CreatorCard'
import HudLayoutPreview from './platform/HudLayoutPreview'
import type { EncounterCatalogue } from './platform/encounters/discovery'
import { loadEncounterCatalogue, type EncounterMode, type EncounterRuntimeProps } from './platform/encounters'
import {
  DEFAULT_TRAINING_SETTINGS,
  keyLabel,
  loadTrainingSettings,
  saveTrainingSettings,
  type MovementAction,
  type TrainingAction,
  type TrainingSettings,
} from './platform/trainingSettings'
import { LEGACY_REFERENCE_QUERY, PRODUCT } from './product'
import './styles.css'
import './styles/tokens.css'
import './styles/season2.css'

const tabs = ['Game settings', 'Keys & Mouse', 'HUD', 'Tactical plan', 'Statistics', 'Profile'] as const
type SetupTab = typeof tabs[number]
const movementLabels: Record<MovementAction, string> = {
  forward: 'Forward',
  backward: 'Backward',
  left: 'Strafe left',
  right: 'Strafe right',
  turnLeft: 'Turn left',
  turnRight: 'Turn right',
}
const actionLabels = {
  mainAbility: 'Main ability',
  taunt: 'Taunt / Spott',
  healthPot: 'Health potion',
  shield: 'Shield',
} as const
const trainingLabels: Record<TrainingAction, string> = { ...movementLabels, ...actionLabels }

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
  const [settings, setSettings] = useState<TrainingSettings>(loadTrainingSettings)
  const [rebinding, setRebinding] = useState<TrainingAction>()
  const [runtimeLoading, setRuntimeLoading] = useState<EncounterMode>()
  const [runtime, setRuntime] = useState<{ mode: EncounterMode; scenarioId: string; Component: ComponentType<EncounterRuntimeProps> }>()
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

  useEffect(() => saveTrainingSettings(settings), [settings])

  useEffect(() => {
    if (!rebinding) return
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      const previousCode = settings.keyBindings[rebinding]
      const occupiedAction = (Object.keys(settings.keyBindings) as TrainingAction[])
        .find(action => action !== rebinding && settings.keyBindings[action] === event.code)
      setSettings(current => ({
        ...current,
        keyBindings: {
          ...current.keyBindings,
          [rebinding]: event.code,
          ...(occupiedAction ? { [occupiedAction]: previousCode } : {}),
        },
      }))
      setRebinding(undefined)
    }
    window.addEventListener('keydown', onKeyDown, { once: true })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [rebinding, settings.keyBindings])

  async function launch(mode: EncounterMode) {
    if (!encounter) return
    const scenario = (mode === 'learn2d' ? encounter.learn2d : encounter.train3d)
      .find(item => item.status === 'ready')
    if (!scenario) return
    setRuntimeLoading(mode)
    const module = await encounter.runtimeLoaders[mode]()
    setRuntime({ mode, scenarioId: scenario.id, Component: module.default })
    setRuntimeLoading(undefined)
  }

  async function launchContractRoom(mode: EncounterMode) {
    setRuntimeLoading(mode)
    const module = mode === 'learn2d'
      ? await import('./platform/learn2d/ContractRoom')
      : await import('./platform/train3d/ContractRoom')
    setRuntime({ mode, scenarioId: 'platform-contract-room', Component: module.default })
    setRuntimeLoading(undefined)
  }

  if (runtime) {
    const Runtime = runtime.Component
    return <Runtime
      scenarioId={runtime.scenarioId}
      keyBindings={settings.keyBindings}
      hudSettings={settings.hud}
      cameraSettings={settings.camera}
      onCameraSettingsChange={camera => setSettings(current => ({ ...current, camera }))}
      onExit={() => setRuntime(undefined)}
    />
  }

  return <main className="shell setup-shell season2-shell" id="setup-top">
    <aside className="season2-safety-note">Standalone workspace · public deployment disabled during extraction</aside>
    <div className="season2-hero-row">
      <header className="season2-hero">
        <p className="eyebrow">MIDNIGHT · SEASON 2 · RAID PRACTICE</p>
        <h1>{PRODUCT.name}</h1>
        <p className="lede">A reuse-first training platform for learning encounter plans in 2D and rehearsing movement in 3D.</p>
        <div className="season2-status" aria-label="Migration status">
          <span>Platform extraction</span>
          <strong>Entombed Sentinels first</strong>
          <small>Helical Toxins is the first playable Learn 2D and Train 3D slice.</small>
        </div>
      </header>
      <CreatorCard />
    </div>

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
        {encounter.manifest.availability} · {encounter.timingProfiles[0]?.status ?? 'timing pending'} · first drill ready
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
          <button type="button" disabled={!learn2dReady || Boolean(runtimeLoading)} onClick={() => void launch('learn2d')}>
            {runtimeLoading === 'learn2d' ? 'Loading…' : learn2dReady ? 'Launch Learn 2D' : 'Runtime pending'}
          </button>
        </article>
        <article>
          <span>02</span>
          <h3>Train 3D</h3>
          <p>Rehearse positioning and movement in an independent three-dimensional arena model using the same encounter terms.</p>
          <button type="button" disabled={!train3dReady || Boolean(runtimeLoading)} onClick={() => void launch('train3d')}>
            {runtimeLoading === 'train3d' ? 'Loading…' : train3dReady ? 'Launch Train 3D' : 'Runtime pending'}
          </button>
        </article>
        {import.meta.env.DEV && <article className="season2-contract-room-card">
          <span>DEV</span>
          <h3>Contract room</h3>
          <p>Exercise a full raid, seeded aura events, correct and incorrect ground reactions, movement, timing, spell primitives, and the shared HUD without adding another boss.</p>
          <div className="season2-contract-actions">
            <button type="button" disabled={Boolean(runtimeLoading)} onClick={() => void launchContractRoom('learn2d')}>Open Learn 2D room</button>
            <button type="button" disabled={Boolean(runtimeLoading)} onClick={() => void launchContractRoom('train3d')}>Open Train 3D room</button>
          </div>
        </article>}
      </div>}
      {activeTab === 'Keys & Mouse' && <div className="season2-settings-grid">
        {(Object.keys(settings.keyBindings) as TrainingAction[]).map(action => <div className="season2-keybind" key={action}>
          <span>{trainingLabels[action]}</span>
          <button type="button" aria-label={`Rebind ${action}, current ${keyLabel(settings.keyBindings[action])}`} className={rebinding === action ? 'listening' : ''} onClick={() => setRebinding(action)}>
            {rebinding === action ? 'Press a key…' : keyLabel(settings.keyBindings[action])}
          </button>
        </div>)}
        <button type="button" className="secondary season2-reset" onClick={() => setSettings(current => ({ ...current, keyBindings: { ...DEFAULT_TRAINING_SETTINGS.keyBindings } }))}>
          Reset movement keys
        </button>
        <div className="season2-camera-settings">
          <h3>Train 3D camera</h3>
          <label><input type="checkbox" checked={settings.camera.invertX} onChange={event => setSettings(current => ({ ...current, camera: { ...current.camera, invertX: event.target.checked } }))} /> Invert horizontal mouse-look</label>
          <label><input type="checkbox" checked={settings.camera.invertY} onChange={event => setSettings(current => ({ ...current, camera: { ...current.camera, invertY: event.target.checked } }))} /> Invert vertical mouse-look</label>
          <label className="season2-camera-sensitivity">Mouse-look speed <strong>{settings.camera.sensitivity.toFixed(1)}×</strong><input type="range" min="0.5" max="2" step="0.1" value={settings.camera.sensitivity} onChange={event => setSettings(current => ({ ...current, camera: { ...current.camera, sensitivity: Number(event.target.value) } }))} /></label>
        </div>
      </div>}
      {activeTab === 'HUD' && <div className="season2-hud-settings">
        <div className="season2-toggle-grid">
          {([
            ['showObjective', 'Show objective'],
            ['showTimer', 'Show timer'],
            ['showPosition', 'Show position'],
            ['showPlayer', 'Show player health + cooldowns'],
            ['showAuras', 'Show buff / debuff state'],
            ['showActions', 'Show action state'],
            ['showBoss', 'Show boss health'],
          ] as const).map(([key, label]) => <label key={key}>
            <input type="checkbox" checked={settings.hud[key]} onChange={event => setSettings(current => ({ ...current, hud: { ...current.hud, [key]: event.target.checked } }))} />
            {label}
          </label>)}
          <label className="season2-hud-scale">
            HUD scale <strong>{settings.hud.scale}%</strong>
            <input type="range" min="80" max="130" step="5" value={settings.hud.scale} onChange={event => setSettings(current => ({ ...current, hud: { ...current.hud, scale: Number(event.target.value) } }))} />
          </label>
        </div>
        <div className="season2-hud-preview"><TrainingHud settings={settings.hud} mode="Train 3D" objective="Reach the matching toxin partner" secondsRemaining={18.4} position={{ x: -12.5, z: -7.2 }} status="HUD preview" playerHealth={72} bossHealth={86} auraLabel="Poison · 3 stacks" actionStatus="Main ready · Shield 8.4s" /><HudLayoutPreview settings={settings.hud} onChange={hud => setSettings(current => ({ ...current, hud }))} /></div>
      </div>}
      {activeTab === 'Tactical plan' && encounter && <div className="season2-plan-preview">
        <p className="season2-boundary-note">The package-owned abstract regions are available for the first drill. Raid-plan imagery and editable roster assignments will follow the evidence you provide through the inbox.</p>
        <div className="season2-region-list">
          {encounter.learn2d[0]?.arena.regions.map(region => <span key={region.id}>{region.label}</span>)}
        </div>
      </div>}
      {(activeTab === 'Statistics' || activeTab === 'Profile') && <p className="season2-boundary-note">This shell boundary remains intentionally offline until the API /v2 milestone.</p>}
    </section>

    <footer className="season2-footer">
      <a href={PRODUCT.repositoryUrl}>Project repository</a>
      {import.meta.env.DEV && <a href={`?${LEGACY_REFERENCE_QUERY}`}>Open development-only L’ura v0.9.1 reference</a>}
      <span>{PRODUCT.shortId} · planned host {PRODUCT.plannedHostname}</span>
    </footer>
  </main>
}
