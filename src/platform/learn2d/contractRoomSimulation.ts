import { CONTRACT_DEFAULT_PLAYER_SLOT, contractRaidRoster, contractRosterForSlot, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, seededContractEvents, type ContractDirection, type ContractEvent, type ContractRaidMember } from '../contractRoom'
import { stepDiagramMovement, type DiagramDirection } from './movement'
import type { RuntimeFailure } from '../RuntimeFeedback'
import { beginEncounterAction, coreEncounterEntities, createEncounterTimeline, type EncounterTimelineState } from '../encounters/timeline'
import { advanceAmbientNpcTimeline } from '../encounters/ambientNpc'

export const contractGroundSlots2D: Record<ContractDirection, { x: number; y: number }> = {
  north: { x: 50, y: 17 }, east: { x: 86, y: 50 }, south: { x: 50, y: 83 }, west: { x: 14, y: 50 },
}

export function contractRaidPosition2D(member: ContractRaidMember) {
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  if (member.role === 'tank') return { x: index ? 53 : 47, y: 42 }
  if (member.role === 'melee') { const angle = Math.PI * .2 + index / peers.length * Math.PI * 1.6; return { x: 50 + Math.cos(angle) * 10, y: 45 + Math.sin(angle) * 10 } }
  const angle = Math.PI * .12 + index / peers.length * Math.PI * 1.76
  const radiusX = member.role === 'healer' ? 25 : 33
  const radiusY = member.role === 'healer' ? 29 : 39
  return { x: 50 + Math.cos(angle) * radiusX, y: 48 + Math.sin(angle) * radiusY }
}

export function contractPlayerStart2D(slotId: string) {
  return contractRaidPosition2D(contractRosterForSlot(slotId).find(member => member.controlled)!)
}

export function prepareContractRoom2DSlot(state: ContractRoom2DState, slotId: string): ContractRoom2DState {
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== slotId).map(member => member.id), ['spell-dummy'], 'platform_contract_room'))
  return { ...state, timeline: { ...timeline, time: state.time }, player: contractPlayerStart2D(slotId) }
}

export interface ContractRoom2DState {
  time: number
  timeline: EncounterTimelineState
  eventStartedAt: number
  eventIndex: number
  player: { x: number; y: number }
  events: readonly ContractEvent[]
  successes: number
  misses: number
  wrongGrounds: number
  failures: readonly RuntimeFailure[]
}

export function createContractRoom2DState(seed = 238): ContractRoom2DState {
  const player = contractRosterForSlot(CONTRACT_DEFAULT_PLAYER_SLOT).find(member => member.controlled)!
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== player.id).map(member => member.id), ['spell-dummy'], 'platform_contract_room'))
  return { time: 0, timeline, eventStartedAt: 0, eventIndex: 0, player: contractRaidPosition2D(player), events: seededContractEvents(seed), successes: 0, misses: 0, wrongGrounds: 0, failures: [] }
}

export function activeContractEvent2D(state: ContractRoom2DState) {
  return state.events[state.eventIndex % state.events.length]
}

export function stepContractRoom2D(state: ContractRoom2DState, pressed: ReadonlySet<DiagramDirection>, seconds: number): ContractRoom2DState {
  const player = stepDiagramMovement(state.player, pressed, seconds, 22)
  const time = state.time + seconds
  let timeline = advanceAmbientNpcTimeline(state.timeline, seconds, 'spell-dummy')
  const age = time - state.eventStartedAt
  const event = activeContractEvent2D(state)
  const contact = age >= CONTRACT_LANDING_SECONDS ? event.groundObjects.find(object => {
    const slot = contractGroundSlots2D[object.direction]
    return Math.hypot(player.x - slot.x, player.y - slot.y) < 6
  }) : undefined
  const expired = age >= CONTRACT_EVENT_SECONDS
  if (!contact && !expired) return { ...state, time, timeline, player }
  const failure = contact?.correct ? undefined : {
    id: `contract-2d-${state.eventIndex}-${time.toFixed(3)}`,
    code: contact ? 'wrong-ground' : 'reaction-expired',
    time,
    label: contact ? `Entered the ${contact.tone} rune with a ${event.tone} aura` : `Did not reach the ${event.tone} rune in time`,
    advice: contact ? 'Read the icon attached to your character and enter only the ground rune with the same color.' : 'Identify the matching rune as the projectiles land and begin moving before the reaction timer expires.',
  } satisfies RuntimeFailure
  timeline = beginEncounterAction(timeline, { id: 'platform_contract_room', kind: 'arena' }, contact?.correct ? 'reaction-resolved' : 'reaction-failed', 0, event.id)
  return {
    ...state, time, timeline, player, eventIndex: state.eventIndex + 1, eventStartedAt: time,
    successes: state.successes + Number(Boolean(contact?.correct)),
    misses: state.misses + Number(expired || Boolean(contact && !contact.correct)),
    wrongGrounds: state.wrongGrounds + Number(Boolean(contact && !contact.correct)),
    failures: failure ? [failure, ...state.failures].slice(0, 5) : state.failures,
  }
}
