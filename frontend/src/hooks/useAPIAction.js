import { useCallback, useRef, useState } from 'react'

/**
 * Talpix-standard mutating-action hook.
 *
 *   const [executeAction, isLoading] = useAPIAction(url)
 *
 *   await executeAction(body)         // defaults to POST
 *   await executeAction(body, 'PUT')
 *
 *  - returns the parsed JSON response (or null on failure)
 *  - sets `isLoading` for the duration of the request
 */
export function useAPIAction(
  url,
) {
  const [isLoading, setIsLoading] = useState(false)
  const mounted = useRef(true)

  const executeAction = useCallback(
    async (body, method = 'POST') => {
      setIsLoading(true)
      try {
        const res = await fetch(url, {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json())
        return json
      } catch (err) {
        console.error(`[useAPIAction] ${url}`, err)
        return null
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    },
    [url],
  )

  return [executeAction, isLoading]
}
