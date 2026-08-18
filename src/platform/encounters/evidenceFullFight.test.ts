import { describe, expect, it } from 'vitest'
import { definition as sszorak } from '../../encounters/sszorak/definition'
import { definition as twinFangs } from '../../encounters/the-twin-fangs/definition'
import { definition as coiledAltar } from '../../encounters/the-coiled-altar/definition'
import { IDLE_PLAYER_COMMANDS } from '../train3d/types'
import { GROUNDED_VERTICAL_MOTION, launchVerticalMotion } from '../train3d/verticalMovement'
import { createEvidenceEncounterState, evidenceEncounterSnapshot, evidenceStep, evidenceStepDuration, resolveEvidenceEncounterAction, stepEvidenceEncounter, type EvidenceEncounterDefinition, type EvidenceEncounterState } from './evidenceFullFight'

function safeAvoidPosition(definition: EvidenceEncounterDefinition) {
  if (definition.arenaKind === 'circle') return { x: 38, z: 0, facing: 0 }
  if (definition.arenaKind === 'triangle-ring') return { x: -32, z: 24, facing: 0 }
  return { x: 46, z: 24, facing: 0 }
}

function resolveCurrent(definition: EvidenceEncounterDefinition, state: EvidenceEncounterState) {
  const step = evidenceStep(definition, state)
  let ready = { ...state, player: { ...(step.intent === 'avoid' ? safeAvoidPosition(definition) : { ...step.position, facing: 0 }) } }
  if (step.intent === 'airborne') ready = { ...ready, vertical: launchVerticalMotion(GROUNDED_VERTICAL_MOTION, 10) }
  if (step.requiredAction) ready = resolveEvidenceEncounterAction(definition, ready, step.requiredAction)
  return stepEvidenceEncounter(definition, ready, IDLE_PLAYER_COMMANDS, evidenceStepDuration(definition, ready) + .01, 'train3d')
}

describe('evidence-backed full-fight simulation', () => {
  for (const definition of [sszorak, twinFangs, coiledAltar]) {
    it(`completes every player-owned ${definition.name} responsibility deterministically`, () => {
      let state = createEvidenceEncounterState(definition, 'player', 'normal', 'train3d')
      for (let index = 0; index < definition.steps.length; index += 1) state = resolveCurrent(definition, state)
      expect(state.outcome).toBe('success')
      expect(state.failures).toEqual([])
      expect(evidenceEncounterSnapshot(definition, state).actors.filter(actor => actor.kind === 'boss').every(actor => actor.health === 0)).toBe(true)
    })
  }

  it('keeps Twin Fangs movement on the triangular ring and out of the central void', () => {
    const initial = createEvidenceEncounterState(twinFangs)
    const intoVoid = stepEvidenceEncounter(twinFangs, { ...initial, player: { x: 0, z: 11, facing: 0 } }, { ...IDLE_PLAYER_COMMANDS, forward: true }, .5, 'train3d')
    expect(intoVoid.player).toMatchObject({ x: 0, z: 11 })
  })

  it('rotates deterministic five-attack Sszorak Apex variants between pulls', () => {
    const first = createEvidenceEncounterState(sszorak, 'player', 'normal', 'train3d', 0)
    const second = createEvidenceEncounterState(sszorak, 'player', 'normal', 'train3d', 1)
    const opening = (state: EvidenceEncounterState) => state.stepOrder.slice(0, 5).map(index => sszorak.steps[index].id)
    expect(opening(first)).not.toEqual(opening(second))
    expect(opening(first).filter(id => id === 'apex-tempest')).toHaveLength(1)
    expect(opening(second).filter(id => id === 'apex-tempest')).toHaveLength(1)
  })

  it('requires declared player actions instead of silently resolving them', () => {
    let state = createEvidenceEncounterState(coiledAltar, 'player', 'test', 'train3d')
    state = { ...state, stepIndex: 9, stepStartedAt: 0, player: { x: 0, z: 0, facing: 0 } }
    const missed = stepEvidenceEncounter(coiledAltar, state, IDLE_PLAYER_COMMANDS, evidenceStepDuration(coiledAltar, state) + .01, 'train3d')
    expect(missed.failures[0]).toMatchObject({ code: 'soulbinding' })
    expect(missed.stepIndex).toBe(10)
  })
})
