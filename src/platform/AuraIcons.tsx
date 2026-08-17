import type { AuraTone } from './train3d/types'

export interface AuraIconEntry { tone: AuraTone; stacks?: number }

export default function AuraIcons({ entries, label }: { entries: readonly AuraIconEntry[]; label: string }) {
  return <span className="platform-aura-icons" role="img" aria-label={label}>
    {entries.map((entry, index) => <i key={`${entry.tone}-${index}`} className={`platform-aura-icon ${entry.tone}`} aria-hidden="true">{entry.stacks && entry.stacks > 1 ? <b>{entry.stacks}</b> : null}</i>)}
  </span>
}
