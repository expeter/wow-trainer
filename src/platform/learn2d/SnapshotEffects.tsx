import type { CSSProperties } from 'react'
import type { ActorSnapshot, EffectSnapshot } from '../train3d/types'
import { resolveAttachedEffects } from '../encounters/entityState'

interface SnapshotEffectsProps {
  effects: readonly EffectSnapshot[]
  width: number
  depth: number
  actors?: readonly ActorSnapshot[]
}

/** Shared Learn 2D projection for the same effect vocabulary consumed by Train 3D. */
export default function SnapshotEffects({ effects, width, depth, actors = [] }: SnapshotEffectsProps) {
  const xPercent = (value: number) => 50 + value / width * 100
  const zPercent = (value: number) => 50 + value / depth * 100
  const effectClass = (kind: EffectSnapshot['kind']) => kind === 'ground-soak' ? 'soak' : kind === 'ground-spread' ? 'spread' : kind === 'ground-objective' ? 'objective' : kind === 'lane' ? 'lane' : kind === 'arrow' ? 'arrow' : kind.includes('projectile') ? 'projectile' : kind === 'dome' ? 'dome' : kind === 'pulse' ? 'pulse' : 'harmful'

  return <>{resolveAttachedEffects(effects, actors).map(effect => {
    const rendered = effect.target ? {
      x: effect.position.x + (effect.target.x - effect.position.x) * effect.progress,
      z: effect.position.z + (effect.target.z - effect.position.z) * effect.progress,
    } : effect.position
    const laneLength = effect.kind === 'lane' && effect.target ? Math.hypot(effect.target.x - effect.position.x, effect.target.z - effect.position.z) : undefined
    const laneMidpoint = effect.kind === 'lane' && effect.target ? { x: (effect.position.x + effect.target.x) / 2, z: (effect.position.z + effect.target.z) / 2 } : rendered
    return <div
      key={effect.id}
      data-effect-id={effect.id}
      data-effect-kind={effect.kind}
      data-effect-owner={effect.ownerId}
      data-effect-intent={effect.kind === 'ground-soak' ? 'soak' : effect.kind === 'ground-harmful' || effect.kind === 'ground-spread' || effect.kind === 'lane' ? 'avoid' : effect.kind === 'ground-objective' ? 'objective' : undefined}
      data-projectile-shape={effect.projectileShape}
      className={`nekzali-2d-effect ${effectClass(effect.kind)}${effect.filled === false ? ' outline' : ''}`}
      style={{ left: `${xPercent(laneMidpoint.x)}%`, top: `${zPercent(laneMidpoint.z)}%`, width: effect.kind === 'lane' ? `${laneLength! / width * 100}%` : `${effect.radius / width * 200}%`, height: effect.kind === 'lane' ? `${effect.radius / depth * 200}%` : undefined, aspectRatio: effect.kind === 'lane' ? 'auto' : '1', '--effect-color': effect.color, '--effect-rotation': effect.target ? `${Math.atan2(effect.target.z - effect.position.z, effect.target.x - effect.position.x)}rad` : '0rad' } as CSSProperties}
    >{effect.kind === 'arrow' ? '➜' : ''}</div>
  })}</>
}
