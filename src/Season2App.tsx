import { useCallback, useEffect, useState, type ComponentType, type SetStateAction } from 'react'
import BuildStatus from './platform/BuildStatus'
import CreatorCard from './platform/CreatorCard'
import { contractRoomActions } from './platform/contractActions'
import EncounterIcon from './platform/EncounterIcon'
import HudLayoutPreview from './platform/HudLayoutPreview'
import type { EncounterCatalogue } from './platform/encounters/discovery'
import { bindEncounterActions, loadEncounterCatalogue, type EncounterActionDefinition, type EncounterMode, type EncounterPackageV1, type EncounterRuntimeProps } from './platform/encounters'
import {
  DEFAULT_TRAINING_SETTINGS,
  assignTrainingKeyBinding,
  keyLabel,
  loadTrainingSettings,
  runtimeKeyBindings,
  saveTrainingSettings,
  type Learn2DMovementAction,
  type MovementAction,
  type SharedTrainingAction,
  type TrainingBindingScope,
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
  pause: 'Pause / resume',
  mainAbility: 'Main ability',
  taunt: 'Taunt / Spott',
  healthPot: 'Health potion',
  shield: 'Shield',
  dispel: 'Dispel',
  interrupt: 'Interrupt',
} as const
const trainingLabels: Record<TrainingAction, string> = { ...movementLabels, ...actionLabels }
const learn2dMovementActions: Learn2DMovementAction[] = ['forward', 'backward', 'left', 'right']
const train3dMovementActions: MovementAction[] = ['forward', 'backward', 'left', 'right', 'turnLeft', 'turnRight']
const sharedActions: SharedTrainingAction[] = ['pause', 'mainAbility', 'taunt', 'healthPot', 'shield', 'dispel', 'interrupt']
type Rebinding = { scope: TrainingBindingScope; action: TrainingAction }

const panelCopy: Record<SetupTab, { eyebrow: string; title: string; body: string }> = {
  'Game settings': {
    eyebrow: 'TRAINING CONFIGURATION',
    title: 'Choose how you want to learn',
    body: 'Learn 2D and Train 3D use the same encounter vocabulary, while their simulations and arena geometry remain independent.',
  },
  'Keys & Mouse': {
    eyebrow: 'CONTROLS',
    title: 'Independent movement, shared actions',
    body: 'Learn 2D and Train 3D keep separate movement layouts. Combat, pause, and encounter actions remain shared across both runtimes.',
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
  const [settings, setSettings] = useState<TrainingSettings>(() => loadTrainingSettings())
  const [rebinding, setRebinding] = useState<Rebinding>()
  const [runtimeLoading, setRuntimeLoading] = useState<EncounterMode>()
  const [runtime, setRuntime] = useState<{ mode: EncounterMode; scenarioId: string; actions: readonly EncounterActionDefinition[]; Component: ComponentType<EncounterRuntimeProps> }>()
  const panel = panelCopy[activeTab]
  const encounter = catalogue?.packages[0]
  const catalogueFailed = catalogue && !encounter

  useEffect(() => {
    let active = true
    loadEncounterCatalogue().then(result => {
      if (active) setCatalogue(result)
    })
    return () => { active = false }
  }, [])

  const updateSettings = useCallback((update: SetStateAction<TrainingSettings>) => {
    setSettings(current => {
      const next = typeof update === 'function' ? update(current) : update
      saveTrainingSettings(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!rebinding) return
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      updateSettings(current => assignTrainingKeyBinding(current, rebinding.scope, rebinding.action, event.code))
      setRebinding(undefined)
    }
    window.addEventListener('keydown', onKeyDown, { once: true })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [rebinding, updateSettings])

  async function launch(selectedEncounter: EncounterPackageV1, mode: EncounterMode, scenarioId: string) {
    const scenario = (mode === 'learn2d' ? selectedEncounter.learn2d : selectedEncounter.train3d)
      .find(item => item.id === scenarioId && item.status === 'ready')
    if (!scenario) return
    setRuntimeLoading(mode)
    const module = await selectedEncounter.runtimeLoaders[mode]()
    setRuntime({ mode, scenarioId: scenario.id, actions: selectedEncounter.actions, Component: module.default })
    setRuntimeLoading(undefined)
  }

  async function launchContractRoom(mode: EncounterMode) {
    setRuntimeLoading(mode)
    const module = mode === 'learn2d'
      ? await import('./platform/learn2d/ContractRoom')
      : await import('./platform/train3d/ContractRoom')
    setRuntime({ mode, scenarioId: 'platform-contract-room', actions: contractRoomActions, Component: module.default })
    setRuntimeLoading(undefined)
  }

  if (runtime) {
    const Runtime = runtime.Component
    return <Runtime
      scenarioId={runtime.scenarioId}
      trainingDifficulty={settings.difficulty}
      keyBindings={runtimeKeyBindings(settings, runtime.mode)}
      actions={bindEncounterActions(runtime.actions, runtimeKeyBindings(settings, runtime.mode))}
      hudSettings={settings.hud}
      cameraSettings={settings.camera}
      onCameraSettingsChange={camera => updateSettings(current => ({ ...current, camera }))}
      onExit={() => setRuntime(undefined)}
    />
  }

  return <><BuildStatus /><main className="shell setup-shell season2-shell" id="setup-top">
    <aside className="season2-safety-note">Standalone workspace · public deployment disabled during extraction</aside>
    <div className="season2-hero-row">
      <header className="season2-hero">
        <p className="eyebrow">MIDNIGHT · SEASON 2 · RAID PRACTICE</p>
        <h1>{PRODUCT.name}</h1>
        <p className="lede">A reuse-first training platform for learning encounter plans in 2D and rehearsing movement in 3D.</p>
      </header>
      <CreatorCard />
    </div>
    <div className="season2-status" aria-label="Migration status">
      <span>Platform extraction</span>
      <strong>Nek'zali and Entombed Sentinels full fights</strong>
      <small>All eight raid bosses have isolated catalogue packages. Only Nek'zali and Entombed Sentinels currently expose playable scenarios.</small>
    </div>

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
      {activeTab === 'Game settings' && <div className="season2-catalogue-grid" aria-label="Encounter catalogue">
        <fieldset className="season2-training-difficulty"><legend>Trainer difficulty</legend><p>Encounter mechanics stay fixed. This changes guidance and failure tolerance only.</p><div>{(['test', 'easy', 'normal', 'hard'] as const).map(value => <button type="button" key={value} className={settings.difficulty === value ? 'selected' : ''} aria-pressed={settings.difficulty === value} onClick={() => updateSettings(current => ({ ...current, difficulty: value }))}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></fieldset>
        {!catalogue && <article className="season2-encounter-card loading"><p>Discovering encounter packages…</p></article>}
        {catalogueFailed && <article className="season2-encounter-card unavailable"><h3>No conforming encounter package</h3><p>Check development diagnostics before continuing.</p></article>}
        {catalogue?.packages.map(selectedEncounter => <article className="season2-encounter-card" key={selectedEncounter.manifest.id}>
          <header><EncounterIcon name={selectedEncounter.manifest.name} /><h3>{selectedEncounter.manifest.name}</h3></header>
          <p>{selectedEncounter.manifest.summary}</p>
          <div className="season2-encounter-actions">
            {(['learn2d', 'train3d'] as EncounterMode[]).map(mode => {
              const modeLabel = mode === 'learn2d' ? 'Learn 2D' : 'Train 3D'
              const scenarios = mode === 'learn2d' ? selectedEncounter.learn2d : selectedEncounter.train3d
              const readyScenario = scenarios.find(candidate => candidate.status === 'ready')
              const scenario = readyScenario ?? scenarios[0]
              const ready = Boolean(readyScenario)
              return <button
                type="button"
                key={mode}
                disabled={!ready || Boolean(runtimeLoading)}
                aria-label={ready ? `Launch ${selectedEncounter.manifest.name} ${modeLabel}` : `${selectedEncounter.manifest.name} ${scenario?.name ?? 'full fight'} coming soon in ${modeLabel}`}
                onClick={() => ready && void launch(selectedEncounter, mode, scenario.id)}
              ><span>{modeLabel}</span>{ready ? runtimeLoading === mode ? <small>Loading…</small> : null : <small>Coming soon</small>}</button>
            })}
          </div>
        </article>)}
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
      {activeTab === 'Keys & Mouse' && <div className="season2-settings-grid" role="group" aria-label="Input bindings">
        {([
            ['learn2d', 'Learn 2D movement', learn2dMovementActions],
            ['train3d', 'Train 3D movement', train3dMovementActions],
          ] as const).map(([scope, label, actions]) => <section className="season2-binding-panel" aria-label={label} key={scope}>
            <h3>{label}</h3>
            <p>{scope === 'learn2d' ? 'Top-down movement controls.' : 'Player-relative movement and turning.'}</p>
            <div className="season2-keybind-grid">{actions.map(action => {
              const bindings = settings.keyBindings[scope] as Partial<Record<TrainingAction, string>>
              const active = rebinding?.scope === scope && rebinding.action === action
              return <label className="season2-keybind" key={action}>
                <span>{trainingLabels[action]}</span>
                <button type="button" aria-label={`Rebind ${label} ${action}, current ${keyLabel(bindings[action]!)}`} className={active ? 'listening' : ''} onClick={() => setRebinding({ scope, action })}>
                  {active ? 'Press a key…' : keyLabel(bindings[action]!)}
                </button>
              </label>
            })}</div>
          </section>)}
        <section className="season2-camera-settings" aria-label="Mouse camera">
          <h3>Mouse camera</h3><p>Train 3D look and camera behavior.</p>
          <label><input type="checkbox" checked={settings.camera.invertX} onChange={event => updateSettings(current => ({ ...current, camera: { ...current.camera, invertX: event.target.checked } }))} /> Invert horizontal mouse-look</label>
          <label><input type="checkbox" checked={settings.camera.invertY} onChange={event => updateSettings(current => ({ ...current, camera: { ...current.camera, invertY: event.target.checked } }))} /> Invert vertical mouse-look</label>
          <label className="season2-camera-sensitivity">Mouse-look speed <strong>{settings.camera.sensitivity.toFixed(1)}×</strong><input type="range" min="0.5" max="2" step="0.1" value={settings.camera.sensitivity} onChange={event => updateSettings(current => ({ ...current, camera: { ...current.camera, sensitivity: Number(event.target.value) } }))} /></label>
        </section>
        <section className="season2-binding-panel season2-shared-bindings" aria-label="Shared actions">
          <div><h3>Shared actions</h3><p>Combat and trainer actions available in both runtimes.</p></div>
          <div className="season2-keybind-grid">{sharedActions.map(action => {
            const bindings = settings.keyBindings.shared
            const active = rebinding?.scope === 'shared' && rebinding.action === action
            return <label className="season2-keybind" key={action}>
              <span>{trainingLabels[action]}</span>
              <button type="button" aria-label={`Rebind Shared actions ${action}, current ${keyLabel(bindings[action]!)}`} className={active ? 'listening' : ''} onClick={() => setRebinding({ scope: 'shared', action })}>
                {active ? 'Press a key…' : keyLabel(bindings[action]!)}
              </button>
            </label>
          })}</div>
          <button type="button" className="secondary season2-reset" onClick={() => updateSettings(current => ({ ...current, keyBindings: structuredClone(DEFAULT_TRAINING_SETTINGS.keyBindings) }))}>Reset keybindings</button>
        </section>
      </div>}
      {activeTab === 'HUD' && <div className="season2-hud-settings">
        <div className="season2-toggle-grid">
          {([
            ['showPlayer', 'Show player health + cooldowns'],
            ['showAuras', 'Show buff / debuff state'],
            ['showActions', 'Show action state'],
            ['showBoss', 'Show boss health'],
          ] as const).map(([key, label]) => <label key={key}>
            <input type="checkbox" checked={settings.hud[key]} onChange={event => updateSettings(current => ({ ...current, hud: { ...current.hud, [key]: event.target.checked } }))} />
            {label}
          </label>)}
          <label className="season2-hud-scale">
            HUD scale <strong>{settings.hud.scale}%</strong>
            <input type="range" min="80" max="130" step="5" value={settings.hud.scale} onChange={event => updateSettings(current => ({ ...current, hud: { ...current.hud, scale: Number(event.target.value) } }))} />
          </label>
        </div>
        <div className="season2-hud-preview"><HudLayoutPreview settings={settings.hud} onChange={hud => updateSettings(current => ({ ...current, hud }))} /></div>
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
  </main></>
}
