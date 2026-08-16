import type { WorldArena3D } from '../encounters'
import { auraToneColors, CONTRACT_DEFAULT_PLAYER_SLOT, contractDirections, contractRaidRoster, contractRosterForSlot, contractSelectedMember, contractTones, trainingClassColors, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, seededContractEvents, type ContractDirection, type ContractEvent, type ContractRaidMember } from '../contractRoom'
import { distance, stepPlayerMovement } from './simulation'
import type { PlayerCommandState, Train3DSnapshot, WorldPoint } from './types'
import { cosmeticClassProjectiles } from './cosmeticCombat'
import type { RuntimeFailure } from '../RuntimeFeedback'
import { beginEncounterAction, coreEncounterEntities, createEncounterTimeline, type EncounterTimelineState } from '../encounters/timeline'
import { advanceAmbientNpcTimeline, ambientNpcPosition } from '../encounters/ambientNpc'

export { CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS } from '../contractRoom'

const contractGroundSlots: Record<ContractDirection, WorldPoint> = {
  north: { x: 0, z: -14 }, east: { x: 18, z: 0 }, south: { x: 0, z: 14 }, west: { x: -18, z: 0 },
}
export const contractGroundPosition3D = (direction: ContractDirection) => contractGroundSlots[direction]

export const contractRoomArena = {
  id: 'platform_contract_room', label: 'Platform contract room', shape: 'rectangle', width: 90, depth: 70,
  anchors: contractDirections.map(direction => ({ id: direction, label: `${direction} reaction position`, ...contractGroundSlots[direction] })),
  theme: { floor: 'contract-grid', accent: '#73e0c1' },
} as const satisfies WorldArena3D

export const contractRoomMarkers = [
  { id: 'dummy-star', kind: 'star', label: 'Dummy star marker', position: { x: -28, z: -22 }, color: '#f0d65c' },
  { id: 'dummy-cross', kind: 'cross', label: 'Dummy cross marker', position: { x: 28, z: -22 }, color: '#ef6478' },
  { id: 'dummy-diamond', kind: 'diamond', label: 'Dummy diamond marker', position: { x: -28, z: 22 }, color: '#58b7ff' },
  { id: 'dummy-circle', kind: 'circle', label: 'Dummy circle marker', position: { x: 28, z: 22 }, color: '#e79b42' },
] as const

export interface ContractRoomState {
  time: number
  timeline: EncounterTimelineState
  eventStartedAt: number
  eventIndex: number
  player: { x: number; z: number; facing: number }
  events: readonly ContractEvent[]
  successes: number
  misses: number
  wrongGrounds: number
  failures: readonly RuntimeFailure[]
}

export const seededEvents = seededContractEvents

function worldPosition(member: ContractRaidMember): WorldPoint {
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  if (member.role === 'tank') return { x: index ? 2.4 : -2.4, z: -4.5 }
  if (member.role === 'melee') { const angle = Math.PI * .22 + index / peers.length * Math.PI * 1.55; return { x: Math.cos(angle) * 7.5, z: Math.sin(angle) * 7.5 } }
  const angle = Math.PI * .12 + index / peers.length * Math.PI * 1.76
  const radius = member.role === 'healer' ? 18 : 23
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
}

export function contractPlayerStart3D(slotId: string): WorldPoint {
  return worldPosition(contractSelectedMember(slotId))
}

export function prepareContractRoomSlot(state: ContractRoomState, slotId: string): ContractRoomState {
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== slotId).map(member => member.id), ['spell-dummy'], contractRoomArena.id))
  return { ...state, timeline: { ...timeline, time: state.time }, player: { ...contractPlayerStart3D(slotId), facing: 0 } }
}

export function createContractRoomState(seed = 238): ContractRoomState {
  const controlled = contractSelectedMember(CONTRACT_DEFAULT_PLAYER_SLOT)
  const start = worldPosition(controlled)
  const timeline = createEncounterTimeline(coreEncounterEntities('controlled-player', contractRaidRoster.filter(member => member.id !== controlled.id).map(member => member.id), ['spell-dummy'], contractRoomArena.id))
  return { time: 0, timeline, eventStartedAt: 0, eventIndex: 0, player: { ...start, facing: 0 }, events: seededEvents(seed), successes: 0, misses: 0, wrongGrounds: 0, failures: [] }
}

export function turnContractRoomPlayer(state: ContractRoomState, yawDelta: number): ContractRoomState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export function activeContractEvent(state: ContractRoomState) {
  return state.events[state.eventIndex % state.events.length]
}

export function stepContractRoom(state: ContractRoomState, commands: PlayerCommandState, seconds: number): ContractRoomState {
  const player = stepPlayerMovement(state.player, commands, seconds, { halfWidth: contractRoomArena.width / 2, halfDepth: contractRoomArena.depth / 2 })
  const time = state.time + seconds
  let timeline = advanceAmbientNpcTimeline(state.timeline, seconds, 'spell-dummy')
  const age = time - state.eventStartedAt
  const contact = age >= CONTRACT_LANDING_SECONDS
    ? activeContractEvent(state).groundObjects.find(object => distance(player, contractGroundSlots[object.direction]) < 3.2)
    : undefined
  const expired = age >= CONTRACT_EVENT_SECONDS
  if (!contact && !expired) return { ...state, time, timeline, player }
  const event = activeContractEvent(state)
  const failure = contact?.correct ? undefined : {
    id: `contract-3d-${state.eventIndex}-${time.toFixed(3)}`,
    code: contact ? 'wrong-ground' : 'reaction-expired',
    time,
    label: contact ? `Entered the ${contact.tone} rune with a ${event.tone} aura` : `Did not reach the ${event.tone} rune in time`,
    advice: contact ? 'Read your attached aura icon and enter only the matching ground effect.' : 'Turn toward the matching ground effect and begin moving while the landing projectiles are still visible.',
  } satisfies RuntimeFailure
  timeline = beginEncounterAction(timeline, { id: contractRoomArena.id, kind: 'arena' }, contact?.correct ? 'reaction-resolved' : 'reaction-failed', 0, state.events[state.eventIndex % state.events.length].id)
  return {
    ...state,
    time,
    timeline,
    player,
    eventIndex: state.eventIndex + 1,
    eventStartedAt: time,
    successes: state.successes + Number(Boolean(contact?.correct)),
    misses: state.misses + Number(expired || Boolean(contact && !contact.correct)),
    wrongGrounds: state.wrongGrounds + Number(Boolean(contact && !contact.correct)),
    failures: failure ? [failure, ...state.failures].slice(0, 5) : state.failures,
  }
}

export function contractRoomSnapshot(state: ContractRoomState, playerSlotId = CONTRACT_DEFAULT_PLAYER_SLOT, playerHealth = 100): Train3DSnapshot {
  const event = activeContractEvent(state)
  const age = state.time - state.eventStartedAt
  const pulseProgress = Math.max(0, (age - CONTRACT_LANDING_SECONDS) % 1.2) / 1.2
  const roster = contractRosterForSlot(playerSlotId)
  const controlled = roster.find(member => member.controlled)!
  const npcActors = roster.filter(member => !member.controlled).map((member, index) => {
    const origin = worldPosition(member)
    const position = ambientNpcPosition(member.id, origin, state.time, { radius: member.role === 'melee' || member.role === 'tank' ? .45 : .8 })
    const tone = contractTones[(index + state.eventIndex) % contractTones.length]
    return {
      id: member.id,
      kind: 'ally' as const,
      role: member.role,
      position,
      facing: Math.atan2(-origin.x, -origin.z),
      color: trainingClassColors[member.playerClass],
      playerClass: member.playerClass,
      auras: index % 4 === 0 ? [{ id: `npc-${tone}`, tone, stacks: 1 }] : [], health: 100,
    }
  })
  const encounterEffects = event.groundObjects.flatMap(object => [
    { id: `ground-${object.id}`, kind: 'pulse' as const, position: contractGroundSlots[object.direction], radius: 3.8, color: auraToneColors[object.tone], progress: pulseProgress },
    ...(age <= CONTRACT_LANDING_SECONDS ? [{ id: `spell-${object.id}`, kind: 'projectile' as const, position: { x: 0, z: 0 }, target: contractGroundSlots[object.direction], radius: .4, color: auraToneColors[object.tone], progress: Math.min(1, age / CONTRACT_LANDING_SECONDS) }] : []),
  ])
  return {
    time: state.time,
    timeline: state.timeline,
    arena: contractRoomArena,
    actors: [
      { id: 'controlled-player', kind: 'player', role: controlled.role, position: state.player, facing: state.player.facing, color: trainingClassColors[controlled.playerClass], playerClass: controlled.playerClass, auras: [{ id: event.id, tone: event.tone, stacks: 1 }], health: playerHealth },
      { id: 'spell-dummy', kind: 'boss', position: { x: 0, z: 0 }, facing: 0, color: '#607481', auras: [], health: 100 },
      ...npcActors,
    ],
    effects: [...encounterEffects, ...cosmeticClassProjectiles(npcActors, { x: 0, z: 0 }, state.time)],
    markers: contractRoomMarkers,
  }
}
