import { useEffect, useRef, useState } from 'react'
import type { ContractPlayerRole } from './contractRoom'

export type ContractPullPhase = 'setup' | 'countdown' | 'active'

export function useContractPullGate() {
  const [role, setRole] = useState<ContractPlayerRole>('ranged')
  const [phase, setPhase] = useState<ContractPullPhase>('setup')
  const [seconds, setSeconds] = useState(3)
  const phaseRef = useRef<ContractPullPhase>('setup')
  phaseRef.current = phase

  useEffect(() => {
    if (phase !== 'countdown') return
    const started = performance.now()
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 3 - (performance.now() - started) / 1000)
      setSeconds(remaining)
      if (remaining <= 0) {
        window.clearInterval(timer)
        phaseRef.current = 'active'
        setPhase('active')
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [phase])

  const start = () => { setSeconds(3); phaseRef.current = 'countdown'; setPhase('countdown') }
  return { role, setRole, phase, phaseRef, seconds, start }
}

export function ContractPullOverlay({ role, onRoleChange, phase, seconds, onStart, mode }: {
  role: ContractPlayerRole
  onRoleChange: (role: ContractPlayerRole) => void
  phase: ContractPullPhase
  seconds: number
  onStart: () => void
  mode: 'Learn 2D' | 'Train 3D'
}) {
  if (phase === 'active') return null
  if (phase === 'countdown') return <div className="contract-pull-overlay countdown" role="status" aria-label="Pull countdown"><strong>{Math.max(1, Math.ceil(seconds))}</strong><span>{mode === 'Train 3D' ? 'Camera look available · movement and actions locked' : 'Movement and actions locked'}</span></div>
  return <div className="contract-pull-overlay setup" role="dialog" aria-label="Contract room entrance">
    <p className="eyebrow">BEFORE THE PULL</p><h2>Choose your training role</h2>
    <p>The raid composition adjusts to remain exactly two tanks. Your role is locked after the pull begins.</p>
    <label>Player role<select value={role} onChange={event => onRoleChange(event.target.value as ContractPlayerRole)}><option value="ranged">Ranged damage</option><option value="tank">Tank</option></select></label>
    <button type="button" onClick={onStart}>Start 3…2…1</button>
  </div>
}
