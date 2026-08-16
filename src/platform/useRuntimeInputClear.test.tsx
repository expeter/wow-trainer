import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RUNTIME_INPUT_CLEAR_EVENT } from './useRuntimePause'
import { useRuntimeInputClear } from './useRuntimeInputClear'

describe('runtime input clearing', () => {
  it('clears held commands on focus loss and shared pause requests', () => {
    const clear = vi.fn()
    renderHook(() => useRuntimeInputClear(clear))
    act(() => window.dispatchEvent(new Event('blur')))
    act(() => window.dispatchEvent(new Event(RUNTIME_INPUT_CLEAR_EVENT)))
    expect(clear).toHaveBeenCalledTimes(2)
  })
})
