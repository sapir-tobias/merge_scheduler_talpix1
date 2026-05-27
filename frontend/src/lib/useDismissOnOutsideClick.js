import { useEffect, useRef } from 'react'

/**
 * Dismiss an open popover when a mousedown lands outside the element
 * matching `selector`. Relocated verbatim from SchedulerPage.jsx —
 * the listener re-binds only when `open` flips, matching the original effects.
 */
export function useDismissOnOutsideClick(open, selector, close) {
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!(e.target).closest(selector)) closeRef.current()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
