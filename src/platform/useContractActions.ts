import { useCallback, useEffect, useRef, useState } from 'react'
import type { ContractPlayerRole } from './contractRoom'
import type { MovementKeyBindings } from './trainingSettings'

export function useContractActions({ enabled, paused = false, role, eventIndex, keyBindings, includeMainAndPotion }: { enabled: boolean; paused?: boolean; role: ContractPlayerRole; eventIndex: number; keyBindings: MovementKeyBindings; includeMainAndPotion: boolean }) {
  const [health, setHealth] = useState(72)
  const [shieldCooldown, setShieldCooldown] = useState(0)
  const [potionUsed, setPotionUsed] = useState(false)
  const [mainCast, setMainCast] = useState(0)
  const [mainProjectileAge, setMainProjectileAge] = useState(-1)
  const mainCastEndsAtRef = useRef(0)
  const mainWasActiveRef = useRef(false)
  const mainProjectileStartedAtRef = useRef(0)
  const pausedRef = useRef(paused)
  const pausedCastRemainingRef = useRef(0)
  const pausedAtRef = useRef(0)

  const mainCastSecondsSource = useCallback(() => pausedRef.current ? pausedCastRemainingRef.current : Math.max(0, (mainCastEndsAtRef.current - performance.now()) / 1000), [])

  const activateMain = useCallback(() => {
    if (!enabled || pausedRef.current || !includeMainAndPotion || mainCastSecondsSource() > 0) return false
    mainCastEndsAtRef.current = performance.now() + 1000
    mainWasActiveRef.current = true
    mainProjectileStartedAtRef.current = 0
    setMainProjectileAge(-1)
    setMainCast(1)
    return true
  }, [enabled, includeMainAndPotion, mainCastSecondsSource])

  useEffect(() => {
    setHealth(72)
    setPotionUsed(false)
    mainCastEndsAtRef.current = 0
    mainWasActiveRef.current = false
    mainProjectileStartedAtRef.current = 0
    setMainCast(0)
    setMainProjectileAge(-1)
    if (role !== 'tank') setShieldCooldown(0)
  }, [eventIndex, role])
  useEffect(() => {
    if (paused && !pausedRef.current) {
      pausedCastRemainingRef.current = mainCastSecondsSource()
      pausedAtRef.current = performance.now()
      pausedRef.current = true
    } else if (!paused && pausedRef.current) {
      const pausedFor = performance.now() - pausedAtRef.current
      pausedRef.current = false
      if (pausedCastRemainingRef.current > 0) mainCastEndsAtRef.current = performance.now() + pausedCastRemainingRef.current * 1000
      if (mainProjectileStartedAtRef.current) mainProjectileStartedAtRef.current += pausedFor
      pausedCastRemainingRef.current = 0
      pausedAtRef.current = 0
    }
  }, [mainCastSecondsSource, paused])
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => {
      if (pausedRef.current) return
      setHealth(value => Math.max(18, value - .1))
      setShieldCooldown(value => Math.max(0, value - .1))
      const remaining = mainCastSecondsSource()
      setMainCast(remaining)
      if (mainWasActiveRef.current && remaining <= 0) {
        mainWasActiveRef.current = false
        mainProjectileStartedAtRef.current = performance.now()
      }
      setMainProjectileAge(mainProjectileStartedAtRef.current ? (performance.now() - mainProjectileStartedAtRef.current) / 1000 : -1)
    }, 100)
    return () => window.clearInterval(timer)
  }, [enabled, mainCastSecondsSource])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || pausedRef.current || event.repeat) return
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

  return { health, mainCast, mainCastSecondsSource, mainProjectileAge, potionUsed, shieldCooldown, activateMain }
}
