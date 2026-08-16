import { describe, expect, it } from 'vitest'
import { createNekzaliState, nekzaliSnapshot } from '../../encounters/nekzali/simulation'
import { createSentinelsState, sentinelsSnapshot } from '../../encounters/entombed-sentinels/simulation'
import { contractRoomSnapshot, createContractRoomState } from '../train3d/contractRoomSimulation'

describe('shared actor presentation', () => {
  it('keeps roster identity, role, class, and color across every acceptance arena', () => {
    const snapshots = [
      contractRoomSnapshot(createContractRoomState()),
      nekzaliSnapshot(createNekzaliState()),
      sentinelsSnapshot(createSentinelsState()),
    ]
    const tank = snapshots.map(snapshot => snapshot.actors.find(actor => actor.id === 'tank-1'))
    expect(tank.every(Boolean)).toBe(true)
    expect(new Set(tank.map(actor => actor!.role))).toEqual(new Set(['tank']))
    expect(new Set(tank.map(actor => actor!.playerClass))).toEqual(new Set(['warrior']))
    expect(new Set(tank.map(actor => actor!.color)).size).toBe(1)
  })

  it('uses one stable controlled-player identity in every snapshot', () => {
    const ids = [
      contractRoomSnapshot(createContractRoomState()),
      nekzaliSnapshot(createNekzaliState()),
      sentinelsSnapshot(createSentinelsState()),
    ].map(snapshot => snapshot.actors.find(actor => actor.kind === 'player')?.id)
    expect(ids).toEqual(['controlled-player', 'controlled-player', 'controlled-player'])
  })
})
