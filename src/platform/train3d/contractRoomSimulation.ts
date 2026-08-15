import type { WorldArena3D } from '../encounters'
import { auraToneColors, contractDirections, contractMemberForRole, contractRaidRoster, contractTones, CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS, seededContractEvents, type ContractDirection, type ContractEvent, type ContractPlayerRole, type ContractRaidMember } from '../contractRoom'
import { distance, stepPlayerMovement } from './simulation'
import type { PlayerCommandState, Train3DSnapshot, WorldPoint } from './types'

export { CONTRACT_EVENT_SECONDS, CONTRACT_LANDING_SECONDS } from '../contractRoom'

const contractGroundSlots: Record<ContractDirection, WorldPoint> = {
  north: { x: 0, z: -24 }, east: { x: 32, z: 0 }, south: { x: 0, z: 24 }, west: { x: -32, z: 0 },
}
export const contractGroundPosition3D = (direction: ContractDirection) => contractGroundSlots[direction]

export const contractRoomArena = {
  id: 'platform_contract_room', label: 'Platform contract room', shape: 'rectangle', width: 90, depth: 70,
  anchors: contractDirections.map(direction => ({ id: direction, label: `${direction} reaction position`, ...contractGroundSlots[direction] })),
  theme: { floor: 'contract-grid', accent: '#73e0c1' },
} as const satisfies WorldArena3D

export interface ContractRoomState {
  time: number
  eventStartedAt: number
  eventIndex: number
  player: { x: number; z: number; facing: number }
  events: readonly ContractEvent[]
  successes: number
  misses: number
  wrongGrounds: number
}

export const seededEvents = seededContractEvents

function worldPosition(member: ContractRaidMember): WorldPoint {
  if (member.controlled) return { x: 0, z: 12 }
  if (member.id === 'tank-2' && member.role === 'ranged') return { x: 23, z: 5 }
  const peers = contractRaidRoster.filter(candidate => candidate.role === member.role)
  const index = peers.findIndex(candidate => candidate.id === member.id)
  if (member.role === 'tank') return { x: index ? 2.4 : -2.4, z: -4.5 }
  if (member.role === 'melee') { const angle = Math.PI * .22 + index / peers.length * Math.PI * 1.55; return { x: Math.cos(angle) * 7.5, z: Math.sin(angle) * 7.5 } }
  const angle = Math.PI * .12 + index / peers.length * Math.PI * 1.76
  const radius = member.role === 'healer' ? 18 : 23
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
}

export function contractPlayerStart3D(role: ContractPlayerRole): WorldPoint {
  return role === 'tank' ? { x: 2.4, z: -4.5 } : { x: 0, z: 12 }
}

export function prepareContractRoomRole(state: ContractRoomState, role: ContractPlayerRole): ContractRoomState {
  return { ...state, player: { ...contractPlayerStart3D(role), facing: 0 } }
}

export function createContractRoomState(seed = 238): ContractRoomState {
  const controlled = contractRaidRoster.find(member => member.controlled)!
  const start = worldPosition(controlled)
  return { time: 0, eventStartedAt: 0, eventIndex: 0, player: { ...start, facing: 0 }, events: seededEvents(seed), successes: 0, misses: 0, wrongGrounds: 0 }
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
  const age = time - state.eventStartedAt
  const contact = age >= CONTRACT_LANDING_SECONDS
    ? activeContractEvent(state).groundObjects.find(object => distance(player, contractGroundSlots[object.direction]) < 3.2)
    : undefined
  const expired = age >= CONTRACT_EVENT_SECONDS
  if (!contact && !expired) return { ...state, time, player }
  return {
    ...state,
    time,
    player,
    eventIndex: state.eventIndex + 1,
    eventStartedAt: time,
    successes: state.successes + Number(Boolean(contact?.correct)),
    misses: state.misses + Number(expired || Boolean(contact && !contact.correct)),
    wrongGrounds: state.wrongGrounds + Number(Boolean(contact && !contact.correct)),
  }
}

export function contractRoomSnapshot(state: ContractRoomState, playerRole: ContractPlayerRole = 'ranged', playerHealth = 100): Train3DSnapshot {
  const event = activeContractEvent(state)
  const age = state.time - state.eventStartedAt
  const pulseProgress = Math.max(0, (age - CONTRACT_LANDING_SECONDS) % 1.2) / 1.2
  const npcActors = contractRaidRoster.filter(member => !member.controlled).map((originalMember, index) => {
    const member = contractMemberForRole(originalMember, playerRole)
    const origin = worldPosition(member)
    const sway = Math.sin(state.time * .65 + index * 1.7) * (member.role === 'melee' || member.role === 'tank' ? .35 : .7)
    const tone = contractTones[(index + state.eventIndex) % contractTones.length]
    return {
      id: member.id,
      kind: 'ally' as const,
      position: { x: origin.x + sway, z: origin.z + Math.cos(state.time * .5 + index) * .3 },
      facing: Math.atan2(-origin.x, -origin.z),
      color: member.role === 'tank' ? '#6f9cff' : member.role === 'healer' ? '#71dd99' : member.role === 'melee' ? '#e18a58' : '#b690e8',
      auras: index % 4 === 0 ? [{ id: `npc-${tone}`, tone, stacks: 1 }] : [], health: 100,
    }
  })
  return {
    time: state.time,
    arena: contractRoomArena,
    actors: [
      { id: 'player', kind: 'player', position: state.player, facing: state.player.facing, color: '#f2d36b', auras: [{ id: event.id, tone: event.tone, stacks: 1 }], health: playerHealth },
      { id: 'spell-dummy', kind: 'boss', position: { x: 0, z: 0 }, facing: 0, color: '#607481', auras: [], health: 100 },
      ...npcActors,
    ],
    effects: event.groundObjects.flatMap(object => [
      { id: `ground-${object.id}`, kind: 'pulse' as const, position: contractGroundSlots[object.direction], radius: 3.8, color: auraToneColors[object.tone], progress: pulseProgress },
      ...(age <= CONTRACT_LANDING_SECONDS ? [{ id: `spell-${object.id}`, kind: 'projectile' as const, position: { x: 0, z: 0 }, target: contractGroundSlots[object.direction], radius: .4, color: auraToneColors[object.tone], progress: Math.min(1, age / CONTRACT_LANDING_SECONDS) }] : []),
    ]),
  }
}
