import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { TrainingCameraSettings } from '../trainingSettings'
import type { ActorSnapshot, EffectSnapshot, Train3DSnapshot } from './types'

interface ThreeWorldRendererProps {
  snapshot: Train3DSnapshot
  cameraSettings: TrainingCameraSettings
  onCameraSettingsChange: (settings: TrainingCameraSettings) => void
  onPlayerLook: (yawDelta: number) => void
  onBothButtonsForward: (active: boolean) => void
}

const auraColors = { beneficial: 0x72e5c0, poison: 0x70dc87, danger: 0xe96f80, spectral: 0x9d83f2 } as const

function disposeObject(object: THREE.Object3D) {
  object.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => material.dispose())
    }
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
    const facing = new THREE.Mesh(new THREE.ConeGeometry(.38, 1.3, 10), new THREE.MeshBasicMaterial({ color: 0xffe58a }))
    facing.rotation.x = Math.PI / 2
    facing.position.set(0, .18, -.95)
    group.add(facing)
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
    icon.position.set((index - (icons.length - 1) / 2) * .62, actor.kind === 'boss' ? 6.5 : 3.25, 0)
    auraGroup.add(icon)
  })
  auraGroup.userData.signature = JSON.stringify(actor.auras)
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

export default function ThreeWorldRenderer({ snapshot, cameraSettings, onCameraSettingsChange, onPlayerLook, onBothButtonsForward }: ThreeWorldRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snapshotRef = useRef(snapshot)
  const settingsRef = useRef(cameraSettings)
  const settingsCallbackRef = useRef(onCameraSettingsChange)
  const lookCallbackRef = useRef(onPlayerLook)
  const bothButtonsCallbackRef = useRef(onBothButtonsForward)
  snapshotRef.current = snapshot
  settingsRef.current = cameraSettings
  settingsCallbackRef.current = onCameraSettingsChange
  lookCallbackRef.current = onPlayerLook
  bothButtonsCallbackRef.current = onBothButtonsForward

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    const onPointerDown = (event: PointerEvent) => {
      mouseButtons.add(event.button)
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      canvas.setPointerCapture(event.pointerId)
      updateBothButtons()
    }
    const onPointerUp = (event: PointerEvent) => {
      mouseButtons.delete(event.button)
      if (!mouseButtons.size) dragging = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      updateBothButtons()
    }
    const onPointerMove = (event: PointerEvent) => {
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
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

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

    function animate() {
      resize()
      const current = snapshotRef.current
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
          actors.set(actor.id, object)
          scene.add(object)
        }
        object.position.set(actor.position.x, 0, actor.position.z)
        object.rotation.y = actor.facing
        const auraGroup = object.getObjectByName('auras')
        if (auraGroup?.userData.signature !== JSON.stringify(actor.auras)) refreshAuras(object, actor)
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
        object.position.set(x, effect.kind === 'projectile' ? 1.1 + Math.sin(effect.progress * Math.PI) * 2 : .08, z)
        if (effect.kind === 'pulse') object.scale.setScalar(.72 + effect.progress * .35)
      })
      const player = current.actors.find(actor => actor.kind === 'player')
      if (player) {
        const yaw = player.facing + cameraYawOffset
        const zoom = settingsRef.current.zoom
        camera.position.set(
          player.position.x - Math.sin(yaw) * zoom,
          3.2 + zoom * (.38 + cameraPitch),
          player.position.z + Math.cos(yaw) * zoom,
        )
        camera.lookAt(player.position.x, 1.35, player.position.z)
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
      disposeObject(scene)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} tabIndex={0} aria-label="Third-person 3D training arena" />
}
