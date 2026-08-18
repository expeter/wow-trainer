import { describe, expect, it } from 'vitest'
import { IDLE_PLAYER_COMMANDS } from '../../platform/train3d/types'
import { activeLostExplorersPrompt, clampToLostExplorersArena, createLostExplorersState, interruptLostExplorersIku, lostExplorersSnapshot, stepLostExplorersState, throwLostExplorersFish, type LostExplorersState } from './simulation'

describe('The Lost Explorers full-fight simulation', () => {
  it('keeps movement inside the octagon and exposes three independent bosses', () => {
    expect(clampToLostExplorersArena({ x: 80, z: 80 })).toMatchObject({ x: 31, z: 31 })
    const snapshot = lostExplorersSnapshot(createLostExplorersState('player', 'test'))
    expect(snapshot.actors.filter(actor => actor.kind === 'boss').map(actor => actor.id)).toEqual(['lost-iku', 'lost-gebbo', 'lost-nama'])
    expect(snapshot.arena.theme.layout).toBe('octagonal-council')
  })

  it('opens the fish crate and enforces Iku, Gebbo, Nama as one-use targets', () => {
    let state = createLostExplorersState('player', 'test')
    const fishCrate = state.crates.find(crate => crate.containsFish)!
    state = { ...state, time: fishCrate.landedAt, player: { ...fishCrate.position, facing: 0 } }
    state = stepLostExplorersState(state, IDLE_PLAYER_COMMANDS, .01)
    expect(state.fishHeld).toBe(true)
    state = throwLostExplorersFish(state)
    expect(state.fedBosses).toEqual(['iku'])
    expect(state.fishHeld).toBe(false)
    expect(activeLostExplorersPrompt(state)).toMatch(/Frost|element/i)
  })

  it('keeps the four-second Iku interrupt player-owned', () => {
    let state: LostExplorersState = { ...createLostExplorersState('player', 'test'), time: 4, ikuCastStartedAt: 4 }
    state = interruptLostExplorersIku(state)
    expect(state.ikuCastResolved).toBe(true)
    expect(state.timeline.entities.find(entity => entity.kind === 'controlled-player')?.actions.at(-1)?.kind).toBe('interrupt')
  })

  it('uses simulation-owned height to clear Gebbo Blast Wave', () => {
    let state: LostExplorersState = { ...createLostExplorersState('player', 'test'), cycle: 2, cycleStartedAt: 0, time: 12, ultimateStartedAt: 0, mushroom: { x: -30, z: 0 }, bombPosition: { x: 40, z: 0 }, bombDetonatedAt: 12, player: { x: -30, z: 0, facing: 0 } }
    for (let frame = 0; frame < 500 && state.mushroomTriggeredAt === undefined; frame += 1) state = stepLostExplorersState(state, IDLE_PLAYER_COMMANDS, 1 / 60)
    expect(state.mushroomTriggeredAt).toBeDefined()
    for (let frame = 0; frame < 130 && !state.waveChecked; frame += 1) state = stepLostExplorersState(state, IDLE_PLAYER_COMMANDS, 1 / 60)
    expect(state.vertical.height).toBeGreaterThan(1.2)
    expect(state.waveChecked).toBe(true)
    expect(state.failures.some(failure => failure.code === 'blast-wave-hit')).toBe(false)
  })

  it('labels crate, cleanse, wave, and soak effects with explicit intent', () => {
    const state = { ...createLostExplorersState('player', 'test'), cycle: 3 as const, ultimateStartedAt: 0 }
    const effects = lostExplorersSnapshot(state).effects
    expect(effects.find(effect => effect.id.startsWith('crate-'))).toMatchObject({ intent: 'objective' })
    expect(effects.find(effect => effect.id === 'thud-target-0')).toMatchObject({ intent: 'soak' })
    expect(effects.every(effect => effect.label || effect.kind === 'cosmetic-projectile')).toBe(true)
  })
})
