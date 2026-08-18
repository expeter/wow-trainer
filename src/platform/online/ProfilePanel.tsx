import { useState } from 'react'
import { useOnline } from './OnlineContext'

export default function ProfilePanel() {
  const { session, loading, notice, login, selectCharacter, logout, deleteAccount } = useOnline()
  const [region, setRegion] = useState('eu')
  const [busy, setBusy] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  async function perform(action: () => Promise<void>) {
    setBusy(true); setActionNotice('')
    try { await action() } catch (error) { setActionNotice(error instanceof Error ? error.message : 'The action failed.') }
    finally { setBusy(false) }
  }

  if (loading) return <p className="season2-boundary-note">Checking Battle.net session…</p>
  if (!session.authenticated) return <div className="online-profile-card signed-out">
    <div><p className="eyebrow">OPTIONAL IDENTITY</p><h3>Play anonymously or connect Battle.net</h3><p>Login is only needed to label your private test events and submit feedback without the guild code. Anonymous training remains complete.</p></div>
    <label>Battle.net region<select value={region} onChange={event => setRegion(event.target.value)}><option value="eu">Europe</option><option value="us">Americas</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select></label>
    <button type="button" onClick={() => login(region)}>Connect Battle.net</button>
    {notice && <p className="online-notice" role="status">{notice}</p>}
  </div>

  return <div className="online-profile-card">
    <div><p className="eyebrow">BATTLE.NET CONNECTED</p><h3>{session.selectedCharacter ? `${session.selectedCharacter.name} · ${session.selectedCharacter.realmName}` : 'Select a character'}</h3><p>{session.isMaintainer ? 'Maintainer event access is enabled for this account.' : 'Your selected character labels authenticated test runs and private feedback.'}</p></div>
    <label>Active WoW character<select aria-label="Active WoW character" value={session.selectedCharacterId ?? ''} onChange={event => void perform(() => selectCharacter(Number(event.target.value)))}><option value="" disabled>Select a character…</option>{session.characters?.map(character => <option key={character.id} value={character.id}>{character.name} · {character.realmName}{character.level ? ` · ${character.level}` : ''}</option>)}</select></label>
    <div className="online-profile-actions"><button type="button" className="secondary" disabled={busy} onClick={() => void perform(logout)}>Log out</button><button type="button" className="danger" disabled={busy} onClick={() => { if (window.confirm('Delete the Season 2 online account and its attributed events?')) void perform(deleteAccount) }}>Delete online account</button></div>
    {actionNotice && <p className="online-notice" role="alert">{actionNotice}</p>}
  </div>
}
