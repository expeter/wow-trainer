const avatar = new URL('../../images/pestivator-avatar.jpg', import.meta.url).href
const raiderIoProfile = 'https://raider.io/characters/eu/antonidas/Pestivator'
const solanaAddress = 'E684K1q1gzodtZK3xgdBXfTeRQbWWhSu8kVbzZNiw9Cz'

export default function CreatorCard() {
  return <aside className="creator-card" aria-label="About Pestivator">
    <a className="creator-avatar-link" href={raiderIoProfile} target="_blank" rel="noreferrer" aria-label="Pestivator on Raider.IO">
      <img src={avatar} alt="Pestivator's gnome avatar" />
    </a>
    <div>
      <span>Created by</span>
      <strong>Pestivator</strong>
      <a className="battle-tag-link" href={raiderIoProfile} target="_blank" rel="noreferrer" title="BattleTag · open Pestivator on Raider.IO">pestivator#2515</a>
      <nav aria-label="Pestivator links">
        <a href={raiderIoProfile} target="_blank" rel="noreferrer">Raider.IO ↗</a>
        <a href="https://twitch.tv/pestivator" target="_blank" rel="noreferrer" aria-label="Pestivator on Twitch">Twitch.tv ↗</a>
        <a className="coffee-link" href={`solana:${solanaAddress}?label=Pestivator&message=Thanks%20for%20the%20Midnight%20Season%202%20Trainer`} title={`Send SOL to ${solanaAddress}`}>☕ Buy me a coffee</a>
      </nav>
    </div>
  </aside>
}
