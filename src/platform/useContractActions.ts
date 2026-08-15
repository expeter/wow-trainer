import { useCallback, useEffect, useState } from 'react'
import type { ContractPlayerRole } from './contractRoom'
import type { MovementKeyBindings } from './trainingSettings'

export function useContractActions({ enabled, role, eventIndex, keyBindings, includeMainAndPotion }: { enabled: boolean; role: ContractPlayerRole; eventIndex: number; keyBindings: MovementKeyBindings; includeMainAndPotion: boolean }) {
  const [health, setHealth] = useState(72)
  const [shieldCooldown, setShieldCooldown] = useState(0)
  const [potionUsed, setPotionUsed] = useState(false)
  const [mainCast, setMainCast] = useState(0)

  const activateMain = useCallback(() => {
    if (!enabled || !includeMainAndPotion || mainCast > 0) return false
    setMainCast(1)
    return true
  }, [enabled, includeMainAndPotion, mainCast])

  useEffect(() => {
    setHealth(72)
    setPotionUsed(false)
    setMainCast(0)
    if (role !== 'tank') setShieldCooldown(0)
  }, [eventIndex, role])
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => {
      setHealth(value => Math.max(18, value - .1))
      setShieldCooldown(value => Math.max(0, value - .1))
      setMainCast(value => Math.max(0, value - .1))
    }, 100)
    return () => window.clearInterval(timer)
  }, [enabled])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || event.repeat) return
      if (event.code === keyBindings.shield && (role === 'tank' || shieldCooldown <= 0)) {
        setHealth(100); setShieldCooldown(role === 'tank' ? 20 : Number.POSITIVE_INFINITY)
      } else if (event.code === keyBindings.taunt && role === 'tank') {
        // The contract room validates availability; encounter packages own threat outcomes.
      } else if (event.code === keyBindings.mainAbility && activateMain()) {
      } else if (includeMainAndPotion && event.code === keyBindings.healthPot && !potionUsed) {
        setPotionUsed(true); setHealth(100)
      } else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activateMain, enabled, includeMainAndPotion, keyBindings, potionUsed, role, shieldCooldown])

  return { health, mainCast, potionUsed, shieldCooldown, activateMain }
}
