import type { AuraTone } from './train3d/types'

export default function AuraIcons({ tones, label }: { tones: readonly AuraTone[]; label: string }) {
  return <span className="platform-aura-icons" role="img" aria-label={label}>
    {tones.map((tone, index) => <i key={`${tone}-${index}`} className={`platform-aura-icon ${tone}`} aria-hidden="true" />)}
  </span>
}
