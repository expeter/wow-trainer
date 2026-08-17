import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type { EncounterPackageV1, TacticPreset } from './encounters'

interface SavedTacticV1 {
  format: 'midnight-season-2-tactic'
  version: 1
  encounterId: string
  tactic: TacticPreset
}

const storageKey = (encounterId: string) => `midnight-s2:tactic:v1:${encounterId}`
const clamp = (value: number) => Math.max(4, Math.min(96, value))

function initialPlacements(pkg: EncounterPackageV1) {
  return Object.fromEntries(pkg.tacticSchema.fields.map((field, index) => [field.id, {
    x: 14 + (index % 4) * 24,
    y: 18 + Math.floor(index / 4) * 22,
  }]))
}

export function validateSavedTactic(value: unknown, pkg: EncounterPackageV1): SavedTacticV1 | undefined {
  if (!value || typeof value !== 'object') return
  const candidate = value as Partial<SavedTacticV1>
  if (candidate.format !== 'midnight-season-2-tactic' || candidate.version !== 1 || candidate.encounterId !== pkg.manifest.id) return
  const tactic = candidate.tactic
  if (!tactic || tactic.schemaVersion !== pkg.tacticSchema.version || typeof tactic.name !== 'string' || !tactic.assignments || typeof tactic.assignments !== 'object') return
  const known = new Set(pkg.tacticSchema.fields.map(field => field.id))
  if (Object.keys(tactic.assignments).some(key => !known.has(key))) return
  if (pkg.tacticSchema.fields.some(field => field.required && !(field.id in tactic.assignments))) return
  return candidate as SavedTacticV1
}

function defaultSaved(pkg: EncounterPackageV1): SavedTacticV1 {
  const preset = pkg.tactics[0]
  return {
    format: 'midnight-season-2-tactic', version: 1, encounterId: pkg.manifest.id,
    tactic: { ...preset, id: `${pkg.manifest.id}_local`, name: `${preset.name} · local`, assignments: { ...preset.assignments }, placements: initialPlacements(pkg) },
  }
}

function loadTactic(pkg: EncounterPackageV1) {
  try {
    const raw = localStorage.getItem(storageKey(pkg.manifest.id))
    if (raw) return validateSavedTactic(JSON.parse(raw), pkg) ?? defaultSaved(pkg)
  } catch { /* Ignore malformed local data and restore the package preset. */ }
  return defaultSaved(pkg)
}

export default function TacticalPlanner({ encounter }: { encounter: EncounterPackageV1 }) {
  const [saved, setSaved] = useState(() => loadTactic(encounter))
  const [message, setMessage] = useState('Package preset loaded')
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<string | null>(null)

  useEffect(() => { setSaved(loadTactic(encounter)); setMessage('Package preset loaded') }, [encounter])
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !boardRef.current) return
      const bounds = boardRef.current.getBoundingClientRect()
      setSaved(current => ({ ...current, tactic: { ...current.tactic, placements: { ...current.tactic.placements, [dragging.current!]: {
        x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
        y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
      } } } }))
    }
    const stop = () => { dragging.current = null }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
  }, [])

  const errors = useMemo(() => encounter.tacticSchema.fields.flatMap(field => {
    const value = saved.tactic.assignments[field.id]
    return field.required && (!value || (Array.isArray(value) && value.length === 0)) ? [`${field.label} is required.`] : []
  }), [encounter, saved])

  function updateAssignment(id: string, original: string | readonly string[], value: string) {
    const next = Array.isArray(original) ? value.split(',').map(item => item.trim()).filter(Boolean) : value
    setSaved(current => ({ ...current, tactic: { ...current.tactic, assignments: { ...current.tactic.assignments, [id]: next } } }))
  }
  function save() {
    if (errors.length) { setMessage('Resolve required assignments before saving'); return }
    localStorage.setItem(storageKey(encounter.manifest.id), JSON.stringify(saved)); setMessage('Saved in this browser')
  }
  function reset() { const next = defaultSaved(encounter); setSaved(next); localStorage.removeItem(storageKey(encounter.manifest.id)); setMessage('Package preset restored') }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${encounter.manifest.id}-tactic.json`; anchor.click(); URL.revokeObjectURL(url); setMessage('Tactic exported')
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    try {
      const imported = validateSavedTactic(JSON.parse(await file.text()), encounter)
      if (!imported) throw new Error('wrong encounter or schema')
      setSaved(imported); setMessage('Validated import ready to save')
    } catch { setMessage('Import rejected: wrong encounter, version, or fields') }
  }
  function beginDrag(id: string, event: ReactPointerEvent) { event.currentTarget.setPointerCapture?.(event.pointerId); dragging.current = id }

  const arena = encounter.learn2d[0]?.arena
  return <div className="tactical-planner">
    <div className="tactical-planner-toolbar">
      <label>Plan name<input value={saved.tactic.name} onChange={event => setSaved(current => ({ ...current, tactic: { ...current.tactic, name: event.target.value } }))} /></label>
      <span>Schema v{encounter.tacticSchema.version} · {encounter.manifest.name}</span>
      <button type="button" onClick={save}>Save</button><button type="button" className="secondary" onClick={download}>Export</button>
      <label className="tactic-import">Import<input type="file" accept="application/json" onChange={event => void importFile(event)} /></label>
      <button type="button" className="secondary" onClick={reset}>Reset</button>
    </div>
    <div className="tactical-planner-layout">
      <div className="tactical-board" ref={boardRef} aria-label={`${encounter.manifest.name} draggable tactic board`}>
        <strong>{arena?.label ?? encounter.manifest.name}</strong>
        {arena?.regions.map(region => <span className="tactical-region" key={region.id} style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.label}</span>)}
        {encounter.tacticSchema.fields.map(field => { const point = saved.tactic.placements?.[field.id] ?? { x: 50, y: 50 }; return <button type="button" className={`tactical-marker ${field.kind}`} key={field.id} style={{ left: `${point.x}%`, top: `${point.y}%` }} onPointerDown={event => beginDrag(field.id, event)} aria-label={`Move ${field.label}`}>{field.label}</button> })}
      </div>
      <div className="tactical-fields">
        {encounter.tacticSchema.fields.map(field => { const value = saved.tactic.assignments[field.id] ?? ''; return <label key={field.id}><span>{field.label}{field.required ? ' *' : ''}</span><input value={Array.isArray(value) ? value.join(', ') : value} onChange={event => updateAssignment(field.id, value, event.target.value)} /><small>{field.kind} · comma-separate groups and pairs</small></label> })}
      </div>
    </div>
    <p className={errors.length ? 'tactic-message error' : 'tactic-message'} role="status">{errors[0] ?? message}</p>
  </div>
}
