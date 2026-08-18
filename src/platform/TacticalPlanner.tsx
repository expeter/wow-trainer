import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { EncounterPackageV1, TacticFieldDefinition, TacticPreset } from './encounters'

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
const clampBoard = (value: number) => Math.max(0, Math.min(100, value))

export interface SelectionBox {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export function actorIdsInsideSelectionBox(actorIds: readonly string[], placements: Readonly<Record<string, { x: number; y: number }>>, box: SelectionBox) {
  const left = Math.min(box.startX, box.currentX)
  const right = Math.max(box.startX, box.currentX)
  const top = Math.min(box.startY, box.currentY)
  const bottom = Math.max(box.startY, box.currentY)
  return actorIds.filter(id => {
    const point = placements[id]
    return point && point.x >= left && point.x <= right && point.y >= top && point.y <= bottom
  })
}

export function assignmentFromSelection(kind: TacticFieldDefinition['kind'], selectedActorIds: readonly string[]): string | readonly string[] {
  if (kind === 'player' && selectedActorIds.length === 1) return selectedActorIds[0]
  return [...selectedActorIds]
}

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
  const [selectedActorIds, setSelectedActorIds] = useState<readonly string[]>([])
  const [selectionBox, setSelectionBox] = useState<SelectionBox>()
  const importRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ ids: readonly string[]; startX: number; startY: number; positions: Readonly<Record<string, { x: number; y: number }>>; moved: boolean } | undefined>(undefined)
  const selectionRef = useRef<(SelectionBox & { additive: boolean }) | undefined>(undefined)

  useEffect(() => {
    setSaved(loadTactic(encounter))
    setActiveMapId(encounter.tacticSchema.planner?.maps[0]?.id ?? '')
    setMessage('Package preset loaded')
    setSelectedActorIds([])
    setSelectionBox(undefined)
  }, [encounter])

  const errors = useMemo(() => encounter.tacticSchema.fields.flatMap(field => {
    const value = saved.tactic.assignments[field.id]
    return field.required && (!value || (Array.isArray(value) && value.length === 0)) ? [`${field.label} is required.`] : []
  }), [encounter, saved])
  const activeMap = planner?.maps.find(map => map.id === activeMapId) ?? planner?.maps[0]
  const actors = new Map(planner?.actors.map(actor => [actor.id, actor]))
  const arena = encounter.learn2d.find(scenario => scenario.arena.id === activeMap?.arenaId)?.arena ?? encounter.learn2d[0]?.arena

  const selectedPlayers = selectedActorIds.filter(id => actors.get(id)?.kind === 'player')
  function assignSelection(field: TacticFieldDefinition, actorIds = selectedPlayers) {
    if (actorIds.length === 0) { setMessage('Select one or more raid markers before assigning'); return }
    if (field.kind === 'player' && actorIds.length !== 1) { setMessage(`${field.label} accepts exactly one player`); return }
    setSaved(current => ({ ...current, tactic: { ...current.tactic, assignments: { ...current.tactic.assignments, [field.id]: assignmentFromSelection(field.kind, actorIds) } } }))
    setMessage(`${actorIds.length} player${actorIds.length === 1 ? '' : 's'} assigned to ${field.label}`)
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
    const actor = actors.get(id)
    const additive = event.shiftKey || event.ctrlKey || event.metaKey
    let ids = actor?.kind === 'player' && selectedActorIds.includes(id) ? selectedActorIds : [id]
    if (actor?.kind === 'player' && additive) {
      ids = selectedActorIds.includes(id) ? selectedActorIds.filter(actorId => actorId !== id) : [...selectedActorIds, id]
      setSelectedActorIds(ids)
      if (!ids.includes(id)) return
    } else if (actor?.kind === 'player' && !selectedActorIds.includes(id)) setSelectedActorIds([id])
    const positions = Object.fromEntries(ids.map(actorId => [actorId, saved.layouts[activeMapId]?.[actorId] ?? activeMap?.placements[actorId] ?? { x: 50, y: 50 }]))
    dragRef.current = { ids, startX: event.clientX, startY: event.clientY, positions, moved: false }
    setDragging(id)
  }
  function beginSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.tactical-actor')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const bounds = event.currentTarget.getBoundingClientRect()
    const point = {
      startX: clampBoard((event.clientX - bounds.left) / bounds.width * 100),
      startY: clampBoard((event.clientY - bounds.top) / bounds.height * 100),
      currentX: clampBoard((event.clientX - bounds.left) / bounds.width * 100),
      currentY: clampBoard((event.clientY - bounds.top) / bounds.height * 100),
      additive: event.shiftKey || event.ctrlKey || event.metaKey,
    }
    selectionRef.current = point
    setSelectionBox(point)
  }
  function moveActor(event: ReactPointerEvent<HTMLDivElement>) {
    if (selectionRef.current) {
      const bounds = event.currentTarget.getBoundingClientRect()
      const next = {
        ...selectionRef.current,
        currentX: clampBoard((event.clientX - bounds.left) / bounds.width * 100),
        currentY: clampBoard((event.clientY - bounds.top) / bounds.height * 100),
      }
      selectionRef.current = next
      setSelectionBox(next)
      return
    }
    if (!dragging || !activeMapId || !dragRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const deltaX = (event.clientX - dragRef.current.startX) / bounds.width * 100
    const deltaY = (event.clientY - dragRef.current.startY) / bounds.height * 100
    if (Math.hypot(event.clientX - dragRef.current.startX, event.clientY - dragRef.current.startY) > 2) dragRef.current.moved = true
    const moved = Object.fromEntries(dragRef.current.ids.map(id => [id, { x: clamp(dragRef.current!.positions[id].x + deltaX), y: clamp(dragRef.current!.positions[id].y + deltaY) }]))
    setSaved(current => ({ ...current, layouts: { ...current.layouts, [activeMapId]: { ...current.layouts[activeMapId], ...moved } } }))
  }
  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const selection = selectionRef.current
    if (selection && activeMap) {
      const playerIds = activeMap.actorIds.filter(id => actors.get(id)?.kind === 'player')
      const placements = saved.layouts[activeMap.id] ?? activeMap.placements
      const inside = actorIdsInsideSelectionBox(playerIds, placements, selection)
      setSelectedActorIds(current => selection.additive ? [...new Set([...current, ...inside])] : inside)
      setMessage(inside.length ? `${inside.length} player${inside.length === 1 ? '' : 's'} selected` : 'Raid marker selection cleared')
      selectionRef.current = undefined
      setSelectionBox(undefined)
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const target = document.elementFromPoint?.(event.clientX, event.clientY)?.closest<HTMLElement>('[data-assignment-id]')
    const field = target ? encounter.tacticSchema.fields.find(candidate => candidate.id === target.dataset.assignmentId) : undefined
    const playerIds = drag.ids.filter(id => actors.get(id)?.kind === 'player')
    if (field && playerIds.length > 0) {
      setSaved(current => ({ ...current, layouts: { ...current.layouts, [activeMapId]: { ...current.layouts[activeMapId], ...drag.positions } } }))
      assignSelection(field, playerIds)
    }
    dragRef.current = undefined
    setDragging(null)
  }
  function cancelPointer() {
    dragRef.current = undefined
    selectionRef.current = undefined
    setDragging(null)
    setSelectionBox(undefined)
  }

  if (!planner || !activeMap) return <p className="tactic-message error">This encounter has no package-owned planner maps yet.</p>

  return <div className="tactical-planner">
    <div className="tactical-planner-toolbar">
      <label>Plan name<input value={saved.tactic.name} onChange={event => setSaved(current => ({ ...current, tactic: { ...current.tactic, name: event.target.value } }))} /></label>
      <span>Schema v{encounter.tacticSchema.version} · {encounter.manifest.name}</span>
      <button type="button" className="tactical-toolbar-action" onClick={save}>Save</button><button type="button" className="tactical-toolbar-action secondary" onClick={download}>Export</button>
      <button type="button" className="tactical-toolbar-action secondary" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} className="tactic-file-input" type="file" accept="application/json" aria-label="Import tactical plan file" onChange={event => void importFile(event)} />
      <button type="button" className="tactical-toolbar-action secondary" onClick={reset}>Reset</button>
    </div>
    <nav className="tactical-phase-tabs" aria-label={`${encounter.manifest.name} planner phases`}>
      {planner.maps.map(map => <button type="button" key={map.id} className={map.id === activeMap.id ? 'selected' : ''} aria-pressed={map.id === activeMap.id} onClick={() => { setDragging(null); setSelectedActorIds([]); setActiveMapId(map.id) }}>{map.label}</button>)}
    </nav>
    <div className="tactical-planner-layout">
      <div className={`tactical-board ${activeMap.shape ?? 'rectangle'}${dragging ? ' dragging' : ''}${selectionBox ? ' selecting' : ''}`} aria-label={`${encounter.manifest.name} ${activeMap.label} draggable raid plan`} onPointerDown={beginSelection} onPointerMove={moveActor} onPointerUp={finishDrag} onPointerCancel={cancelPointer} style={activeMap.backgroundImage ? { backgroundImage: `linear-gradient(rgba(4, 9, 8, .42), rgba(4, 9, 8, .64)), url(${activeMap.backgroundImage})` } : undefined}>
        <strong>{activeMap.label} · {arena?.label ?? encounter.manifest.name}</strong>
        {arena?.regions.map(region => <span className="tactical-region" key={region.id} style={{ left: `${region.x}%`, top: `${region.y}%` }}>{region.label}</span>)}
        {activeMap.actorIds.map(actorId => {
          const actor = actors.get(actorId)
          const point = saved.layouts[activeMap.id]?.[actorId] ?? activeMap.placements[actorId] ?? { x: 50, y: 50 }
          if (!actor) return null
          const selected = selectedActorIds.includes(actor.id)
          return <button type="button" className={`tactical-actor ${actor.kind} ${actor.role ?? ''}${selected ? ' selected' : ''}`} key={actor.id} style={{ left: `${point.x}%`, top: `${point.y}%`, '--actor-color': actor.color } as CSSProperties} onPointerDown={event => beginDrag(actor.id, event)} aria-pressed={actor.kind === 'player' ? selected : undefined} aria-label={`Move ${actor.label} in ${activeMap.label}`} title={actor.kind === 'player' ? `${actor.label} · ${actor.role}` : actor.label}>{actor.label}</button>
        })}
        {selectionBox && <span className="tactical-selection-box" aria-hidden="true" style={{ left: `${Math.min(selectionBox.startX, selectionBox.currentX)}%`, top: `${Math.min(selectionBox.startY, selectionBox.currentY)}%`, width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}%`, height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}%` }} />}
      </div>
      <div className="tactical-fields">
        <div className="tactical-roster-key"><span>Raid marker selection</span><small>Drag an empty map area with the left mouse button to box-select players. Click still selects one; Shift, Ctrl, or ⌘ adds markers. Drag any selected marker to move the group or drop it on an assignment.</small><div>{(['tank', 'healer', 'melee', 'ranged'] as const).map(role => <button type="button" key={role} onClick={() => setSelectedActorIds(activeMap.actorIds.filter(id => actors.get(id)?.role === role))}>{role}s</button>)}<button type="button" onClick={() => setSelectedActorIds([])}>Clear</button></div></div>
        <div className="tactical-assignment-targets" aria-label="Player assignment drop targets">
          {encounter.tacticSchema.fields.filter(field => field.kind !== 'region').map(field => {
            const value = saved.tactic.assignments[field.id]
            const values = Array.isArray(value) ? value : value ? [value] : []
            return <section key={field.id} data-assignment-id={field.id} className="tactical-assignment-target">
              <header><span>{field.label}{field.required ? ' *' : ''}</span><small>{field.kind}</small></header>
              <p>{values.length ? values.map(item => actors.get(item)?.label ?? item).join(' · ') : 'Drop selected player markers here'}</p>
              <div><button type="button" disabled={selectedPlayers.length === 0} onClick={() => assignSelection(field)}>Assign selected ({selectedPlayers.length})</button><button type="button" className="secondary" onClick={() => setSaved(current => ({ ...current, tactic: { ...current.tactic, assignments: { ...current.tactic.assignments, [field.id]: [] } } }))}>Clear</button></div>
            </section>
          })}
        </div>
        <p className="tactical-region-note">Region responsibilities are represented by the players' positions on the arena instead of raw text fields.</p>
      </div>
    </div>
    <p className={errors.length ? 'tactic-message error' : 'tactic-message'} role="status">{errors[0] ?? message}</p>
  </div>
}
