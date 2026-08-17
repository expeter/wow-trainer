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
  const compactStacks = new Set(['acid-mark', 'blood-mark', 'empowering-slam', 'bloodvenom-injection'])
  const entries = actor.auras.flatMap(aura => compactStacks.has(aura.id)
    ? [{ tone: aura.tone, stacks: aura.stacks }]
    : Array.from({ length: aura.stacks }, () => ({ tone: aura.tone })))
  const timer = actor.auras.find(aura => aura.expiresAt !== undefined && aura.expiresAt > time)
  return <>
    {entries.length > 0 && <AuraIcons entries={entries} label={actor.auras.map(aura => `${aura.stacks} ${aura.id}`).join(', ')} />}
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
      data-position-x={actor.position.x.toFixed(3)}
      data-position-y={actor.position.z.toFixed(3)}
      style={{ left: `${xPercent(actor.position.x)}%`, top: `${zPercent(actor.position.z)}%`, '--actor-color': actor.color } as CSSProperties}
      aria-label={`${actor.role ?? actor.kind} NPC`}
    >
      <span />
      <SnapshotActorAuras actor={actor} time={time} />
    </div>
  })}</>
}
