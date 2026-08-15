import { distance, stepPlayerMovement } from '../../../platform/train3d/simulation'
import type { ActorSnapshot, PlayerCommandState, Train3DSnapshot } from '../../../platform/train3d/types'
import { train3dArenas } from './arenas'

export type HelicalOutcome = 'active' | 'success' | 'wrong-partner' | 'third-player' | 'expired'

export interface HelicalSimulationState {
  time: number
  player: { x: number; z: number; facing: number }
  outcome: HelicalOutcome
}

const arena = train3dArenas[0]
const correctPartner = { x: 0, z: -18 }
const wrongPartner = { x: 0, z: 18 }
const thirdPlayer = { x: 17, z: -3 }

export function createHelicalState(): HelicalSimulationState {
  return { time: 0, player: { x: -22, z: 0, facing: 0 }, outcome: 'active' }
}

export function turnHelicalPlayer(state: HelicalSimulationState, yawDelta: number): HelicalSimulationState {
  return { ...state, player: { ...state.player, facing: state.player.facing + yawDelta } }
}

export function stepHelicalState(state: HelicalSimulationState, commands: PlayerCommandState, seconds: number): HelicalSimulationState {
  if (state.outcome !== 'active') return state
  const player = stepPlayerMovement(state.player, commands, seconds, { halfWidth: arena.width / 2, halfDepth: arena.depth / 2 })
  const time = state.time + seconds
  const outcome = distance(player, correctPartner) < 2.7 && player.z < -14
    ? 'success'
    : distance(player, wrongPartner) < 2.7
      ? 'wrong-partner'
      : distance(player, thirdPlayer) < 2.7
        ? 'third-player'
        : time >= 28
          ? 'expired'
          : 'active'
  return { time, player, outcome }
}

function toxins(green: number, red: number) {
  return [
    ...(green ? [{ id: 'green-toxin', tone: 'poison' as const, stacks: green }] : []),
    ...(red ? [{ id: 'red-toxin', tone: 'danger' as const, stacks: red }] : []),
  ]
}

export function helicalSnapshot(state: HelicalSimulationState): Train3DSnapshot {
  const actors: ActorSnapshot[] = [
    { id: 'player', kind: 'player', position: state.player, facing: state.player.facing, color: '#f2d36b', auras: toxins(1, 3), health: 100 },
    { id: 'acid-boss', kind: 'boss', position: { x: -30, z: 0 }, facing: Math.PI / 2, color: '#65c98b', auras: [], health: 100 },
    { id: 'blood-boss', kind: 'boss', position: { x: 30, z: 0 }, facing: -Math.PI / 2, color: '#c75e70', auras: [], health: 100 },
    { id: 'compatible-partner', kind: 'ally', position: correctPartner, facing: Math.PI, color: '#8191ae', auras: toxins(3, 1) },
    { id: 'wrong-partner', kind: 'ally', position: wrongPartner, facing: 0, color: '#8191ae', auras: toxins(2, 2) },
    { id: 'third-player', kind: 'ally', position: thirdPlayer, facing: -.8, color: '#8191ae', auras: toxins(1, 3) },
  ]
  return {
    time: state.time,
    arena,
    actors,
    effects: [{ id: 'north-meeting-sector', kind: 'pulse', position: correctPartner, radius: 3.5, color: '#75e2b2', progress: (state.time % 1.5) / 1.5 }],
  }
}
