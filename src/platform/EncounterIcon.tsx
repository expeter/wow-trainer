interface EncounterIconProps {
  name: string
  imageSrc?: string
}

function encounterInitials(name: string) {
  const words = name.replace(/[’']/g, '').split(/\s+/).filter(word => word && !['the', 'of'].includes(word.toLowerCase()))
  return words.length > 1 ? `${words[0][0]}${words[1][0]}`.toUpperCase() : words[0]?.slice(0, 2).toUpperCase() ?? '??'
}

export default function EncounterIcon({ name, imageSrc }: EncounterIconProps) {
  return <span className="encounter-icon" aria-hidden="true">
    {imageSrc ? <img src={imageSrc} alt="" /> : encounterInitials(name)}
  </span>
}
