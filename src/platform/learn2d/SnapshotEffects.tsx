import type { CSSProperties } from 'react'
import type { EffectSnapshot } from '../train3d/types'

interface SnapshotEffectsProps {
  effects: readonly EffectSnapshot[]
  width: number
  depth: number
}

/** Shared Learn 2D projection for the same effect vocabulary consumed by Train 3D. */
export default function SnapshotEffects({ effects, width, depth }: SnapshotEffectsProps) {
  const xPercent = (value: number) => 50 + value / width * 100
  const zPercent = (value: number) => 50 + value / depth * 100
  const effectClass = (kind: EffectSnapshot['kind']) => kind === 'ground-soak' ? 'soak' : kind === 'ground-spread' ? 'spread' : kind === 'arrow' ? 'arrow' : kind.includes('projectile') ? 'projectile' : kind === 'dome' ? 'dome' : kind === 'pulse' ? 'pulse' : 'harmful'

  return <>{effects.map(effect => {
    const rendered = effect.target ? {
      x: effect.position.x + (effect.target.x - effect.position.x) * effect.progress,
      z: effect.position.z + (effect.target.z - effect.position.z) * effect.progress,
    } : effect.position
    return <div
      key={effect.id}
      data-effect-id={effect.id}
      data-effect-kind={effect.kind}
      data-effect-intent={effect.kind === 'ground-soak' ? 'soak' : effect.kind === 'ground-harmful' || effect.kind === 'ground-spread' ? 'avoid' : undefined}
      data-projectile-shape={effect.projectileShape}
      className={`nekzali-2d-effect ${effectClass(effect.kind)}${effect.filled === false ? ' outline' : ''}`}
      style={{ left: `${xPercent(rendered.x)}%`, top: `${zPercent(rendered.z)}%`, width: `${effect.radius / width * 200}%`, aspectRatio: '1', '--effect-color': effect.color, '--effect-rotation': effect.target ? `${Math.atan2(effect.target.z - effect.position.z, effect.target.x - effect.position.x)}rad` : '0rad' } as CSSProperties}
    >{effect.kind === 'arrow' ? '➜' : ''}</div>
  })}</>
}
