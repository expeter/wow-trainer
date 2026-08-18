import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { TrainingCameraSettings } from '../trainingSettings'
import type { ActorSnapshot, EffectSnapshot, Train3DSnapshot, WorldMarkerSnapshot } from './types'
import { RUNTIME_PAUSE_REQUEST_EVENT } from '../useRuntimePause'
import { resolveAttachedEffects } from '../encounters/entityState'

interface ThreeWorldRendererProps {
  snapshot: Train3DSnapshot
  snapshotSource?: () => Train3DSnapshot
  cameraSettings: TrainingCameraSettings
  onCameraSettingsChange: (settings: TrainingCameraSettings) => void
  onPlayerLook: (yawDelta: number) => void
  onBothButtonsForward: (active: boolean) => void
  onPerformanceSample?: (sample: { fps: number; p95Ms: number }) => void
  rendererFactory?: (canvas: HTMLCanvasElement) => THREE.WebGLRenderer
}

const auraColors = { beneficial: 0x72e5c0, poison: 0x70dc87, danger: 0xe96f80, spectral: 0x9d83f2 } as const
export const VISUAL_FLOOR_SCALE = 4
export const VASHNIK_FLOOR_OUTLINE = [
  [-17, -46], [17, -46], [21, -34], [22, -23], [38, -15], [38, 12], [34, 25], [23, 46],
  [-23, 46], [-34, 25], [-38, 12], [-38, -15], [-22, -23], [-21, -34],
] as const

export function renderedFloorDimensions(arena: Train3DSnapshot['arena']) {
  return { width: arena.width * VISUAL_FLOOR_SCALE, depth: arena.depth * VISUAL_FLOOR_SCALE }
}

function auraSignature(actor: ActorSnapshot) {
  return actor.auras.map(aura => `${aura.id}:${aura.tone}:${aura.stacks}`).join('|')
}

function lerpAngle(current: number, target: number, alpha: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + delta * alpha
}

export function simulationFacingToObjectRotation(facing: number) { return -facing }
export function objectRotationToSimulationFacing(rotation: number) { return -rotation }

function disposeObject(object: THREE.Object3D) {
  object.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => material.dispose())
    }
    if (child instanceof THREE.Line) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => material.dispose())
    }
    if (child instanceof THREE.Sprite) child.material.dispose()
  })
}

function arenaFloorDetails(arena: Train3DSnapshot['arena']) {
  const group = new THREE.Group()
  group.name = `floor-material-${arena.theme.material ?? 'plain'}`
  const points: THREE.Vector3[] = []
  const seed = [...arena.id].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  const unit = (index: number) => {
    const value = Math.sin((index + 1) * 91.733 + seed * 17.17) * 43758.5453
    return value - Math.floor(value)
  }
  const count = arena.theme.layout === 'three-fountain-plan' ? 0 : arena.shape === 'circle' ? 54 : 76
  for (let index = 0; index < count; index += 1) {
    const angle = unit(index * 7) * Math.PI * 2
    const radial = Math.sqrt(unit(index * 7 + 1))
    const x = arena.shape === 'circle' ? Math.cos(angle) * radial * arena.width * .46 : (unit(index * 7 + 2) - .5) * arena.width * .92
    const z = arena.shape === 'circle' ? Math.sin(angle) * radial * arena.depth * .46 : (unit(index * 7 + 3) - .5) * arena.depth * .88
    const length = 1.8 + unit(index * 7 + 4) * 5.2
    const direction = angle + (unit(index * 7 + 5) - .5) * 1.7
    const bendX = x + Math.cos(direction) * length * .48 + (unit(index * 7 + 6) - .5) * 1.4
    const bendZ = z + Math.sin(direction) * length * .48 + (unit(index * 7 + 7) - .5) * 1.4
    const endX = x + Math.cos(direction) * length
    const endZ = z + Math.sin(direction) * length
    points.push(new THREE.Vector3(x, .052, z), new THREE.Vector3(bendX, .052, bendZ), new THREE.Vector3(bendX, .052, bendZ), new THREE.Vector3(endX, .052, endZ))
  }
  const cracks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: arena.theme.cracks || '#60736a', transparent: true, opacity: .46 }))
  cracks.name = 'floor-cracks'
  group.add(cracks)
  if (arena.theme.kind === 'sentinels') {
    const poisonMaterial = new THREE.MeshBasicMaterial({ color: arena.theme.poison || '#76bd36', transparent: true, opacity: .28, depthWrite: false })
    const horizontal = new THREE.PlaneGeometry(arena.width + 14, 7)
    const vertical = new THREE.PlaneGeometry(7, arena.depth)
    for (const z of [-arena.depth / 2 - 3.5, arena.depth / 2 + 3.5]) {
      const strip = new THREE.Mesh(horizontal, poisonMaterial)
      strip.rotation.x = -Math.PI / 2
      strip.position.set(0, .045, z)
      group.add(strip)
    }
    for (const x of [-arena.width / 2 - 3.5, arena.width / 2 + 3.5]) {
      const strip = new THREE.Mesh(vertical, poisonMaterial)
      strip.rotation.x = -Math.PI / 2
      strip.position.set(x, .045, 0)
      group.add(strip)
    }
  }
  if (arena.theme.layout === 'three-fountain-plan') {
    const laneDefinitions = [
      { id: 'blood', origin: { x: 0, z: -36 }, color: arena.theme.blood || '#c04a5a' },
      { id: 'flame', origin: { x: -31, z: 18 }, color: arena.theme.flame || '#e57c3f' },
      { id: 'shadow', origin: { x: 31, z: 18 }, color: arena.theme.shadow || '#8468d4' },
    ]
    for (const lane of laneDefinitions) {
      const length = Math.hypot(lane.origin.x, lane.origin.z)
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(length, 5.5), new THREE.MeshBasicMaterial({ color: lane.color, transparent: true, opacity: .15, side: THREE.DoubleSide, depthWrite: false }))
      strip.name = `${lane.id}-fountain-lane`
      strip.rotation.x = -Math.PI / 2
      strip.rotation.z = -Math.atan2(-lane.origin.z, -lane.origin.x)
      strip.position.set(lane.origin.x / 2, .045, lane.origin.z / 2)
      group.add(strip)
      const fountain = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.1, 40), new THREE.MeshBasicMaterial({ color: lane.color, transparent: true, opacity: .82, side: THREE.DoubleSide, depthWrite: false }))
      fountain.name = `${lane.id}-fountain-dais`
      fountain.rotation.x = -Math.PI / 2
      fountain.position.set(lane.origin.x, .07, lane.origin.z)
      group.add(fountain)
    }
    const cavity = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.7, .8, 48), new THREE.MeshStandardMaterial({ color: arena.theme.cavity || '#173a25', emissive: '#3a9b55', emissiveIntensity: .22, roughness: .42 }))
    cavity.name = 'malignant-cavity-floor'
    cavity.position.y = -.28
    group.add(cavity)
  }
  return group
}

function actorObject(actor: ActorSnapshot) {
  const group = new THREE.Group()
  group.name = actor.id
  const hostile = actor.kind === 'boss' || actor.kind === 'enemy'
  const bodyGeometry = actor.kind === 'boss'
    ? new THREE.CylinderGeometry(2.7, 3.2, 5.8, 20)
    : actor.kind === 'enemy'
      ? new THREE.ConeGeometry(1.18, 2.9, 7)
    : actor.role === 'tank'
      ? new THREE.BoxGeometry(1.55, 2.25, 1.35)
      : new THREE.CapsuleGeometry(.72, 1.35, 5, 12)
  const bodyColor = hostile ? new THREE.Color(actor.color).multiplyScalar(.42) : new THREE.Color(actor.color)
  const body = new THREE.Mesh(
    bodyGeometry,
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: hostile ? .42 : .64, emissive: actor.color, emissiveIntensity: hostile ? .42 : .12 }),
  )
  body.position.y = actor.kind === 'boss' ? 2.9 : 1.4
  group.add(body)
  if (hostile) {
    const crown = new THREE.Group()
    crown.name = 'hostile-silhouette'
    crown.position.y = actor.kind === 'boss' ? 6 : 2.9
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(actor.kind === 'boss' ? .42 : .22, actor.kind === 'boss' ? 1.7 : .9, 6), new THREE.MeshStandardMaterial({ color: 0x161119, emissive: actor.color, emissiveIntensity: .55, roughness: .35 }))
      horn.position.x = side * (actor.kind === 'boss' ? 1.45 : .52)
      horn.rotation.z = side * -.34
      crown.add(horn)
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(actor.kind === 'boss' ? .3 : .2, 8, 6), new THREE.MeshBasicMaterial({ color: actor.color }))
    eye.position.set(0, actor.kind === 'boss' ? -.55 : -.25, actor.kind === 'boss' ? -2.72 : -.62)
    crown.add(eye)
    group.add(crown)
  }
  if (actor.role === 'healer' && actor.kind !== 'player') {
    const healerRing = new THREE.Mesh(new THREE.TorusGeometry(.52, .09, 7, 18), new THREE.MeshBasicMaterial({ color: actor.color }))
    healerRing.name = 'role-healer'
    healerRing.position.y = 3.15
    group.add(healerRing)
  }
  if (actor.kind === 'player') {
    const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: .78 }))
    head.position.y = 2.75
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.65, .34, .48), new THREE.MeshStandardMaterial({ color: actor.color, roughness: .48, metalness: .12 }))
    shoulders.position.set(0, 2.05, 0)
    const chest = new THREE.Mesh(new THREE.BoxGeometry(.62, .72, .18), new THREE.MeshBasicMaterial({ color: actor.color }))
    chest.position.set(0, 1.72, -.68)
    const facing = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.35, 3), new THREE.MeshBasicMaterial({ color: 0xffe58a, transparent: true, opacity: .92, depthWrite: false }))
    facing.name = 'facing-chevron'
    facing.rotation.x = -Math.PI / 2
    facing.position.set(0, .09, -1.25)
    const casterClasses = new Set(['mage', 'priest', 'warlock', 'shaman', 'evoker'])
    const agileClasses = new Set(['rogue', 'hunter', 'monk', 'demon-hunter', 'druid'])
    const accessory = casterClasses.has(actor.playerClass ?? '')
      ? new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0xa98b63, roughness: .8 }))
      : agileClasses.has(actor.playerClass ?? '')
        ? new THREE.Mesh(new THREE.BoxGeometry(.12, 1.55, .12), new THREE.MeshStandardMaterial({ color: 0xd6cfb0, roughness: .58 }))
        : new THREE.Mesh(new THREE.CylinderGeometry(.58, .68, .16, 12), new THREE.MeshStandardMaterial({ color: actor.color, roughness: .42, metalness: .3 }))
    accessory.name = `class-${actor.playerClass ?? 'adventurer'}`
    if (casterClasses.has(actor.playerClass ?? '')) { accessory.rotation.z = -.3; accessory.position.set(.95, 1.55, .05) }
    else if (agileClasses.has(actor.playerClass ?? '')) { accessory.rotation.z = .72; accessory.position.set(-.72, 1.72, .2) }
    else { accessory.rotation.x = Math.PI / 2; accessory.position.set(-.9, 1.55, -.12) }
    group.add(head, shoulders, chest, accessory, facing)
  }
  if (actor.kind === 'enemy') {
    const health = new THREE.Group()
    health.name = 'world-health'
    health.position.y = 3.7
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.5, .28), new THREE.MeshBasicMaterial({ color: 0x25171b, depthTest: false }))
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(2.35, .18), new THREE.MeshBasicMaterial({ color: 0x65d98c, depthTest: false }))
    fill.name = 'world-health-fill'
    fill.position.z = .01
    health.add(back, fill)
    group.add(health)
  }
  return group
}

function refreshAuras(group: THREE.Group, actor: ActorSnapshot) {
  const old = group.getObjectByName('auras')
  if (old) {
    group.remove(old)
    disposeObject(old)
  }
  const auraGroup = new THREE.Group()
  auraGroup.name = 'auras'
  const icons = actor.auras.flatMap(aura => ['green-toxin', 'red-toxin'].includes(aura.id)
    ? Array.from({ length: aura.stacks }, (_, index) => ({ ...aura, index }))
    : [{ ...aura, index: 0 }])
  icons.forEach((aura, index) => {
    const icon = new THREE.Mesh(
      new THREE.OctahedronGeometry(.28, 0),
      new THREE.MeshBasicMaterial({ color: auraColors[aura.tone] }),
    )
    icon.position.set((index - (icons.length - 1) / 2) * .62, actor.kind === 'boss' ? 7.05 : 3.82, 0)
    auraGroup.add(icon)
  })
  auraGroup.userData.signature = auraSignature(actor)
  group.add(auraGroup)
}

function effectObject(effect: EffectSnapshot) {
  if (effect.kind === 'dome') {
    return new THREE.Mesh(
      new THREE.SphereGeometry(effect.radius, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.BackSide, transparent: true, opacity: .16, depthWrite: false }),
    )
  }
  if (effect.kind === 'projectile' || effect.kind === 'cosmetic-projectile') {
    const material = new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: .95, depthWrite: false })
    if (!effect.projectileShape) return new THREE.Mesh(new THREE.SphereGeometry(effect.radius, 10, 7), material)
    const group = new THREE.Group()
    if (effect.projectileShape === 'lightning') {
      const points = [new THREE.Vector3(-1.7, 0, 0), new THREE.Vector3(-1.05, .25, -.12), new THREE.Vector3(-.4, -.22, .1), new THREE.Vector3(.3, .27, -.1), new THREE.Vector3(1, -.18, .12), new THREE.Vector3(1.7, 0, 0)]
      group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 14, .12, 5, false), material))
    } else if (effect.projectileShape === 'arrow' || effect.projectileShape === 'spear') {
      const spear = effect.projectileShape === 'spear'
      const length = spear ? 3 : 2.5
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(spear ? .12 : .07, spear ? .12 : .07, length, 7), material)
      shaft.rotation.z = Math.PI / 2
      const tip = new THREE.Mesh(new THREE.ConeGeometry(spear ? .4 : .25, spear ? 1 : .7, 6), material)
      tip.rotation.z = -Math.PI / 2
      tip.position.x = length / 2 + (spear ? .45 : .3)
      group.add(shaft, tip)
    } else {
      const core = new THREE.Mesh(new THREE.CylinderGeometry(.24, .34, 1.9, 8), material)
      core.rotation.z = Math.PI / 2
      core.position.x = .25
      const tail = new THREE.Mesh(new THREE.ConeGeometry(.3, 2, 8), material)
      tail.rotation.z = -Math.PI / 2
      tail.position.x = -1.15
      group.add(core, tail)
    }
    return group
  }
  if (effect.kind === 'projectile-impact') {
    return new THREE.Mesh(new THREE.SphereGeometry(effect.radius, 10, 7), new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: .82, depthWrite: false }))
  }
  if (effect.kind === 'arrow') {
    const group = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(.18, .08, 2.2), new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: .95, depthWrite: false }))
    shaft.position.z = -1.1
    const head = new THREE.Mesh(new THREE.ConeGeometry(.42, 1, 4), new THREE.MeshBasicMaterial({ color: effect.color, transparent: true, opacity: .95, depthWrite: false }))
    head.rotation.x = -Math.PI / 2
    head.position.z = -2.45
    group.add(shaft, head)
    return group
  }
  if (effect.kind === 'lane') {
    const length = effect.target ? Math.hypot(effect.target.x - effect.position.x, effect.target.z - effect.position.z) : 1
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(length, effect.radius * 2), new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.DoubleSide, transparent: true, opacity: .24, depthWrite: false }))
    lane.rotation.x = -Math.PI / 2
    return lane
  }
  if (effect.kind === 'ground-harmful' || effect.kind === 'ground-soak' || effect.kind === 'ground-spread' || effect.kind === 'ground-objective') {
    const group = new THREE.Group()
    const disc = new THREE.Mesh(new THREE.CircleGeometry(effect.radius, 40), new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.DoubleSide, transparent: true, opacity: effect.kind === 'ground-objective' ? .08 : .28, depthWrite: false }))
    disc.name = 'effect-fill'
    disc.rotation.x = -Math.PI / 2
    const ring = new THREE.Mesh(new THREE.RingGeometry(Math.max(.1, effect.radius - .28), effect.radius, 40), new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.DoubleSide, transparent: true, opacity: .9, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = .015
    group.add(disc, ring)
    return group
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(.1, effect.radius - .35), effect.radius, 40),
    new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.DoubleSide, transparent: true, opacity: .65 }),
  )
  ring.rotation.x = -Math.PI / 2
  return ring
}

function markerObject(marker: WorldMarkerSnapshot) {
  const group = new THREE.Group()
  group.name = marker.id
  group.userData.wobblePhase = [...marker.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) * .071
  const material = new THREE.MeshStandardMaterial({ color: marker.color, emissive: marker.color, emissiveIntensity: .35, roughness: .42, transparent: true, opacity: .88 })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.4, 8), material)
  pole.position.y = 2.2
  const base = new THREE.Mesh(new THREE.RingGeometry(.85, 1.1, 28), new THREE.MeshBasicMaterial({ color: marker.color, side: THREE.DoubleSide, transparent: true, opacity: .45 }))
  base.rotation.x = -Math.PI / 2
  base.position.y = .06
  const symbol = new THREE.Group()
  symbol.position.y = 4.65
  if (marker.kind === 'circle') {
    symbol.add(new THREE.Mesh(new THREE.TorusGeometry(.48, .12, 8, 24), material))
  } else if (marker.kind === 'cross') {
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.05, .22, .18), material)
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.05, .18), material)
    symbol.add(horizontal, vertical)
  } else {
    const shape = new THREE.Mesh(new THREE.OctahedronGeometry(marker.kind === 'star' ? .58 : .5, marker.kind === 'star' ? 1 : 0), material)
    if (marker.kind === 'diamond') shape.scale.y = 1.3
    symbol.add(shape)
  }
  group.add(pole, base, symbol)
  return group
}

export default function ThreeWorldRenderer({ snapshot, snapshotSource, cameraSettings, onCameraSettingsChange, onPlayerLook, onBothButtonsForward, onPerformanceSample, rendererFactory }: ThreeWorldRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendererFailure, setRendererFailure] = useState<string>()
  const [recoveryKey, setRecoveryKey] = useState(0)
  const snapshotRef = useRef(snapshot)
  const settingsRef = useRef(cameraSettings)
  const settingsCallbackRef = useRef(onCameraSettingsChange)
  const lookCallbackRef = useRef(onPlayerLook)
  const bothButtonsCallbackRef = useRef(onBothButtonsForward)
  const snapshotSourceRef = useRef(snapshotSource)
  const performanceCallbackRef = useRef(onPerformanceSample)
  snapshotRef.current = snapshot
  settingsRef.current = cameraSettings
  settingsCallbackRef.current = onCameraSettingsChange
  lookCallbackRef.current = onPlayerLook
  bothButtonsCallbackRef.current = onBothButtonsForward
  snapshotSourceRef.current = snapshotSource
  performanceCallbackRef.current = onPerformanceSample

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderCanvas: HTMLCanvasElement = canvas
    let renderer: THREE.WebGLRenderer
    try {
      renderer = rendererFactory ? rendererFactory(canvas) : new THREE.WebGLRenderer({ canvas, antialias: true })
    } catch {
      bothButtonsCallbackRef.current(false)
      window.dispatchEvent(new Event(RUNTIME_PAUSE_REQUEST_EVENT))
      setRendererFailure('The 3D renderer could not start. Your attempt is paused visually; retry the renderer or return to setup.')
      return
    }
    if (import.meta.env.DEV) canvas.dataset.playerMarker = 'humanoid-chevron'
    renderer.setPixelRatio(1)
    const arena = snapshotRef.current.arena
    if (import.meta.env.DEV) {
      canvas.dataset.arenaShape = arena.shape
      canvas.dataset.arenaTheme = arena.theme.kind ?? 'default'
      canvas.dataset.floorMaterial = arena.theme.material ?? 'plain'
    }
    const floorColor = new THREE.Color(arena.theme.floor?.startsWith('#') ? arena.theme.floor : '#18221b')
    const boundaryColor = new THREE.Color(arena.theme.boundary?.startsWith('#') ? arena.theme.boundary : '#7fa98d')
    const noFog = arena.theme.fog === 'none'
    renderer.setClearColor(noFog ? new THREE.Color('#07090a') : floorColor.clone().multiplyScalar(.24))
    const scene = new THREE.Scene()
    scene.fog = noFog ? null : new THREE.Fog(floorColor.clone().multiplyScalar(.24), 52, 110)
    if (import.meta.env.DEV) canvas.dataset.arenaFog = noFog ? 'none' : 'distance'
    const camera = new THREE.PerspectiveCamera(58, 1, .1, 160)
    scene.add(new THREE.HemisphereLight(0xc5ffe1, 0x172018, 2.3))
    const light = new THREE.DirectionalLight(0xf1ffe5, 2.1)
    light.position.set(-18, 30, 14)
    scene.add(light)

    const visualFloor = renderedFloorDimensions(arena)
    const vashnikShape = new THREE.Shape(VASHNIK_FLOOR_OUTLINE.map(([x, z]) => new THREE.Vector2(x, -z)))
    const floor = new THREE.Mesh(
      arena.theme.layout === 'three-fountain-plan' ? new THREE.ShapeGeometry(vashnikShape) : arena.shape === 'circle' ? new THREE.CircleGeometry(arena.width * VISUAL_FLOOR_SCALE / 2, 96) : new THREE.PlaneGeometry(visualFloor.width, visualFloor.depth),
      new THREE.MeshStandardMaterial({ color: floorColor, roughness: .9 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)
    scene.add(arenaFloorDetails(arena))
    if (arena.shape === 'rectangle') {
      const grid = new THREE.GridHelper(Math.max(visualFloor.width, visualFloor.depth), 64, 0x405d48, 0x243329)
      grid.position.y = .03
      scene.add(grid)
      if (arena.theme.kind === 'sentinels') {
        const sideWidth = arena.width * .36
        for (const [x, color] of [[-arena.width * .3, arena.theme.acid], [arena.width * .3, arena.theme.blood]] as const) {
          const side = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, arena.depth * .9), new THREE.MeshBasicMaterial({ color: color || '#77c978', transparent: true, opacity: .1, depthWrite: false }))
          side.rotation.x = -Math.PI / 2
          side.position.set(x, .04, 0)
          scene.add(side)
        }
        const corridor = new THREE.Mesh(new THREE.PlaneGeometry(18, arena.depth * .92), new THREE.MeshBasicMaterial({ color: arena.theme.corridor || '#d8c680', transparent: true, opacity: .08, depthWrite: false }))
        corridor.rotation.x = -Math.PI / 2
        corridor.position.y = .045
        scene.add(corridor)
      }
    } else if (arena.theme.layout !== 'three-fountain-plan') {
      for (const radius of [10, 22, 34, 44]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(radius - .08, radius + .08, 72), new THREE.MeshBasicMaterial({ color: boundaryColor, side: THREE.DoubleSide, transparent: true, opacity: radius === 44 ? .48 : .15 }))
        ring.rotation.x = -Math.PI / 2
        ring.position.y = .035
        scene.add(ring)
      }
      if (arena.theme.kind === 'soulcoil') {
        const well = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.5, 1.1, 64), new THREE.MeshStandardMaterial({ color: arena.theme.well || '#07191d', emissive: arena.theme.accent || '#58c9c5', emissiveIntensity: .35, roughness: .35 }))
        well.position.y = -.25
        scene.add(well)
        for (let index = 0; index < 8; index += 1) {
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(.32, .03, 28), new THREE.MeshBasicMaterial({ color: arena.theme.accent || '#58c9c5', transparent: true, opacity: .12 }))
          spoke.position.y = .04
          spoke.rotation.y = index * Math.PI / 4
          scene.add(spoke)
        }
      }
    }
    const boundaryPoints = arena.theme.layout === 'three-fountain-plan'
      ? VASHNIK_FLOOR_OUTLINE.map(([x, z]) => new THREE.Vector3(x, .055, z))
      : arena.shape === 'circle'
      ? Array.from({ length: 96 }, (_, index) => { const angle = index * Math.PI * 2 / 96; return new THREE.Vector3(Math.cos(angle) * arena.width / 2, .055, Math.sin(angle) * arena.depth / 2) })
      : [
          new THREE.Vector3(-arena.width / 2, .055, -arena.depth / 2),
          new THREE.Vector3(arena.width / 2, .055, -arena.depth / 2),
          new THREE.Vector3(arena.width / 2, .055, arena.depth / 2),
          new THREE.Vector3(-arena.width / 2, .055, arena.depth / 2),
        ]
    const boundary = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(boundaryPoints),
      new THREE.LineBasicMaterial({ color: boundaryColor, transparent: true, opacity: .52 }),
    )
    scene.add(boundary)

    const actors = new Map<string, THREE.Group>()
    const effects = new Map<string, THREE.Object3D>()
    const markers = new Map<string, THREE.Group>()
    let cameraYawOffset = 0
    let cameraPitch = .28
    const mouseButtons = new Set<number>()
    let dragging = false
    let lastX = 0
    let lastY = 0

    const updateBothButtons = () => bothButtonsCallbackRef.current(mouseButtons.has(0) && mouseButtons.has(2))
    const syncMouseButtons = (buttons: number) => {
      if (buttons & 1) mouseButtons.add(0); else mouseButtons.delete(0)
      if (buttons & 2) mouseButtons.add(2); else mouseButtons.delete(2)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 2) return
      event.preventDefault()
      syncMouseButtons(event.buttons)
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      if (event.button === 2 && cameraYawOffset !== 0) {
        lookCallbackRef.current(cameraYawOffset)
        cameraYawOffset = 0
      }
      updateBothButtons()
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.type === 'pointercancel') mouseButtons.clear()
      else syncMouseButtons(event.buttons)
      if (!mouseButtons.size) dragging = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      updateBothButtons()
    }
    const onPointerMove = (event: PointerEvent) => {
      syncMouseButtons(event.buttons)
      updateBothButtons()
      if (!dragging) return
      const horizontal = (event.clientX - lastX) * .006 * settingsRef.current.sensitivity * (settingsRef.current.invertX ? -1 : 1)
      const vertical = (event.clientY - lastY) * .004 * settingsRef.current.sensitivity * (settingsRef.current.invertY ? -1 : 1)
      lastX = event.clientX
      lastY = event.clientY
      cameraPitch = THREE.MathUtils.clamp(cameraPitch + vertical, .08, .72)
      if (mouseButtons.has(2)) {
        cameraYawOffset = 0
        lookCallbackRef.current(horizontal)
      } else if (mouseButtons.has(0)) {
        cameraYawOffset += horizontal
      }
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const zoom = THREE.MathUtils.clamp(settingsRef.current.zoom + event.deltaY * .015, 10, 38)
      settingsCallbackRef.current({ ...settingsRef.current, zoom })
    }
    const onContextMenu = (event: Event) => event.preventDefault()
    const clearPointerState = () => {
      mouseButtons.clear()
      dragging = false
      bothButtonsCallbackRef.current(false)
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      clearPointerState()
      window.dispatchEvent(new Event(RUNTIME_PAUSE_REQUEST_EVENT))
      setRendererFailure('The 3D renderer lost its graphics context. Retry the renderer to continue from the current simulation state.')
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', clearPointerState)
    canvas.addEventListener('webglcontextlost', onContextLost)

    function resize() {
      const activeCanvas = canvasRef.current
      if (!activeCanvas) return
      const width = Math.max(1, activeCanvas.clientWidth)
      const height = Math.max(1, activeCanvas.clientHeight)
      if (activeCanvas.width !== Math.floor(width * renderer.getPixelRatio()) || activeCanvas.height !== Math.floor(height * renderer.getPixelRatio())) {
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
    }

    let previousFrameTime = performance.now()
    const desiredCamera = new THREE.Vector3()
    const desiredLookTarget = new THREE.Vector3()
    let sampleStartedAt = previousFrameTime
    let sampledFrames = 0
    let sampledFrameTimes: number[] = []

    function animate() {
      resize()
      const frameTime = performance.now()
      const rawFrameMs = frameTime - previousFrameTime
      const frameDelta = Math.min(rawFrameMs / 1000, .05)
      previousFrameTime = frameTime
      if (rawFrameMs > 0 && rawFrameMs < 250) sampledFrameTimes.push(rawFrameMs)
      sampledFrames += 1
      if (frameTime - sampleStartedAt >= 1000) {
        const sorted = sampledFrameTimes.slice().sort((a, b) => a - b)
        const elapsed = frameTime - sampleStartedAt
        const sample = { fps: Math.round(sampledFrames * 1000 / elapsed), p95Ms: Number((sorted[Math.floor((sorted.length - 1) * .95)] ?? 0).toFixed(1)) }
        renderCanvas.dataset.renderFps = String(sample.fps)
        renderCanvas.dataset.frameP95Ms = String(sample.p95Ms)
        performanceCallbackRef.current?.(sample)
        sampleStartedAt = frameTime
        sampledFrames = 0
        sampledFrameTimes = []
      }
      const actorAlpha = 1 - Math.exp(-18 * frameDelta)
      const current = snapshotSourceRef.current?.() ?? snapshotRef.current
      const liveActorIds = new Set(current.actors.map(actor => actor.id))
      for (const [id, object] of actors) {
        if (!liveActorIds.has(id)) {
          scene.remove(object)
          disposeObject(object)
          actors.delete(id)
        }
      }
      current.actors.forEach(actor => {
        let object = actors.get(actor.id)
        if (!object) {
          object = actorObject(actor)
          object.position.set(actor.position.x, 0, actor.position.z)
          object.rotation.y = simulationFacingToObjectRotation(actor.facing)
          actors.set(actor.id, object)
          scene.add(object)
        } else {
          object.position.x = snapshotSourceRef.current ? actor.position.x : THREE.MathUtils.lerp(object.position.x, actor.position.x, actorAlpha)
          object.position.z = snapshotSourceRef.current ? actor.position.z : THREE.MathUtils.lerp(object.position.z, actor.position.z, actorAlpha)
          const targetRotation = simulationFacingToObjectRotation(actor.facing)
          object.rotation.y = snapshotSourceRef.current ? targetRotation : lerpAngle(object.rotation.y, targetRotation, actorAlpha)
        }
        const auraGroup = object.getObjectByName('auras')
        if (auraGroup?.userData.signature !== auraSignature(actor)) refreshAuras(object, actor)
        const healthFill = object.getObjectByName('world-health-fill') as THREE.Mesh | undefined
        if (healthFill) {
          const fraction = Math.max(0, Math.min(1, (actor.health ?? 100) / 100))
          healthFill.scale.x = fraction
          healthFill.position.x = -(1 - fraction) * 1.175
        }
      })
      const currentEffects = resolveAttachedEffects(current.effects, current.actors)
      const liveEffectIds = new Set(currentEffects.map(effect => effect.id))
      for (const [id, object] of effects) {
        if (!liveEffectIds.has(id)) {
          scene.remove(object)
          disposeObject(object)
          effects.delete(id)
        }
      }
      currentEffects.forEach(effect => {
        let object = effects.get(effect.id)
        if (!object) {
          object = effectObject(effect)
          effects.set(effect.id, object)
          scene.add(object)
        }
        const target = effect.target ?? effect.position
        const x = THREE.MathUtils.lerp(effect.position.x, target.x, effect.progress)
        const z = THREE.MathUtils.lerp(effect.position.z, target.z, effect.progress)
        const groundEffect = effect.kind === 'pulse' || effect.kind.startsWith('ground-') || effect.kind === 'lane' || effect.kind === 'dome'
        const projectileHeight = THREE.MathUtils.lerp(effect.originHeight ?? 1.1, effect.targetHeight ?? 1.1, effect.progress)
          + Math.sin(effect.progress * Math.PI) * (effect.projectileShape === 'arrow' ? .75 : effect.projectileShape === 'spear' ? .45 : .18)
        const y = groundEffect ? .08 : effect.kind === 'arrow' ? .18 : projectileHeight
        if (object.userData.positionReady) {
          object.position.x = THREE.MathUtils.lerp(object.position.x, x, actorAlpha)
          object.position.y = THREE.MathUtils.lerp(object.position.y, y, actorAlpha)
          object.position.z = THREE.MathUtils.lerp(object.position.z, z, actorAlpha)
        } else {
          object.position.set(x, y, z)
          object.userData.positionReady = true
        }
        if (effect.kind === 'pulse') {
          const scale = .72 + effect.progress * .35
          object.scale.setScalar(THREE.MathUtils.lerp(object.scale.x, scale, actorAlpha))
        }
        if (effect.kind === 'projectile-impact') {
          const pulse = Math.sin(effect.progress * Math.PI)
          object.scale.setScalar(Math.max(.05, pulse))
        }
        const fill = object.getObjectByName('effect-fill')
        if (fill) fill.visible = effect.filled !== false
        if (effect.kind === 'arrow' && effect.target) object.rotation.y = -Math.atan2(effect.target.x - effect.position.x, -(effect.target.z - effect.position.z))
        if (effect.kind === 'lane' && effect.target) {
          object.position.x = (effect.position.x + effect.target.x) / 2
          object.position.z = (effect.position.z + effect.target.z) / 2
          object.rotation.z = Math.atan2(effect.target.z - effect.position.z, effect.target.x - effect.position.x)
        }
        if ((effect.kind === 'projectile' || effect.kind === 'cosmetic-projectile') && effect.target) object.rotation.y = -Math.atan2(effect.target.z - effect.position.z, effect.target.x - effect.position.x)
      })
      const currentMarkers = current.markers ?? []
      const liveMarkerIds = new Set(currentMarkers.map(marker => marker.id))
      for (const [id, object] of markers) {
        if (!liveMarkerIds.has(id)) {
          scene.remove(object)
          disposeObject(object)
          markers.delete(id)
        }
      }
      currentMarkers.forEach(marker => {
        let object = markers.get(marker.id)
        if (!object) {
          object = markerObject(marker)
          markers.set(marker.id, object)
          scene.add(object)
        }
        object.position.set(marker.position.x, 0, marker.position.z)
        const wobbleTime = frameTime / 1000 + Number(object.userData.wobblePhase ?? 0)
        object.rotation.x = Math.sin(wobbleTime * 1.7) * .025
        object.rotation.z = Math.cos(wobbleTime * 1.35) * .035
        const symbol = object.children[2]
        if (symbol) symbol.rotation.y = Math.sin(wobbleTime * .9) * .12
      })
      if (import.meta.env.DEV) {
        renderCanvas.dataset.worldMarkerCount = String(currentMarkers.length)
        renderCanvas.dataset.markerWobbleSample = String(markers.values().next().value?.rotation.z ?? 0)
        renderCanvas.dataset.cosmeticCastCount = String(current.effects.filter(effect => effect.kind === 'cosmetic-projectile').length)
        renderCanvas.dataset.playerMainEffectCount = String(current.effects.filter(effect => effect.id.startsWith('player-main') || effect.id.startsWith('contract-player-main')).length)
      }
      const player = current.actors.find(actor => actor.kind === 'player')
      if (player) {
        const renderedPlayer = actors.get(player.id)
        const playerX = renderedPlayer?.position.x ?? player.position.x
        const playerZ = renderedPlayer?.position.z ?? player.position.z
        const renderedFacing = renderedPlayer ? objectRotationToSimulationFacing(renderedPlayer.rotation.y) : player.facing
        if (import.meta.env.DEV) {
          const facingValue = player.facing.toFixed(4)
          const xValue = player.position.x.toFixed(3)
          const zValue = player.position.z.toFixed(3)
          if (renderCanvas.dataset.playerFacing !== facingValue) renderCanvas.dataset.playerFacing = facingValue
          if (renderCanvas.dataset.playerX !== xValue) renderCanvas.dataset.playerX = xValue
          if (renderCanvas.dataset.playerZ !== zValue) renderCanvas.dataset.playerZ = zValue
          const cameraTargetX = playerX.toFixed(3)
          const cameraTargetZ = playerZ.toFixed(3)
          if (renderCanvas.dataset.cameraTargetX !== cameraTargetX) renderCanvas.dataset.cameraTargetX = cameraTargetX
          if (renderCanvas.dataset.cameraTargetZ !== cameraTargetZ) renderCanvas.dataset.cameraTargetZ = cameraTargetZ
        }
        const yaw = renderedFacing + cameraYawOffset
        const zoom = settingsRef.current.zoom
        desiredCamera.set(
          playerX - Math.sin(yaw) * zoom,
          3.2 + zoom * (.38 + cameraPitch),
          playerZ + Math.cos(yaw) * zoom,
        )
        camera.position.copy(desiredCamera)
        desiredLookTarget.set(playerX, 1.35, playerZ)
        camera.lookAt(desiredLookTarget)
      }
      renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

    return () => {
      renderer.setAnimationLoop(null)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('blur', clearPointerState)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      disposeObject(scene)
      renderer.dispose()
    }
  }, [recoveryKey, rendererFactory])

  if (rendererFailure) return <section className="train3d-renderer-failure" role="alert" aria-label="3D renderer recovery">
    <strong>3D view unavailable</strong><p>{rendererFailure}</p><button type="button" onClick={() => { setRendererFailure(undefined); setRecoveryKey(value => value + 1) }}>Retry renderer</button>
  </section>
  return <canvas ref={canvasRef} tabIndex={0} aria-label="Third-person 3D training arena" />
}
