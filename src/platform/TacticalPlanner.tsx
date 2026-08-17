import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { EncounterPackageV1, TacticPreset } from './encounters'

interface SavedTacticV1 {
  format: 'midnight-season-2-tactic'
  version: 1
  encounterId: string
  tactic: TacticPreset
}

export interface SavedTacticV2 {
  format: 'midnight-season-2-tactic'
  version: 2
  encounterId: string
  tactic: TacticPreset
  layouts: Readonly<Record<string, Readonly<Record<string, { x: number; y: number }>>>>
}

const storageKey = (encounterId: string) => `midnight-s2:tactic:v2:${encounterId}`
const legacyStorageKey = (encounterId: string) => `midnight-s2:tactic:v1:${encounterId}`
const clamp = (value: number) => Math.max(4, Math.min(96, value))

function defaultLayouts(pkg: EncounterPackageV1) {
  return Object.fromEntries((pkg.tacticSchema.planner?.maps ?? []).map(map => [map.id, { ...map.placements }]))
}

function validAssignments(tactic: TacticPreset | undefined, pkg: EncounterPackageV1, allowLegacyVersion = false) {
  if (!tactic || typeof tactic.name !== 'string' || !tactic.assignments || typeof tactic.assignments !== 'object') return false
  if (!allowLegacyVersion && tactic.schemaVersion !== pkg.tacticSchema.version) return false
  const known = new Set(pkg.tacticSchema.fields.map(field => field.id))
  if (Object.keys(tactic.assignments).some(key => !known.has(key))) return false
  return !pkg.tacticSchema.fields.some(field => field.required && !(field.id in tactic.assignments))
}

export function validateSavedTactic(value: unknown, pkg: EncounterPackageV1): SavedTacticV2 | undefined {
  if (!value || typeof value !== 'object') return
  const candidate = value as Partial<SavedTacticV2>
  if (candidate.format !== 'midnight-season-2-tactic' || candidate.version !== 2 || candidate.encounterId !== pkg.manifest.id) return
  if (!validAssignments(candidate.tactic, pkg) || !candidate.layouts || typeof candidate.layouts !== 'object') return
  const planner = pkg.tacticSchema.planner
  if (!planner) return
  const knownMaps = new Set(planner.maps.map(map => map.id))
  const knownActors = new Set(planner.actors.map(actor => actor.id))
  if (Object.keys(candidate.layouts).some(id => !knownMaps.has(id))) return
  for (const map of planner.maps) {
    const layout = candidate.layouts[map.id]
    if (!layout || map.actorIds.some(id => !layout[id])) return
    const mapActors = new Set(map.actorIds)
    for (const [actorId, point] of Object.entries(layout)) {
      if (!knownActors.has(actorId) || !mapActors.has(actorId) || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) return
    }
  }
  return candidate as SavedTacticV2
}

function migrateLegacy(value: unknown, pkg: EncounterPackageV1): SavedTacticV2 | undefined {
  if (!value || typeof value !== 'object') return
  const candidate = value as Partial<SavedTacticV1>
  if (candidate.format !== 'midnight-season-2-tactic' || candidate.version !== 1 || candidate.encounterId !== pkg.manifest.id || !validAssignments(candidate.tactic, pkg, true)) return
  return {
    format: 'midnight-season-2-tactic', version: 2, encounterId: pkg.manifest.id,
    tactic: { ...candidate.tactic!, schemaVersion: pkg.tacticSchema.version, placements: undefined },
    layouts: defaultLayouts(pkg),
  }
}

function defaultSaved(pkg: EncounterPackageV1): SavedTacticV2 {
  const preset = pkg.tactics[0]
  return {
    format: 'midnight-season-2-tactic', version: 2, encounterId: pkg.manifest.id,
    tactic: { ...preset, id: `${pkg.manifest.id}_local`, name: `${preset.name} · local`, assignments: { ...preset.assignments }, placements: undefined },
    layouts: defaultLayouts(pkg),
  }
}

function loadTactic(pkg: EncounterPackageV1) {
  try {
    const current = localStorage.getItem(storageKey(pkg.manifest.id))
    if (current) return validateSavedTactic(JSON.parse(current), pkg) ?? defaultSaved(pkg)
    const legacy = localStorage.getItem(legacyStorageKey(pkg.manifest.id))
    if (legacy) return migrateLegacy(JSON.parse(legacy), pkg) ?? defaultSaved(pkg)
  } catch { /* Ignore malformed local data and restore the package preset. */ }
  return defaultSaved(pkg)
}

export default function TacticalPlanner({ encounter }: { encounter: EncounterPackageV1 }) {
  const planner = encounter.tacticSchema.planner
  const [saved, setSaved] = useState(() => loadTactic(encounter))
  const [activeMapId, setActiveMapId] = useState(() => planner?.maps[0]?.id ?? '')
  const [message, setMessage] = useState('Package preset loaded')
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => {
    setSaved(loadTactic(encounter))
    setActiveMapId(encounter.tacticSchema.planner?.maps[0]?.id ?? '')
    setMessage('Package preset loaded')
  }, [encounter])

  const errors = useMemo(() => encounter.tacticSchema.fields.flatMap(field => {
    const value = saved.tactic.assignments[field.id]
    return field.required && (!value || (Array.isArray(value) && value.length === 0)) ? [`${field.label} is required.`] : []
  }), [encounter, saved])
  const activeMap = planner?.maps.find(map => map.id === activeMapId) ?? planner?.maps[0]
  const actors = new Map(planner?.actors.map(actor => [actor.id, actor]))
  const arena = encounter.learn2d.find(scenario => scenario.arena.id === activeMap?.arenaId)?.arena ?? encounter.learn2d[0]?.arena

  function updateAssignment(id: string, original: string | readonly string[], value: string) {
    const next = Array.isArray(original) ? value.split(',').map(item => item.trim()).filter(Boolean) : value
    setSaved(current => ({ ...current, tactic: { ...current.tactic, assignments: { ...current.tactic.assignments, [id]: next } } }))
  }
  function save() {
    if (errors.length) { setMessage('Resolve required assignments before saving'); return }
    localStorage.setItem(storageKey(encounter.manifest.id), JSON.stringify(saved))
    localStorage.removeItem(legacyStorageKey(encounter.manifest.id))
    setMessage('Plan and phase positions saved in this browser')
  }
  function reset() {
    const next = defaultSaved(encounter)
    setSaved(next)
    localStorage.removeItem(storageKey(encounter.manifest.id))
    localStorage.removeItem(legacyStorageKey(encounter.manifest.id))
    setMessage('Package preset restored')
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${encounter.manifest.id}-tactic.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Plan exported')
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      const imported = validateSavedTactic(raw, encounter) ?? migrateLegacy(raw, encounter)
      if (!imported) throw new Error('wrong encounter or schema')
      setSaved(imported)
      setMessage('Validated import ready to save')
    } catch { setMessage('Import rejected: wrong encounter, version, layout, or fields') }
  }
  function beginDrag(id: string, event: ReactPointerEvent) {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(id)
  }
  function moveActor(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !activeMapId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setSaved(current => ({ ...current, layouts: { ...current.layouts, [activeMapId]: { ...current.layouts[activeMapId], [dragging]: {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
    } } } }))
  }

  if (!planner || !activeMap) return <p className="tactic-message error">This encounter has no package-owned planner maps yet.</p>

  return <div className="tactical-planner">
    <div className="tactical-planner-toolbar">
      <label>Plan name<input value={saved.tactic.name} onChange={event => setSaved(current => ({ ...current, tactic: { ...current.tactic, name: event.target.value } }))} /></label>
      <span>Schema v{encounter.tacticSchema.version} · {encounter.manifest.name}</span>
      <button type="button" onClick={save}>Save</button><button type="button" className="secondary" onClick={download}>Export</button>
      <label className="tactic-import">Import<input type="file" accept="application/json" onChange={event => void importFile(event)} /></label>
      <button type="button" className="secondary" onClick={reset}>Reset</button>
    </div>
    <nav className="tactical-phase-tabs" aria-label={`${encounter.manifest.name} planner phases`}>
      {planner.maps.map(map => <button type="button" key={map.id} className={map.id === activeMap.id ? 'selected' : ''} aria-pressed={map.id === activeMap.id} onClick={() => { setDragging(null); setActiveMapId(map.id) }}>{map.label}</button>)}
    </nav>
    <div className="tactical-planner-layout">
      <div className={`tactical-board ${activeMap.shape ?? 'rectangle'}`} aria-label={`${encounter.manifest.name} ${activeMap.label} draggable raid plan`} onPointerMove={moveActor} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onPointerLeave={() => setDragging(null)} style={activeMap.backgroundImage ? { backgroundImage: `linear-gradient(rgba(4, 9, 8, .42), rgba(4, 9, 8, .64)), url(${activeMap.backgroundImage})` } : undefined}>
        <strong>{activeMap.label} · {arena?.label ?? encounter.manifest.name}</strong>
        {arena?.regions.map(region => <span className="tactical-region" key={region.id} style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.label}</span>)}
        {activeMap.actorIds.map(actorId => {
          const actor = actors.get(actorId)
          const point = saved.layouts[activeMap.id]?.[actorId] ?? activeMap.placements[actorId] ?? { x: 50, y: 50 }
          if (!actor) return null
          return <button type="button" className={`tactical-actor ${actor.kind} ${actor.role ?? ''}`} key={actor.id} style={{ left: `${point.x}%`, top: `${point.y}%`, '--actor-color': actor.color } as CSSProperties} onPointerDown={event => beginDrag(actor.id, event)} aria-label={`Move ${actor.label} in ${activeMap.label}`} title={actor.kind === 'player' ? `${actor.label} · ${actor.role}` : actor.label}>{actor.label}</button>
        })}
      </div>
      <div className="tactical-fields">
        <p className="tactical-roster-key"><span>Raid markers</span><small><i className="tank" /> tanks · <i className="healer" /> healers · <i className="melee" /> melee · <i className="ranged" /> ranged</small></p>
        {encounter.tacticSchema.fields.map(field => { const value = saved.tactic.assignments[field.id] ?? ''; return <label key={field.id}><span>{field.label}{field.required ? ' *' : ''}</span><input value={Array.isArray(value) ? value.join(', ') : value} onChange={event => updateAssignment(field.id, value, event.target.value)} /><small>{field.kind} · comma-separate groups and pairs</small></label> })}
      </div>
    </div>
    <p className={errors.length ? 'tactic-message error' : 'tactic-message'} role="status">{errors[0] ?? message}</p>
  </div>
}
