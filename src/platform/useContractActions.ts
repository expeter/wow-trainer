import { useCallback, useEffect, useRef, useState } from 'react'
import type { ContractPlayerRole } from './contractRoom'
import { encounterActionBinding, useEncounterActionInput, type BoundEncounterAction, type EncounterMode } from './encounters'

export function useContractActions({ enabled, paused = false, role, mode, eventIndex, actions }: { enabled: boolean; paused?: boolean; role: ContractPlayerRole; mode: EncounterMode; eventIndex: number; actions: readonly BoundEncounterAction[] }) {
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
    if (!enabled || pausedRef.current || !encounterActionBinding(actions, 'mainAbility', role, mode) || mainCastSecondsSource() > 0) return false
    mainCastEndsAtRef.current = performance.now() + 1000
    mainWasActiveRef.current = true
    mainProjectileStartedAtRef.current = 0
    setMainProjectileAge(-1)
    setMainCast(1)
    return true
  }, [actions, enabled, mainCastSecondsSource, mode, role])
  const activateShield = useCallback(() => {
    if (role === 'tank' || shieldCooldown <= 0) { setHealth(100); setShieldCooldown(role === 'tank' ? 20 : Number.POSITIVE_INFINITY) }
  }, [role, shieldCooldown])
  const activatePotion = useCallback(() => {
    if (!potionUsed) { setPotionUsed(true); setHealth(100) }
  }, [potionUsed])
  const activateTaunt = useCallback(() => { /* Contract validates availability; encounter packages own threat. */ }, [])

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

  useEncounterActionInput({
    actions, role, mode, enabled, paused,
    handlers: {
      mainAbility: activateMain,
      shield: activateShield,
      taunt: activateTaunt,
      healthPot: activatePotion,
    },
  })

  return { health, mainCast, mainCastSecondsSource, mainProjectileAge, potionUsed, shieldCooldown, activateMain, activateShield, activatePotion, activateTaunt }
}
