import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRuntimePause } from './useRuntimePause'

describe('shared runtime pause', () => {
  it('toggles from the configured key and ignores repeats', () => {
    const { result } = renderHook(() => useRuntimePause('KeyP'))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', repeat: true })))
    expect(result.current.pausedRef.current).toBe(false)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' })))
    expect(result.current.pausedRef.current).toBe(true)
  })
})
