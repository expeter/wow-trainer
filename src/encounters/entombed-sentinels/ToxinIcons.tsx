interface ToxinIconsProps {
  green: number
  red: number
}

export default function ToxinIcons({ green, red }: ToxinIconsProps) {
  return <span className="toxin-icons" role="img" aria-label={`${green} green toxin${green === 1 ? '' : 's'} and ${red} red toxin${red === 1 ? '' : 's'}`}>
    {Array.from({ length: green }, (_, index) => <i className="toxin-icon green" aria-hidden="true" key={`g-${index}`} />)}
    {Array.from({ length: red }, (_, index) => <i className="toxin-icon red" aria-hidden="true" key={`r-${index}`} />)}
  </span>
}
