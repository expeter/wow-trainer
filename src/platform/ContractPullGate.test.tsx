import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useContractPullGate } from './ContractPullGate'

afterEach(() => vi.useRealTimers())

describe('contract pull lifecycle', () => {
  it('runs the same locked countdown for first pull and retry', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useContractPullGate())
    act(() => result.current.start())
    expect(result.current.phaseRef.current).toBe('countdown')
    act(() => vi.advanceTimersByTime(3100))
    expect(result.current.phaseRef.current).toBe('active')
    act(() => result.current.restart())
    expect(result.current.phaseRef.current).toBe('countdown')
    expect(result.current.seconds).toBe(3)
  })
})
