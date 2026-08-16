import { useEffect, useRef, useState } from 'react'

export const RUNTIME_INPUT_CLEAR_EVENT = 'midnight-runtime-input-clear'
export const RUNTIME_PAUSE_REQUEST_EVENT = 'midnight-runtime-pause-request'

export function useRuntimePause(pauseKey: string) {
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const toggle = () => {
    const next = !pausedRef.current
    pausedRef.current = next
    setPaused(next)
    if (next) window.dispatchEvent(new Event(RUNTIME_INPUT_CLEAR_EVENT))
  }
  const pause = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    setPaused(true)
    window.dispatchEvent(new Event(RUNTIME_INPUT_CLEAR_EVENT))
  }
  const reset = () => {
    pausedRef.current = false
    setPaused(false)
    window.dispatchEvent(new Event(RUNTIME_INPUT_CLEAR_EVENT))
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== pauseKey || event.repeat) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(RUNTIME_PAUSE_REQUEST_EVENT, pause)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener(RUNTIME_PAUSE_REQUEST_EVENT, pause) }
  }, [pauseKey])
  return { paused, pausedRef, toggle, reset }
}
