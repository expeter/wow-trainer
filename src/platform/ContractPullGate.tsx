import { useEffect, useRef, useState } from 'react'
import { CONTRACT_DEFAULT_PLAYER_SLOT, contractRaidRoster, contractSelectedMember, contractSlotLabel } from './contractRoom'
import { RUNTIME_INPUT_CLEAR_EVENT } from './useRuntimePause'

export type ContractPullPhase = 'setup' | 'countdown' | 'active'

export function useContractPullGate() {
  const [selectedSlotId, setSelectedSlotId] = useState(CONTRACT_DEFAULT_PLAYER_SLOT)
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

  const start = () => { window.dispatchEvent(new Event(RUNTIME_INPUT_CLEAR_EVENT)); setSeconds(3); phaseRef.current = 'countdown'; setPhase('countdown') }
  return { selectedSlotId, setSelectedSlotId, role: contractSelectedMember(selectedSlotId).role, phase, phaseRef, seconds, start, restart: start }
}

export function ContractPullOverlay({ selectedSlotId, onSlotChange, phase, seconds, onStart, mode, title = 'Choose your raid position', description = 'Select one of the 20 abstract raid-plan slots. Its role and temporary class are locked for this lab pull.', assignmentNotice, dialogLabel = 'Contract room entrance', bossLabel = 'Boss' }: {
  selectedSlotId: string
  onSlotChange: (slotId: string) => void
  phase: ContractPullPhase
  seconds: number
  onStart: () => void
  mode: 'Learn 2D' | 'Train 3D'
  title?: string
  description?: string
  assignmentNotice?: string
  dialogLabel?: string
  bossLabel?: string
}) {
  if (phase === 'active') return null
  if (phase === 'countdown') return <div className="contract-pull-overlay countdown" role="status" aria-label="Pull countdown"><strong>{Math.max(1, Math.ceil(seconds))}</strong><span>{mode === 'Train 3D' ? 'Camera look available · movement and actions locked' : 'Movement and actions locked'}</span></div>
  return <div className="contract-pull-overlay setup" role="dialog" aria-label={dialogLabel}>
    <p className="eyebrow">BEFORE THE PULL</p><h2>{title}</h2>
    <p>{description}</p>
    {assignmentNotice && <strong className="contract-assignment-notice">{assignmentNotice}</strong>}
    <div className="contract-position-plan" role="group" aria-label="20-player raid positions">
      {contractRaidRoster.map(member => <button type="button" key={member.id} className={`${member.role}${selectedSlotId === member.id ? ' selected' : ''}`} aria-pressed={selectedSlotId === member.id} aria-label={`${contractSlotLabel(member)}, ${member.playerClass.replace('-', ' ')}`} onClick={() => onSlotChange(member.id)}><span>{contractSlotLabel(member)}</span><i>{member.playerClass.replace('-', ' ')}</i></button>)}
      <b className="contract-plan-boss">{bossLabel}</b>
    </div>
    <button type="button" className="contract-start" onClick={onStart}>Start</button>
  </div>
}
