interface RaidLeadTelegraphProps {
  current: string
  nextLabel: string
  nextSeconds: number
}

export default function RaidLeadTelegraph({ current, nextLabel, nextSeconds }: RaidLeadTelegraphProps) {
  return <div className="learn2d-raidlead-telegraph" aria-label="Raid lead mechanic telegraph">
    <small>Now</small>
    <strong>{current}</strong>
    <span>Next · {nextLabel} {Math.max(0, Math.ceil(nextSeconds))}s</span>
  </div>
}
