import { useCallback, useEffect, useState } from 'react'
import { keyLabel, type MovementKeyBindings } from './trainingSettings'

type ContractRole = 'ranged' | 'tank'

export default function ContractActionBar({ keyBindings, eventIndex }: { keyBindings: MovementKeyBindings; eventIndex: number }) {
  const [role, setRole] = useState<ContractRole>('ranged')
  const [health, setHealth] = useState(68)
  const [potionUsed, setPotionUsed] = useState(false)
  const [shieldUsed, setShieldUsed] = useState(false)
  const [shieldCooldown, setShieldCooldown] = useState(0)
  const [tauntCooldown, setTauntCooldown] = useState(0)
  const [mainCast, setMainCast] = useState(0)
  const [casts, setCasts] = useState(0)
  const [taunts, setTaunts] = useState(0)

  useEffect(() => {
    setHealth(68)
    setPotionUsed(false)
    if (role !== 'tank') setShieldUsed(false)
  }, [eventIndex, role])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHealth(value => Math.max(15, value - .12))
      setShieldCooldown(value => Math.max(0, value - .1))
      setTauntCooldown(value => Math.max(0, value - .1))
      setMainCast(value => {
        if (value <= 0) return 0
        const next = Math.max(0, value - .1)
        if (next === 0) setCasts(count => count + 1)
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [])

  const mainAbility = useCallback(() => setMainCast(value => value > 0 ? value : 1), [])
  const potion = useCallback(() => {
    if (potionUsed) return
    setPotionUsed(true); setHealth(100)
  }, [potionUsed])
  const shield = useCallback(() => {
    if (role === 'tank') {
      if (shieldCooldown > 0) return
      setShieldCooldown(20); setHealth(100)
    } else {
      if (shieldUsed) return
      setShieldUsed(true); setHealth(100)
    }
  }, [role, shieldCooldown, shieldUsed])
  const taunt = useCallback(() => {
    if (role !== 'tank' || tauntCooldown > 0) return
    setTauntCooldown(8); setTaunts(value => value + 1)
  }, [role, tauntCooldown])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.code === keyBindings.mainAbility) mainAbility()
      else if (event.code === keyBindings.healthPot) potion()
      else if (event.code === keyBindings.shield) shield()
      else if (event.code === keyBindings.taunt) taunt()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keyBindings, mainAbility, potion, shield, taunt])

  const shieldUnavailable = role === 'tank' ? shieldCooldown > 0 : shieldUsed
  return <section className="contract-action-panel" aria-label="Contract combat actions">
    <header><strong>Combat contract</strong><label>Role <select aria-label="Contract player role" value={role} onChange={event => setRole(event.target.value as ContractRole)}><option value="ranged">Ranged DPS</option><option value="tank">Tank</option></select></label></header>
    <div className="contract-resource-row"><span>Health</span><div><i style={{ width: `${health}%` }} /></div><b>{Math.round(health)}%</b></div>
    {mainCast > 0 && <div className="contract-cast" role="progressbar" aria-label="Main ability cast" aria-valuenow={1 - mainCast} aria-valuemin={0} aria-valuemax={1}><i style={{ width: `${(1 - mainCast) * 100}%` }} />Main ability {mainCast.toFixed(1)}s</div>}
    <div className="contract-action-buttons">
      <button type="button" onClick={mainAbility} disabled={mainCast > 0}>Main ability <kbd>{keyLabel(keyBindings.mainAbility)}</kbd><small>{casts} cast</small></button>
      <button type="button" onClick={taunt} disabled={role !== 'tank' || tauntCooldown > 0}>Taunt / Spott <kbd>{keyLabel(keyBindings.taunt)}</kbd><small>{role !== 'tank' ? 'tank only' : tauntCooldown > 0 ? `${tauntCooldown.toFixed(1)}s` : `${taunts} swaps`}</small></button>
      <button type="button" onClick={shield} disabled={shieldUnavailable}>Shield <kbd>{keyLabel(keyBindings.shield)}</kbd><small>{role === 'tank' ? shieldCooldown > 0 ? `${shieldCooldown.toFixed(1)}s` : '20s cooldown' : shieldUsed ? 'used this round' : 'one per round'}</small></button>
      <button type="button" onClick={potion} disabled={potionUsed}>Health potion <kbd>{keyLabel(keyBindings.healthPot)}</kbd><small>{potionUsed ? 'used this round' : 'one per round'}</small></button>
    </div>
  </section>
}
