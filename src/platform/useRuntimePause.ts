import { useEffect, useRef, useState } from 'react'

export function useRuntimePause(pauseKey: string) {
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const toggle = () => setPaused(value => {
    pausedRef.current = !value
    return !value
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== pauseKey || event.repeat) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pauseKey])
  return { paused, pausedRef, toggle }
}
