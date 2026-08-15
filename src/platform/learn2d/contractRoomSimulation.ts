import { contractRaidRoster, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, seededContractEvents, type ContractDirection, type ContractEvent, type ContractPlayerRole, type ContractRaidMember } from '../contractRoom'
import { stepDiagramMovement, type DiagramDirection } from './movement'

export const contractGroundSlots2D: Record<ContractDirection, { x: number; y: number }> = {
  north: { x: 50, y: 17 }, east: { x: 86, y: 50 }, south: { x: 50, y: 83 }, west: { x: 14, y: 50 },
}

export function contractRaidPosition2D(member: ContractRaidMember) {
  if (member.controlled) return member.role === 'tank' ? { x: 53, y: 42 } : { x: 50, y: 68 }
  if (member.id === 'tank-2' && member.role === 'ranged') return { x: 80, y: 57 }
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  if (member.role === 'tank') return { x: index ? 53 : 47, y: 42 }
  if (member.role === 'melee') { const angle = Math.PI * .2 + index / peers.length * Math.PI * 1.6; return { x: 50 + Math.cos(angle) * 10, y: 45 + Math.sin(angle) * 10 } }
  const angle = Math.PI * .12 + index / peers.length * Math.PI * 1.76
  const radiusX = member.role === 'healer' ? 25 : 33
  const radiusY = member.role === 'healer' ? 29 : 39
  return { x: 50 + Math.cos(angle) * radiusX, y: 48 + Math.sin(angle) * radiusY }
}

export function contractPlayerStart2D(role: ContractPlayerRole) {
  return role === 'tank' ? { x: 53, y: 42 } : { x: 50, y: 68 }
}

export function prepareContractRoom2DRole(state: ContractRoom2DState, role: ContractPlayerRole): ContractRoom2DState {
  return { ...state, player: contractPlayerStart2D(role) }
}

export interface ContractRoom2DState {
  time: number
  eventStartedAt: number
  eventIndex: number
  player: { x: number; y: number }
  events: readonly ContractEvent[]
  successes: number
  misses: number
  wrongGrounds: number
}

export function createContractRoom2DState(seed = 238): ContractRoom2DState {
  const player = contractRaidRoster.find(member => member.controlled)!
  return { time: 0, eventStartedAt: 0, eventIndex: 0, player: contractRaidPosition2D(player), events: seededContractEvents(seed), successes: 0, misses: 0, wrongGrounds: 0 }
}

export function activeContractEvent2D(state: ContractRoom2DState) {
  return state.events[state.eventIndex % state.events.length]
}

export function stepContractRoom2D(state: ContractRoom2DState, pressed: ReadonlySet<DiagramDirection>, seconds: number): ContractRoom2DState {
  const player = stepDiagramMovement(state.player, pressed, seconds, 22)
  const time = state.time + seconds
  const age = time - state.eventStartedAt
  const event = activeContractEvent2D(state)
  const contact = age >= CONTRACT_LANDING_SECONDS ? event.groundObjects.find(object => {
    const slot = contractGroundSlots2D[object.direction]
    return Math.hypot(player.x - slot.x, player.y - slot.y) < 6
  }) : undefined
  const expired = age >= CONTRACT_EVENT_SECONDS
  if (!contact && !expired) return { ...state, time, player }
  return {
    ...state, time, player, eventIndex: state.eventIndex + 1, eventStartedAt: time,
    successes: state.successes + Number(Boolean(contact?.correct)),
    misses: state.misses + Number(expired || Boolean(contact && !contact.correct)),
    wrongGrounds: state.wrongGrounds + Number(Boolean(contact && !contact.correct)),
  }
}
