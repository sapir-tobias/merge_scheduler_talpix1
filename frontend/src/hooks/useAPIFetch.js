import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Talpix-standard GET hook.
 *
 *   const [data, isLoading, refresh] = useAPIFetch(url, defaultData, deps)
 *
 *  - `data` starts as `defaultData` and is replaced by the JSON response on success
 *  - `isLoading` is true while the request is in flight
 *  - `refresh()` re-runs the request on demand
 *  - the request re-runs automatically when any dep in `dependencies` changes
 *  - request inflight when the component unmounts is ignored (no setState after unmount)
 */
export function useAPIFetch(
  url,
  defaultData,
  dependencies = [],
) {
  const [data, setData] = useState(defaultData)
  const [isLoading, setIsLoading] = useState(url !== null)
  const [tick, setTick] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (url === null) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    fetch(url, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        if (cancelled || !mounted.current) return
        setData(json)
      })
      .catch(err => {
        if (cancelled || !mounted.current) return
        console.error(`[useAPIFetch] ${url}`, err)
      })
      .finally(() => {
        if (cancelled || !mounted.current) return
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...dependencies])

  return [data, isLoading, refresh]
}
