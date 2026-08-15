import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { TrainingCameraSettings } from '../trainingSettings'
import type { ActorSnapshot, EffectSnapshot, Train3DSnapshot } from './types'

interface ThreeWorldRendererProps {
  snapshot: Train3DSnapshot
  snapshotSource?: () => Train3DSnapshot
  cameraSettings: TrainingCameraSettings
  onCameraSettingsChange: (settings: TrainingCameraSettings) => void
  onPlayerLook: (yawDelta: number) => void
  onBothButtonsForward: (active: boolean) => void
  onPerformanceSample?: (sample: { fps: number; p95Ms: number }) => void
}

const auraColors = { beneficial: 0x72e5c0, poison: 0x70dc87, danger: 0xe96f80, spectral: 0x9d83f2 } as const

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
    if (child instanceof THREE.Sprite) child.material.dispose()
  })
}

function actorObject(actor: ActorSnapshot) {
  const group = new THREE.Group()
  group.name = actor.id
  const body = new THREE.Mesh(
    actor.kind === 'boss' ? new THREE.CylinderGeometry(2.7, 3.2, 5.8, 20) : new THREE.CapsuleGeometry(.72, 1.35, 5, 12),
    new THREE.MeshStandardMaterial({ color: actor.color, roughness: .64, emissive: actor.color, emissiveIntensity: .12 }),
  )
  body.position.y = actor.kind === 'boss' ? 2.9 : 1.4
  group.add(body)
  if (actor.kind === 'player') {
    const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: .78 }))
    head.position.y = 2.75
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.55, .28, .42), new THREE.MeshStandardMaterial({ color: 0xd8b84f, roughness: .55 }))
    shoulders.position.set(0, 2.05, 0)
    const chest = new THREE.Mesh(new THREE.BoxGeometry(.6, .65, .16), new THREE.MeshBasicMaterial({ color: 0xffef9b }))
    chest.position.set(0, 1.72, -.68)
    const facing = new THREE.Mesh(new THREE.ConeGeometry(.55, 1.35, 3), new THREE.MeshBasicMaterial({ color: 0xffe58a, transparent: true, opacity: .92, depthWrite: false }))
    facing.name = 'facing-chevron'
    facing.rotation.x = -Math.PI / 2
    facing.position.set(0, .09, -1.25)
    group.add(head, shoulders, chest, facing)
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
  const icons = actor.auras.flatMap(aura => Array.from({ length: aura.stacks }, (_, index) => ({ ...aura, index })))
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
  if (effect.kind === 'projectile') {
    return new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 8), new THREE.MeshBasicMaterial({ color: effect.color }))
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(Math.max(.1, effect.radius - .35), effect.radius, 40),
    new THREE.MeshBasicMaterial({ color: effect.color, side: THREE.DoubleSide, transparent: true, opacity: .65 }),
  )
  ring.rotation.x = -Math.PI / 2
  return ring
}

export default function ThreeWorldRenderer({ snapshot, snapshotSource, cameraSettings, onCameraSettingsChange, onPlayerLook, onBothButtonsForward, onPerformanceSample }: ThreeWorldRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    if (import.meta.env.DEV) canvas.dataset.playerMarker = 'humanoid-chevron'
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x070b12)
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x070b12, 52, 96)
    const camera = new THREE.PerspectiveCamera(58, 1, .1, 160)
    scene.add(new THREE.HemisphereLight(0xc5ffe1, 0x172018, 2.3))
    const light = new THREE.DirectionalLight(0xf1ffe5, 2.1)
    light.position.set(-18, 30, 14)
    scene.add(light)

    const arena = snapshotRef.current.arena
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(arena.width, arena.depth),
      new THREE.MeshStandardMaterial({ color: 0x18221b, roughness: .9 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)
    const grid = new THREE.GridHelper(arena.width, 24, 0x609068, 0x293a2d)
    grid.position.y = .03
    scene.add(grid)

    const actors = new Map<string, THREE.Group>()
    const effects = new Map<string, THREE.Object3D>()
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
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', clearPointerState)

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
      })
      const liveEffectIds = new Set(current.effects.map(effect => effect.id))
      for (const [id, object] of effects) {
        if (!liveEffectIds.has(id)) {
          scene.remove(object)
          disposeObject(object)
          effects.delete(id)
        }
      }
      current.effects.forEach(effect => {
        let object = effects.get(effect.id)
        if (!object) {
          object = effectObject(effect)
          effects.set(effect.id, object)
          scene.add(object)
        }
        const target = effect.target ?? effect.position
        const x = THREE.MathUtils.lerp(effect.position.x, target.x, effect.progress)
        const z = THREE.MathUtils.lerp(effect.position.z, target.z, effect.progress)
        const y = effect.kind === 'projectile' ? 1.1 + Math.sin(effect.progress * Math.PI) * 2 : .08
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
      })
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
      disposeObject(scene)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} tabIndex={0} aria-label="Third-person 3D training arena" />
}
