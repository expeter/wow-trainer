import type { WorldArena3D } from '../encounters'
import { distance, stepPlayerMovement } from './simulation'
import type { AuraTone, PlayerCommandState, Train3DSnapshot, WorldPoint } from './types'

export const contractRoomArena = {
  id: 'platform_contract_room',
  label: 'Platform contract room',
  shape: 'rectangle',
  width: 64,
  depth: 48,
  anchors: [
    { id: 'north', label: 'North reaction position', x: 0, z: -18 },
    { id: 'east', label: 'East reaction position', x: 25, z: 0 },
    { id: 'south', label: 'South reaction position', x: 0, z: 18 },
    { id: 'west', label: 'West reaction position', x: -25, z: 0 },
  ],
  theme: { floor: 'contract-grid', accent: '#73e0c1' },
} as const satisfies WorldArena3D

export interface ContractEvent {
  id: string
  tone: AuraTone
  target: WorldPoint
  direction: 'north' | 'east' | 'south' | 'west'
}

export interface ContractRoomState {
  time: number
  eventStartedAt: number
  eventIndex: number
  player: { x: number; z: number; facing: number }
  events: readonly ContractEvent[]
  successes: number
  misses: number
}

function seededEvents(seed: number): readonly ContractEvent[] {
  const candidates: ContractEvent[] = [
    { id: 'poison', tone: 'poison', target: { x: 0, z: -18 }, direction: 'north' },
    { id: 'danger', tone: 'danger', target: { x: 25, z: 0 }, direction: 'east' },
    { id: 'spectral', tone: 'spectral', target: { x: 0, z: 18 }, direction: 'south' },
    { id: 'beneficial', tone: 'beneficial', target: { x: -25, z: 0 }, direction: 'west' },
  ]
  let value = seed >>> 0
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0
    const swap = value % (index + 1)
    ;[candidates[index], candidates[swap]] = [candidates[swap], candidates[index]]
  }
  return candidates
}

export function createContractRoomState(seed = 238): ContractRoomState {
  return { time: 0, eventStartedAt: 0, eventIndex: 0, player: { x: 0, z: 8, facing: 0 }, events: seededEvents(seed), successes: 0, misses: 0 }
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
  const event = activeContractEvent(state)
  const succeeded = distance(player, event.target) < 3.2
  const missed = time - state.eventStartedAt >= 6
  if (!succeeded && !missed) return { ...state, time, player }
  return {
    ...state,
    time,
    player,
    eventIndex: state.eventIndex + 1,
    eventStartedAt: time,
    successes: state.successes + Number(succeeded),
    misses: state.misses + Number(missed),
  }
}

export function contractRoomSnapshot(state: ContractRoomState): Train3DSnapshot {
  const event = activeContractEvent(state)
  const age = state.time - state.eventStartedAt
  return {
    time: state.time,
    arena: contractRoomArena,
    actors: [
      { id: 'player', kind: 'player', position: state.player, facing: state.player.facing, color: '#f2d36b', auras: [{ id: event.id, tone: event.tone, stacks: 1 + state.eventIndex % 4 }] },
      { id: 'spell-dummy', kind: 'boss', position: { x: 0, z: 0 }, facing: 0, color: '#607481', auras: [] },
    ],
    effects: [
      { id: `target-${state.eventIndex}`, kind: 'pulse', position: event.target, radius: 3.8, color: event.tone === 'danger' ? '#ef7182' : event.tone === 'spectral' ? '#9d83f2' : event.tone === 'poison' ? '#70dc87' : '#72e5c0', progress: (age % 1.2) / 1.2 },
      { id: `spell-${state.eventIndex}`, kind: 'projectile', position: { x: 0, z: 0 }, target: event.target, radius: .4, color: '#d9fff1', progress: Math.min(1, age / 1.25) },
    ],
  }
}
