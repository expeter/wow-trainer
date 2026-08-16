import type { CSSProperties } from 'react'
import AuraIcons from '../AuraIcons'
import type { ActorSnapshot } from '../train3d/types'

interface SnapshotActorsProps {
  actors: readonly ActorSnapshot[]
  xPercent: (value: number) => number
  zPercent: (value: number) => number
  time: number
  kinds?: readonly ActorSnapshot['kind'][]
}

export function SnapshotActorAuras({ actor, time }: { actor: ActorSnapshot; time: number }) {
  const tones = actor.auras.flatMap(aura => Array.from({ length: aura.stacks }, () => aura.tone))
  const timer = actor.auras.find(aura => aura.expiresAt !== undefined && aura.expiresAt > time)
  return <>
    {tones.length > 0 && <AuraIcons tones={tones} label={actor.auras.map(aura => `${aura.stacks} ${aura.id}`).join(', ')} />}
    {timer && <i className="attached-aura-timer">{timer.label ?? timer.id} {Math.max(0, timer.expiresAt! - time).toFixed(1)}s</i>}
  </>
}

/** Shared tactical actor presentation. Encounter packages supply state, not markup. */
export default function SnapshotActors({ actors, xPercent, zPercent, time, kinds = ['ally'] }: SnapshotActorsProps) {
  return <>{actors.filter(actor => kinds.includes(actor.kind)).map(actor => {
    return <div
      key={actor.id}
      className={`contract-raid-member ${actor.role ?? 'ranged'}`}
      data-actor-id={actor.id}
      data-actor-role={actor.role}
      data-player-class={actor.playerClass}
      style={{ left: `${xPercent(actor.position.x)}%`, top: `${zPercent(actor.position.z)}%`, '--actor-color': actor.color } as CSSProperties}
      aria-label={`${actor.role ?? actor.kind} NPC`}
    >
      <span />
      <SnapshotActorAuras actor={actor} time={time} />
    </div>
  })}</>
}
