import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

/** GETs `path` on mount (and whenever it changes). `setData` allows optimistic updates. */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const latest = useRef(0)

  const reload = useCallback(async () => {
    const id = ++latest.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api(path)
      // Rendering a whole screen of fresh data is the heaviest update; let React slice it up.
      if (id === latest.current) startTransition(() => setState({ data, error: null, loading: false }))
    } catch (error) {
      if (id === latest.current) setState((s) => ({ ...s, error, loading: false }))
    }
  }, [path])

  useEffect(() => {
    reload()
    return () => {
      latest.current++
    }
  }, [reload])

  const setData = useCallback(
    (update) => setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update })),
    [],
  )

  return { ...state, reload, setData }
}
