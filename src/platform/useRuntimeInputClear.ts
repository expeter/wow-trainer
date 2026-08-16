import { useEffect, useRef } from 'react'
import { RUNTIME_INPUT_CLEAR_EVENT } from './useRuntimePause'

export function useRuntimeInputClear(clear: () => void) {
  const clearRef = useRef(clear)
  clearRef.current = clear
  useEffect(() => {
    const requestClear = () => clearRef.current()
    const onVisibility = () => { if (document.hidden) requestClear() }
    window.addEventListener('blur', requestClear)
    window.addEventListener(RUNTIME_INPUT_CLEAR_EVENT, requestClear)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', requestClear)
      window.removeEventListener(RUNTIME_INPUT_CLEAR_EVENT, requestClear)
      document.removeEventListener('visibilitychange', onVisibility)
      requestClear()
    }
  }, [])
}
