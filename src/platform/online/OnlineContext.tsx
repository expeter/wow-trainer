import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const ONLINE_API_URL = (import.meta.env.VITE_ONLINE_API_URL || 'https://api.asgard.website').replace(/\/$/, '')

export interface OnlineCharacter {
  id: number
  providerId: string
  name: string
  realmName: string
  realmSlug: string
  level: number | null
  className: string | null
}

export interface OnlineSession {
  authenticated: boolean
  region?: string
  selectedCharacterId?: number | null
  selectedCharacter?: OnlineCharacter | null
  characters?: OnlineCharacter[]
  csrfToken?: string
  isMaintainer?: boolean
}

interface OnlineContextValue {
  session: OnlineSession
  loading: boolean
  notice: string
  refresh: () => Promise<void>
  login: (region?: string) => void
  selectCharacter: (characterId: number) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const OnlineContext = createContext<OnlineContextValue>({
  session: { authenticated: false }, loading: true, notice: '', refresh: async () => {}, login: () => {}, selectCharacter: async () => {}, logout: async () => {}, deleteAccount: async () => {},
})

async function onlineFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${ONLINE_API_URL}${path}`, { ...init, credentials: 'include' })
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'The online service is unavailable.')
  return body
}

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OnlineSession>({ authenticated: false })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try {
      setSession(await onlineFetch('/v2/me') as unknown as OnlineSession)
      setNotice('')
    } catch (error) {
      setSession({ authenticated: false })
      setNotice(error instanceof Error ? error.message : 'The online service is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    void onlineFetch('/v2/events/page-view', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: 'trainer' }),
    }).catch(() => {})
  }, [])

  const login = useCallback((region = 'eu') => {
    const url = new URL(`${ONLINE_API_URL}/v2/auth/battlenet/start`)
    url.searchParams.set('region', region)
    url.searchParams.set('origin', window.location.origin)
    window.location.assign(url.toString())
  }, [])

  const mutate = useCallback(async (path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) => {
    if (!session.csrfToken) throw new Error('Refresh the Battle.net session and try again.')
    const next = await onlineFetch(path, {
      method,
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return next
  }, [session.csrfToken])

  const selectCharacter = useCallback(async (characterId: number) => {
    const next = await mutate('/v2/me/character', 'PUT', { characterId })
    setSession(next as unknown as OnlineSession)
  }, [mutate])

  const logout = useCallback(async () => {
    await mutate('/v2/auth/logout', 'POST')
    setSession({ authenticated: false })
  }, [mutate])

  const deleteAccount = useCallback(async () => {
    await mutate('/v2/me', 'DELETE')
    setSession({ authenticated: false })
  }, [mutate])

  const value = useMemo(() => ({ session, loading, notice, refresh, login, selectCharacter, logout, deleteAccount }), [session, loading, notice, refresh, login, selectCharacter, logout, deleteAccount])
  return <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>
}

export function useOnline() { return useContext(OnlineContext) }
