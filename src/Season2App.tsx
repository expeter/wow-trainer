import { useCallback, useEffect, useState, type ComponentType, type SetStateAction } from 'react'
import BuildStatus from './platform/BuildStatus'
import CreatorCard from './platform/CreatorCard'
import { contractRoomActions } from './platform/contractActions'
import EncounterIcon from './platform/EncounterIcon'
import HudLayoutPreview from './platform/HudLayoutPreview'
import TacticalPlanner from './platform/TacticalPlanner'
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
import { PRODUCT } from './product'
import { playTrainerCue, speakTrainerCue, useTrainerAudioSettings } from './platform/trainerAudio'
import './styles.css'
import './styles/tokens.css'
import './styles/season2.css'

const tabs = ['Game settings', 'Keys & Mouse', 'HUD', 'Tactical plan', 'Audio', 'Statistics', 'Profile'] as const
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
    title: 'One boss, one important phase',
    body: 'Choose the encounter and phase, then position its raid and boss actors. Save or exchange the complete package-owned plan.',
  },
  Audio: {
    eyebrow: 'AUDIO CHANNELS',
    title: 'Independent, pause-aware assistance',
    body: 'Music, encounter sounds, and raid-lead speech are opt-in, persist independently, and remain synchronized with trainer pause.',
  },
  Statistics: {
    eyebrow: 'LATER MILESTONE',
    title: 'Statistics are intentionally offline',
    body: 'API /v2, public statistics, achievements, and rankings are deferred until the offline trainer and Entombed Sentinels are stable.',
  },
  Profile: {
    eyebrow: 'LATER MILESTONE',
    title: 'Profiles are not connected yet',
    body: 'Identity and account work will begin with the API /v2 milestone. This static release sends no encounter or profile data.',
  },
}

export default function Season2App() {
  const [activeTab, setActiveTab] = useState<SetupTab>('Game settings')
  const [catalogue, setCatalogue] = useState<EncounterCatalogue>()
  const [settings, setSettings] = useState<TrainingSettings>(() => loadTrainingSettings())
  const [rebinding, setRebinding] = useState<Rebinding>()
  const [runtimeLoading, setRuntimeLoading] = useState<EncounterMode>()
  const [runtime, setRuntime] = useState<{ mode: EncounterMode; scenarioId: string; actions: readonly EncounterActionDefinition[]; Component: ComponentType<EncounterRuntimeProps> }>()
  const [selectedEncounterId, setSelectedEncounterId] = useState('')
  const [plannerEncounterId, setPlannerEncounterId] = useState('')
  const [audio, setAudio] = useTrainerAudioSettings()
  const panel = panelCopy[activeTab]
  const encounter = catalogue?.packages.find(item => item.manifest.id === plannerEncounterId) ?? catalogue?.packages.find(item => item.tactics.length > 0)
  const selectedEncounter = catalogue?.packages.find(item => item.manifest.id === selectedEncounterId) ?? catalogue?.packages[0]
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
    <div className="season2-hero-row">
      <header className="season2-hero">
        <p className="eyebrow">MIDNIGHT · SEASON 2 · RAID PRACTICE</p>
        <h1>{PRODUCT.name}</h1>
        <p className="lede">A reuse-first training platform for learning encounter plans in 2D and rehearsing movement in 3D.</p>
      </header>
      <CreatorCard />
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
      {activeTab === 'Game settings' && <div className="season2-game-settings" aria-label="Encounter catalogue">
        {!catalogue && <article className="season2-encounter-card loading"><p>Discovering encounter packages…</p></article>}
        {catalogueFailed && <article className="season2-encounter-card unavailable"><h3>No conforming encounter package</h3><p>Check development diagnostics before continuing.</p></article>}
        {catalogue && <nav className="season2-boss-selector" aria-label="Boss fight selector">
          {catalogue.packages.map((candidate, index) => {
            const ready = candidate.learn2d.some(item => item.status === 'ready') || candidate.train3d.some(item => item.status === 'ready')
            const selected = candidate.manifest.id === selectedEncounter?.manifest.id
            return <button type="button" key={candidate.manifest.id} className={`${selected ? 'selected' : ''} ${ready ? 'ready' : 'planned'}`} aria-pressed={selected} onClick={() => setSelectedEncounterId(candidate.manifest.id)}>
              <span>{index + 1}</span><EncounterIcon name={candidate.manifest.name} /><strong>{candidate.manifest.name}</strong><small>{ready ? 'Playable' : 'Planned'}</small>
            </button>
          })}
        </nav>}
        {selectedEncounter && <div className="season2-selected-setup">
          <article className={`season2-selected-encounter ${selectedEncounter.learn2d.some(item => item.status === 'ready') ? 'ready' : 'planned'}`}>
            <header><EncounterIcon name={selectedEncounter.manifest.name} /><div><span>{selectedEncounter.manifest.raid}</span><h3>{selectedEncounter.manifest.name}</h3></div></header>
            <p>{selectedEncounter.manifest.summary}</p>
            <div className="season2-encounter-actions">
              {(['learn2d', 'train3d'] as EncounterMode[]).map(mode => {
                const modeLabel = mode === 'learn2d' ? 'Learn 2D' : 'Train 3D'
                const scenarios = mode === 'learn2d' ? selectedEncounter.learn2d : selectedEncounter.train3d
                const readyScenario = scenarios.find(candidate => candidate.status === 'ready')
                const scenario = readyScenario ?? scenarios[0]
                const ready = Boolean(readyScenario)
                return <button type="button" key={mode} disabled={!ready || Boolean(runtimeLoading)} aria-label={ready ? `Launch ${selectedEncounter.manifest.name} ${modeLabel}` : `${selectedEncounter.manifest.name} ${scenario?.name ?? 'full fight'} coming soon in ${modeLabel}`} onClick={() => ready && void launch(selectedEncounter, mode, scenario.id)}>
                  <span>{modeLabel}</span><small>{ready ? runtimeLoading === mode ? 'Loading…' : 'Full fight' : 'Coming soon'}</small>
                </button>
              })}
            </div>
          </article>
          <fieldset className="season2-training-difficulty"><legend>Trainer difficulty</legend><div>{(['test', 'easy', 'normal', 'hard'] as const).map(value => <button type="button" key={value} className={settings.difficulty === value ? 'selected' : ''} aria-pressed={settings.difficulty === value} onClick={() => updateSettings(current => ({ ...current, difficulty: value }))}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><p>Encounter mechanics stay fixed. Only guidance and tolerated mistakes change.</p></fieldset>
        </div>}
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
      {activeTab === 'Tactical plan' && catalogue && <div className="season2-plan-preview">
        <label className="tactical-encounter-select">Encounter<select value={encounter?.manifest.id ?? ''} onChange={event => setPlannerEncounterId(event.target.value)}>{catalogue.packages.filter(item => item.tactics.length > 0).map(item => <option key={item.manifest.id} value={item.manifest.id}>{item.manifest.name}</option>)}</select></label>
        {encounter && <TacticalPlanner encounter={encounter} />}
      </div>}
      {activeTab === 'Audio' && <div className="season2-audio-settings">
        {([
          ['music', 'Music', 'A low, generated ambient bed; no external asset is shipped.', 'musicVolume'],
          ['sounds', 'Encounter sounds', 'A short semantic cue when the active mechanic changes.', 'soundsVolume'],
          ['raidlead', 'Raid-lead speech', 'Browser speech announces the package-owned mechanic prompt.', 'raidleadVolume'],
        ] as const).map(([key, label, detail, volumeKey]) => <fieldset key={key}><legend>{label}</legend><label className="audio-channel-toggle"><input type="checkbox" checked={audio[key]} onChange={event => setAudio({ ...audio, [key]: event.target.checked })} /><span>Enable {label.toLowerCase()}<small>{detail}</small></span></label><label>Volume <strong>{Math.round(audio[volumeKey] * 100)}%</strong><input type="range" min="0" max="1" step=".05" value={audio[volumeKey]} onChange={event => setAudio({ ...audio, [volumeKey]: Number(event.target.value) })} /></label><button type="button" className="secondary" onClick={() => key === 'raidlead' ? speakTrainerCue('Raid lead ready', audio.raidleadVolume) : playTrainerCue(audio[key === 'music' ? 'musicVolume' : 'soundsVolume'], 'preview')}>Preview</button></fieldset>)}
      </div>}
      {(activeTab === 'Statistics' || activeTab === 'Profile') && <p className="season2-boundary-note">This shell boundary remains intentionally offline until the API /v2 milestone.</p>}
    </section>

    <footer className="season2-footer">
      <a href={PRODUCT.repositoryUrl}>Project repository</a>
      <a href="privacy.html">Privacy</a>
      <span>{PRODUCT.shortId} · {PRODUCT.plannedHostname}</span>
    </footer>
  </main></>
}
