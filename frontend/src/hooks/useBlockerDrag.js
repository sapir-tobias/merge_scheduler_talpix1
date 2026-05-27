import { useRef, useState, useEffect, useCallback } from 'react'
import { DAYS, START_HOUR, END_HOUR, HOUR_HEIGHT } from '../utils/weeklyLayout'

/**
 * Blocker draw / move / resize machinery for the weekly grid.
 *
 * Keeps a ref (logic, no re-render) + state (visual) pair and document-level
 * mousemove/mouseup listeners — avoids stale closures. Returns the handlers and
 * render state that WeeklySchedule passes down to ScheduleGrid.
 */
export function useBlockerDrag(scrollRef, dispatch) {
  const dragState = useRef({ type: 'none' })
  const [dragRender, setDragRender] = useState({ type: 'none' })

  const getGridPos = useCallback((clientX, clientY) => {
    const el = scrollRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const relX = clientX - rect.left
    const relY = clientY - rect.top + el.scrollTop
    if (relX < 56) return null
    const colWidth = (rect.width - 56) / DAYS.length
    const dayIndex = Math.floor((relX - 56) / colWidth)
    if (dayIndex < 0 || dayIndex >= DAYS.length) return null
    const rawHour = START_HOUR + relY / HOUR_HEIGHT
    const snapped = Math.round(rawHour * 2) / 2
    return {
      day: DAYS[dayIndex].key,
      hour: Math.max(START_HOUR, Math.min(END_HOUR, snapped)),
    }
  }, [scrollRef])

  useEffect(() => {
    const handleMove = (e) => {
      const ds = dragState.current
      if (ds.type === 'none') return
      const pos = getGridPos(e.clientX, e.clientY)
      if (!pos) return

      let next
      if (ds.type === 'moving') {
        const rawStart = pos.hour - ds.offsetHour
        const snapped = Math.round(Math.max(START_HOUR, Math.min(END_HOUR - ds.origDuration, rawStart)) * 2) / 2
        next = { ...ds, day: pos.day, startHour: snapped, endHour: snapped + ds.origDuration }
      } else {
        const snapped = Math.round(Math.max(ds.startHour + 0.5, Math.min(END_HOUR, pos.hour)) * 2) / 2
        next = { ...ds, endHour: snapped }
      }
      dragState.current = next
      setDragRender({ ...next })
    }

    const handleUp = () => {
      const ds = dragState.current
      if (ds.type === 'moving' || ds.type === 'resizing') {
        dispatch({ type: 'UPDATE_BLOCKER', id: ds.id, updates: { day: ds.day, startHour: ds.startHour, endHour: ds.endHour } })
      }
      dragState.current = { type: 'none' }
      setDragRender({ type: 'none' })
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [dispatch, getGridPos])

  function startMoveDrag(e, blocker) {
    e.stopPropagation()
    const pos = getGridPos(e.clientX, e.clientY)
    if (!pos) return
    const ds = {
      type: 'moving', id: blocker.id, day: blocker.day,
      startHour: blocker.startHour, endHour: blocker.endHour,
      offsetHour: pos.hour - blocker.startHour,
      origDuration: blocker.endHour - blocker.startHour,
    }
    dragState.current = ds
    setDragRender(ds)
  }

  function startResizeDrag(e, blocker) {
    e.stopPropagation()
    const ds = {
      type: 'resizing', id: blocker.id, day: blocker.day,
      startHour: blocker.startHour, endHour: blocker.endHour,
    }
    dragState.current = ds
    setDragRender(ds)
  }

  function getBlockerDisplay(blocker) {
    const dr = dragRender
    if ((dr.type === 'moving' || dr.type === 'resizing') && dr.id === blocker.id) {
      return { day: dr.day, startHour: dr.startHour, endHour: dr.endHour }
    }
    return { day: blocker.day, startHour: blocker.startHour, endHour: blocker.endHour }
  }

  return { dragRender, getBlockerDisplay, startMoveDrag, startResizeDrag }
}
