import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { actions as sentinelsActions } from '../../encounters/entombed-sentinels/actions'
import { DEFAULT_TRAINING_SETTINGS, runtimeKeyBindings } from '../trainingSettings'
import { activeEncounterActions, bindEncounterActions, encounterActionLegend, useEncounterActionInput } from './actions'
import type { EncounterPlayerRole } from './types'

describe('package-declared encounter actions', () => {
  const bindings = runtimeKeyBindings(DEFAULT_TRAINING_SETTINGS, 'train3d')
  const actions = bindEncounterActions(sentinelsActions, bindings)

  it('binds one declaration for both runtimes and filters role-gated actions', () => {
    expect(activeEncounterActions(actions, 'ranged', 'learn2d').map(action => action.binding)).toEqual(['mainAbility'])
    expect(activeEncounterActions(actions, 'healer', 'train3d').map(action => action.binding)).toEqual(['mainAbility', 'dispel'])
    expect(encounterActionLegend(actions, 'healer', 'learn2d')).toBe('Main F · Dispel R')
  })

  it('dispatches only declared actions available to the current role', () => {
    const mainAbility = vi.fn()
    const dispel = vi.fn()
    const { rerender } = renderHook(({ role }: { role: EncounterPlayerRole }) => useEncounterActionInput({
      actions, role, mode: 'learn2d', enabled: true, paused: false, handlers: { mainAbility, dispel },
    }), { initialProps: { role: 'ranged' as EncounterPlayerRole } })

    fireEvent.keyDown(window, { code: bindings.dispel })
    fireEvent.keyDown(window, { code: bindings.mainAbility })
    expect(dispel).not.toHaveBeenCalled()
    expect(mainAbility).toHaveBeenCalledOnce()

    rerender({ role: 'healer' })
    fireEvent.keyDown(window, { code: bindings.dispel })
    expect(dispel).toHaveBeenCalledOnce()
  })
})
