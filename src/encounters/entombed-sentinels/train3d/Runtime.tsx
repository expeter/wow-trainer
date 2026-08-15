import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import TrainingHud from '../../../platform/TrainingHud'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { keyLabel } from '../../../platform/trainingSettings'
import { train3dArenas } from './arenas'
import { train3dScenarios } from './scenarios'

type DrillState = 'active' | 'success' | 'failed' | 'expired'
const DRILL_SECONDS = 28

export default function SentinelsTrain3D({ scenarioId, keyBindings, hudSettings, onExit }: EncounterRuntimeProps) {
  const scenario = useMemo(() => train3dScenarios.find(item => item.id === scenarioId) ?? train3dScenarios[0], [scenarioId])
  const arena = train3dArenas.find(item => item.id === scenario.arenaId) ?? train3dArenas[0]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resetRef = useRef(0)
  const [resetVersion, setResetVersion] = useState(0)
  const [drillState, setDrillState] = useState<DrillState>('active')
  const [secondsRemaining, setSecondsRemaining] = useState(DRILL_SECONDS)
  const [position, setPosition] = useState({ x: -22, z: 0 })

  useEffect(() => {
    const activeCanvas = canvasRef.current
    if (!activeCanvas) return

    const renderer = new THREE.WebGLRenderer({ canvas: activeCanvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x070b12)
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x070b12, 65, 105)
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 180)
    camera.position.set(0, 54, 57)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight(0xb9ffe4, 0x142016, 2.2))
    const keyLight = new THREE.DirectionalLight(0xe7ffd7, 2.4)
    keyLight.position.set(-12, 30, 18)
    scene.add(keyLight)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(arena.width, arena.depth),
      new THREE.MeshStandardMaterial({ color: 0x17211b, roughness: 0.92, metalness: 0.05 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)
    const grid = new THREE.GridHelper(arena.width, 20, 0x5d8b66, 0x29382d)
    grid.position.y = 0.03
    scene.add(grid)

    const acidField = new THREE.Mesh(new THREE.PlaneGeometry(48, arena.depth - 2), new THREE.MeshBasicMaterial({ color: 0x1c6d45, transparent: true, opacity: 0.19 }))
    acidField.rotation.x = -Math.PI / 2
    acidField.position.set(-25, 0.05, 0)
    scene.add(acidField)
    const bloodField = new THREE.Mesh(new THREE.PlaneGeometry(48, arena.depth - 2), new THREE.MeshBasicMaterial({ color: 0x78323f, transparent: true, opacity: 0.16 }))
    bloodField.rotation.x = -Math.PI / 2
    bloodField.position.set(25, 0.05, 0)
    scene.add(bloodField)

    function actor(color: number, x: number, z: number, radius = 2) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 2.2, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.22 }))
      mesh.position.set(x, 1.1, z)
      scene.add(mesh)
      return mesh
    }

    actor(0x6ed89a, -30, 0, 3.2)
    actor(0xd66b78, 30, 0, 3.2)
    const correctPartner = actor(0x78e9ad, 0, -18, 1.7)
    const wrongPartner = actor(0xe67a8d, 0, 18, 1.7)
    const player = actor(0xf2d36b, -22, 0, 1.4)
    const meetingRing = new THREE.Mesh(new THREE.RingGeometry(3.3, 4.1, 40), new THREE.MeshBasicMaterial({ color: 0x77e6bd, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }))
    meetingRing.rotation.x = -Math.PI / 2
    meetingRing.position.set(0, 0.08, -18)
    scene.add(meetingRing)

    const pressed = new Set<string>()
    const start = performance.now()
    let previous = start
    let lastUiUpdate = 0
    let state: DrillState = 'active'
    const onKeyDown = (event: KeyboardEvent) => {
      if (Object.values(keyBindings).includes(event.code)) {
        event.preventDefault()
        pressed.add(event.code)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    function resize() {
      const canvas = canvasRef.current
      if (!canvas) return
      const width = Math.max(1, canvas.clientWidth)
      const height = Math.max(1, canvas.clientHeight)
      if (canvas.width !== Math.floor(width * renderer.getPixelRatio()) || canvas.height !== Math.floor(height * renderer.getPixelRatio())) {
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
    }

    function animate(now: number) {
      resize()
      const dt = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (state === 'active') {
        const direction = new THREE.Vector2(
          Number(pressed.has(keyBindings.right)) - Number(pressed.has(keyBindings.left)),
          Number(pressed.has(keyBindings.backward)) - Number(pressed.has(keyBindings.forward)),
        )
        if (direction.lengthSq() > 0) {
          direction.normalize().multiplyScalar(16 * dt)
          player.position.x = THREE.MathUtils.clamp(player.position.x + direction.x, -arena.width / 2 + 2, arena.width / 2 - 2)
          player.position.z = THREE.MathUtils.clamp(player.position.z + direction.y, -arena.depth / 2 + 2, arena.depth / 2 - 2)
        }
        const elapsed = (now - start) / 1000
        if (player.position.distanceTo(correctPartner.position) < 3.3) state = 'success'
        else if (player.position.distanceTo(wrongPartner.position) < 3.3) state = 'failed'
        else if (elapsed >= DRILL_SECONDS) state = 'expired'
        if (now - lastUiUpdate > 80 || state !== 'active') {
          lastUiUpdate = now
          setPosition({ x: player.position.x, z: player.position.z })
          setSecondsRemaining(Math.max(0, DRILL_SECONDS - elapsed))
          setDrillState(state)
        }
      }
      meetingRing.rotation.z += dt * 0.7
      player.rotation.y += dt * 0.8
      renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

    return () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach(material => material.dispose())
        }
      })
      renderer.dispose()
    }
  }, [arena, keyBindings, resetVersion])

  const status = drillState === 'active'
    ? 'You carry 1 green. Reach the 3-green partner in the north sector.'
    : drillState === 'success'
      ? 'Resolved: the pair reached exactly four green.'
      : drillState === 'failed'
        ? 'Wrong collision: that partner does not complete your toxin.'
        : 'The 28-second matching window expired.'

  function restart() {
    resetRef.current += 1
    setPosition({ x: -22, z: 0 })
    setSecondsRemaining(DRILL_SECONDS)
    setDrillState('active')
    setResetVersion(resetRef.current)
  }

  return <main className="training-shell train3d-runtime">
    <header className="training-header">
      <div>
        <p className="eyebrow">ENTOMBED SENTINELS · TRAIN 3D</p>
        <h1>{scenario.name}</h1>
        <p className="lede">Move from the Acid side to the compatible partner. The world arena is independent from the Learn 2D diagram.</p>
      </div>
      <button type="button" className="secondary" onClick={onExit}>Back to setup</button>
    </header>
    <section className="training-runtime-layout">
      <div className="train3d-stage">
        <canvas ref={canvasRef} tabIndex={0} aria-label="Entombed Sentinels 3D movement arena" onPointerDown={event => event.currentTarget.focus()} />
        <p className="train3d-controls">
          Move {keyLabel(keyBindings.forward)} {keyLabel(keyBindings.left)} {keyLabel(keyBindings.backward)} {keyLabel(keyBindings.right)} · Gold: you · Green: correct partner · Red: wrong partner
        </p>
      </div>
      <div className="training-sidecar">
        <TrainingHud settings={hudSettings} mode="Train 3D" objective="Reach the 3-green partner in the north sector" secondsRemaining={secondsRemaining} position={position} status={status} />
        {drillState !== 'active' && <button type="button" className="training-restart" onClick={restart}>Restart drill</button>}
      </div>
    </section>
  </main>
}
