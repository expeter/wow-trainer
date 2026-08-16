import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RUNTIME_INPUT_CLEAR_EVENT, RUNTIME_PAUSE_REQUEST_EVENT, useRuntimePause } from './useRuntimePause'

describe('shared runtime pause', () => {
  it('toggles from the configured key and ignores repeats', () => {
    const { result } = renderHook(() => useRuntimePause('KeyP'))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', repeat: true })))
    expect(result.current.pausedRef.current).toBe(false)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' })))
    expect(result.current.pausedRef.current).toBe(true)
  })

  it('requests held-input clearing only when pause begins', () => {
    const clear = vi.fn()
    window.addEventListener(RUNTIME_INPUT_CLEAR_EVENT, clear)
    const { result } = renderHook(() => useRuntimePause('KeyP'))
    act(() => result.current.toggle())
    expect(clear).toHaveBeenCalledOnce()
    act(() => result.current.toggle())
    expect(clear).toHaveBeenCalledOnce()
    window.removeEventListener(RUNTIME_INPUT_CLEAR_EVENT, clear)
  })

  it('pauses on a renderer failure request and can reset for retry', () => {
    const { result } = renderHook(() => useRuntimePause('KeyP'))
    act(() => window.dispatchEvent(new Event(RUNTIME_PAUSE_REQUEST_EVENT)))
    expect(result.current.pausedRef.current).toBe(true)
    act(() => result.current.reset())
    expect(result.current.pausedRef.current).toBe(false)
  })
})
