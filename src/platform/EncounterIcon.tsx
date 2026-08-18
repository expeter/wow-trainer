import type { CSSProperties } from 'react'

interface EncounterIconProps {
  name: string
  imageSrc?: string
}

const RAID_ORDER_PORTRAITS = new URL('../../inbox/INBOX-20260817-204211-eaae6b.png', import.meta.url).href
const portraitCenters: Readonly<Record<string, readonly [number, number]>> = {
  "Nek'zali the Soulcoiler": [65, 222],
  'Entombed Sentinels': [232, 154],
  'Vashnik the Malignant': [386, 157],
  'The Lost Explorers': [234, 312],
  Sszorak: [390, 307],
  'The Twin Fangs': [570, 227],
  'The Coiled Altar': [707, 227],
  "Ula'tek": [875, 229],
}
const portraitScale = .62

function encounterInitials(name: string) {
  const words = name.replace(/[’']/g, '').split(/\s+/).filter(word => word && !['the', 'of'].includes(word.toLowerCase()))
  return words.length > 1 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : words[0]?.slice(0, 2).toUpperCase() ?? '??'
}

export default function EncounterIcon({ name, imageSrc }: EncounterIconProps) {
  const portrait = portraitCenters[name]
  const portraitStyle = portrait ? {
    backgroundImage: `url(${RAID_ORDER_PORTRAITS})`,
    backgroundPosition: `${21 - portrait[0] * portraitScale}px ${21 - portrait[1] * portraitScale}px`,
    backgroundSize: `${950 * portraitScale}px ${384 * portraitScale}px`,
  } as CSSProperties : undefined
  return <span className={`encounter-icon${portrait ? ' boss-portrait' : ''}`} style={portraitStyle} data-boss-portrait={portrait ? name : undefined} aria-hidden="true">
    {imageSrc ? <img src={imageSrc} alt="" /> : portrait ? null : encounterInitials(name)}
  </span>
}
