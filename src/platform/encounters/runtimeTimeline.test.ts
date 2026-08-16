import { describe, expect, it } from 'vitest'
import { createNekzaliState, startNekzaliMainCast, stepNekzaliDiagramState, stepNekzaliState } from '../../encounters/nekzali/simulation'
import { createSentinelsState, startSentinelsMainCast, stepSentinelsDiagramState, stepSentinelsState } from '../../encounters/entombed-sentinels/simulation'
import { createContractRoom2DState, stepContractRoom2D } from '../learn2d/contractRoomSimulation'
import { createContractRoomState, stepContractRoom } from '../train3d/contractRoomSimulation'
import { IDLE_PLAYER_COMMANDS } from '../train3d/types'

function expectCoreEntities(timeline: { entities: readonly { kind: string }[] }) {
  expect(new Set(timeline.entities.map(entity => entity.kind))).toEqual(new Set(['controlled-player', 'raid-npc', 'enemy', 'arena']))
}

describe('runtime timeline conformance', () => {
  it('drives both contract-room projections from one clock contract', () => {
    const learn2d = stepContractRoom2D(createContractRoom2DState(), new Set(), .25)
    const train3d = stepContractRoom(createContractRoomState(), IDLE_PLAYER_COMMANDS, .25)
    expect(learn2d.timeline.time).toBe(learn2d.time)
    expect(train3d.timeline.time).toBe(train3d.time)
    expectCoreEntities(learn2d.timeline)
    expectCoreEntities(train3d.timeline)
  })

  it.each([
    ['Nekzali Learn 2D', () => stepNekzaliDiagramState(startNekzaliMainCast(createNekzaliState()), IDLE_PLAYER_COMMANDS, .25)],
    ['Nekzali Train 3D', () => stepNekzaliState(startNekzaliMainCast(createNekzaliState()), IDLE_PLAYER_COMMANDS, .25)],
    ['Sentinels Learn 2D', () => stepSentinelsDiagramState(startSentinelsMainCast(createSentinelsState()), IDLE_PLAYER_COMMANDS, .25)],
    ['Sentinels Train 3D', () => stepSentinelsState(startSentinelsMainCast(createSentinelsState()), IDLE_PLAYER_COMMANDS, .25)],
  ])('%s exposes core entities and records the player action', (_label, createState) => {
    const state = createState()
    expect(state.timeline.time).toBe(state.time)
    expectCoreEntities(state.timeline)
    expect(state.timeline.entities.find(entity => entity.kind === 'controlled-player')?.actions[0].kind).toBe('main-ability')
  })
})
