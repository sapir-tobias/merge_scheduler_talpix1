import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { useDegree } from '../state/DegreeContext'
import { COURSE_MAP } from '../data/courses'
import type { SemesterId, Faculty, DayKey, Blocker } from '../types'
import { Lock, Unlock, X } from 'lucide-react'

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
]
const DAY_LABEL: Record<DayKey, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu' }
const DAY_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const START_HOUR = 8
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 52

function formatHour(h: number) {
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
function formatTime(h: number) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

const FACULTY_COLORS: Record<Faculty, string> = {
  cs:      'bg-blue-100 border-blue-300 text-blue-900',
  math:    'bg-violet-100 border-violet-300 text-violet-900',
  physics: 'bg-amber-100 border-amber-300 text-amber-900',
  misc:    'bg-stone-100 border-stone-300 text-stone-900',
}
const FACULTY_BTN: Record<Faculty, string> = {
  cs:      'text-blue-400 hover:text-blue-700',
  math:    'text-violet-400 hover:text-violet-700',
  physics: 'text-amber-400 hover:text-amber-700',
  misc:    'text-stone-400 hover:text-stone-600',
}

interface CourseBlock {
  key: string
  dayIndex: number
  startHour: number
  endHour: number
  label: string
  code: string
  faculty: Faculty
  locked: boolean
  courseId: string
  isRecitation: boolean
}

interface PanelInfo { courseId: string; rect: DOMRect }

type DragState =
  | { type: 'none' }
  | { type: 'moving';   id: string; day: DayKey; startHour: number; endHour: number; offsetHour: number; origDuration: number }
  | { type: 'resizing'; id: string; day: DayKey; startHour: number; endHour: number }

interface Props { semesterId: SemesterId }

export default function WeeklySchedule({ semesterId }: Props) {
  const { state, dispatch } = useDegree()
  const todayKey = DAY_OF_WEEK[new Date().getDay()]
  const scrollRef = useRef<HTMLDivElement>(null)

  const dragState = useRef<DragState>({ type: 'none' })
  const [dragRender, setDragRender] = useState<DragState>({ type: 'none' })

  const [panel, setPanel] = useState<PanelInfo | null>(null)
  const [editingBlockerId, setEditingBlockerId] = useState<string | null>(null)

  const getGridPos = useCallback((clientX: number, clientY: number) => {
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
  }, [])

  useEffect(() => {
    if (!panel) return
    const timer = setTimeout(() => {
      const dismiss = () => setPanel(null)
      document.addEventListener('click', dismiss)
      return () => document.removeEventListener('click', dismiss)
    }, 0)
    return () => clearTimeout(timer)
  }, [panel])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const ds = dragState.current
      if (ds.type === 'none') return
      const pos = getGridPos(e.clientX, e.clientY)
      if (!pos) return

      let next: DragState
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

  function startMoveDrag(e: React.MouseEvent, blocker: Blocker) {
    e.stopPropagation()
    const pos = getGridPos(e.clientX, e.clientY)
    if (!pos) return
    const ds: DragState = {
      type: 'moving', id: blocker.id, day: blocker.day,
      startHour: blocker.startHour, endHour: blocker.endHour,
      offsetHour: pos.hour - blocker.startHour,
      origDuration: blocker.endHour - blocker.startHour,
    }
    dragState.current = ds
    setDragRender(ds)
  }

  function startResizeDrag(e: React.MouseEvent, blocker: Blocker) {
    e.stopPropagation()
    const ds: DragState = {
      type: 'resizing', id: blocker.id, day: blocker.day,
      startHour: blocker.startHour, endHour: blocker.endHour,
    }
    dragState.current = ds
    setDragRender(ds)
  }

  function blockStyle(startHour: number, endHour: number, dayIndex: number): React.CSSProperties {
    return {
      top: `calc(${((startHour - START_HOUR) / TOTAL_HOURS) * 100}% + 1px)`,
      height: `calc(${((endHour - startHour) / TOTAL_HOURS) * 100}% - 2px)`,
      left: `calc(56px + ${dayIndex} * (100% - 56px) / 5 + 3px)`,
      width: `calc((100% - 56px) / 5 - 6px)`,
    }
  }

  function getBlockerDisplay(blocker: Blocker): { day: DayKey; startHour: number; endHour: number } {
    const dr = dragRender
    if ((dr.type === 'moving' || dr.type === 'resizing') && dr.id === blocker.id) {
      return { day: dr.day, startHour: dr.startHour, endHour: dr.endHour }
    }
    return { day: blocker.day, startHour: blocker.startHour, endHour: blocker.endHour }
  }

  const semPlaced = state.placed.filter(p => p.semesterId === semesterId)
  const semBlockers = state.blockers.filter(b => b.semesterId === semesterId)

  // Build all course blocks (lectures + recitations)
  const allCourseBlocks: CourseBlock[] = []
  for (const p of semPlaced) {
    const course = COURSE_MAP.get(p.courseId)
    if (!course) continue

    const lectOpt = course.lectureOptions.find(o => o.id === p.lectureOptionId)
    if (lectOpt) {
      for (const slot of lectOpt.slots) {
        const dayIndex = DAYS.findIndex(d => d.key === slot.day)
        if (dayIndex < 0) continue
        allCourseBlocks.push({
          key: `lect-${p.courseId}-${slot.day}-${slot.startHour}`,
          dayIndex, startHour: slot.startHour, endHour: slot.endHour,
          label: course.name, code: course.code, faculty: course.faculty,
          locked: p.locked, courseId: p.courseId, isRecitation: false,
        })
      }
    }

    if (course.recitationOptions && p.recitationOptionId) {
      const recOpt = course.recitationOptions.find(o => o.id === p.recitationOptionId)
      if (recOpt) {
        for (const slot of recOpt.slots) {
          const dayIndex = DAYS.findIndex(d => d.key === slot.day)
          if (dayIndex < 0) continue
          allCourseBlocks.push({
            key: `rec-${p.courseId}-${slot.day}-${slot.startHour}`,
            dayIndex, startHour: slot.startHour, endHour: slot.endHour,
            label: course.name, code: course.code, faculty: course.faculty,
            locked: p.locked, courseId: p.courseId, isRecitation: true,
          })
        }
      }
    }
  }

  // Collision zones between different courses
  const collisionZones: { dayIndex: number; startHour: number; endHour: number }[] = []
  for (let i = 0; i < allCourseBlocks.length; i++) {
    for (let j = i + 1; j < allCourseBlocks.length; j++) {
      const a = allCourseBlocks[i], b = allCourseBlocks[j]
      if (a.courseId === b.courseId) continue
      if (a.dayIndex !== b.dayIndex) continue
      const os = Math.max(a.startHour, b.startHour)
      const oe = Math.min(a.endHour, b.endHour)
      if (oe > os) collisionZones.push({ dayIndex: a.dayIndex, startHour: os, endHour: oe })
    }
  }

  // Collision zones between course blocks and blockers
  const blockerCollisionZones: { dayIndex: number; startHour: number; endHour: number }[] = []
  for (const block of allCourseBlocks) {
    for (const blocker of semBlockers) {
      const bDisp = getBlockerDisplay(blocker)
      const blockerDayIndex = DAYS.findIndex(d => d.key === bDisp.day)
      if (blockerDayIndex !== block.dayIndex) continue
      const os = Math.max(block.startHour, bDisp.startHour)
      const oe = Math.min(block.endHour, bDisp.endHour)
      if (oe > os) blockerCollisionZones.push({ dayIndex: block.dayIndex, startHour: os, endHour: oe })
    }
  }

  const hourSlots = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR)
  const panelCourse = panel ? COURSE_MAP.get(panel.courseId) : null
  const panelPlaced = panel ? semPlaced.find(p => p.courseId === panel.courseId) : null

  const COLLISION_STRIPE = {
    backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.78) 0px, rgba(239,68,68,0.78) 4px, transparent 4px, transparent 12px)',
    border: '1px solid rgba(239,68,68,0.95)',
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white min-w-0">

      {/* Header */}
      <div className="flex shrink-0 h-11 border-b border-stone-200">
        <div className="w-14 shrink-0" />
        {DAYS.map(day => (
          <div
            key={day.key}
            className={cn(
              'flex-1 flex items-center justify-center border-l border-stone-200',
              day.key === todayKey && 'bg-stone-100/60'
            )}
          >
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-[0.12em]',
              day.key === todayKey ? 'text-stone-700' : 'text-stone-400'
            )}>
              {day.label}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative select-none"
        style={{ cursor: dragRender.type !== 'none' ? 'grabbing' : 'default' }}
      >
        <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>

          {/* Hour grid lines + labels */}
          {hourSlots.map(h => (
            <div
              key={h}
              className="absolute inset-x-0 flex pointer-events-none"
              style={{ top: `${((h - START_HOUR) / TOTAL_HOURS) * 100}%` }}
            >
              <div className="w-14 shrink-0 flex items-start justify-end pr-2.5 pt-1 select-none">
                <span className="text-[10px] leading-none text-stone-400 tabular-nums font-medium">
                  {formatHour(h)}
                </span>
              </div>
              {DAYS.map((day, i) => (
                <div
                  key={day.key}
                  className={cn(
                    'flex-1 border-t border-l',
                    i === 0 ? 'border-l-stone-200' : 'border-l-stone-100',
                    'border-t-stone-100',
                    day.key === todayKey ? 'bg-stone-50/80' : ''
                  )}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}
            </div>
          ))}

          {/* Blockers */}
          {semBlockers.map(blocker => {
            const disp = getBlockerDisplay(blocker)
            const dayIndex = DAYS.findIndex(d => d.key === disp.day)
            if (dayIndex < 0) return null
            const dragging = (dragRender.type === 'moving' || dragRender.type === 'resizing') && dragRender.id === blocker.id

            return (
              <div
                key={blocker.id}
                className={cn('absolute rounded-lg group z-10 overflow-hidden', dragging && 'opacity-70')}
                style={{
                  ...blockStyle(disp.startHour, disp.endHour, dayIndex),
                  background: 'linear-gradient(to bottom, rgba(220,220,218,0.18) 0%, rgba(168,162,158,0.22) 55%, rgba(100,95,90,0.32) 88%, rgba(60,55,50,0.44) 100%)',
                  border: '1.5px solid rgba(41,37,36,0.55)',
                  cursor: 'grab',
                }}
                onMouseDown={e => startMoveDrag(e, blocker)}
              >
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(100,95,90,0.15)' }}
                />
                {editingBlockerId === blocker.id ? (
                  <input
                    autoFocus
                    type="text"
                    defaultValue={blocker.label ?? ''}
                    onMouseDown={e => e.stopPropagation()}
                    onBlur={e => {
                      dispatch({ type: 'UPDATE_BLOCKER', id: blocker.id, updates: { label: e.target.value || undefined } })
                      setEditingBlockerId(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setEditingBlockerId(null)
                    }}
                    className="text-[9px] px-1.5 pt-1 w-full bg-transparent border-0 focus:outline-none font-medium tracking-wide"
                    style={{ color: 'rgba(80,75,70,0.9)' }}
                  />
                ) : (
                  <p
                    className="text-[9px] px-1.5 pt-1 leading-none select-none font-medium tracking-wide cursor-text"
                    style={{ color: 'rgba(80,75,70,0.65)' }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setEditingBlockerId(blocker.id) }}
                  >
                    {blocker.label || 'blocked'}
                  </p>
                )}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_BLOCKER', id: blocker.id }) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                  style={{ color: 'rgba(80,75,70,0.7)' }}
                >
                  <X size={9} />
                </button>
                <div
                  className="absolute bottom-0 left-0 right-0 h-3 z-20 flex justify-center pt-1"
                  style={{ cursor: 'ns-resize' }}
                  onMouseDown={e => startResizeDrag(e, blocker)}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-[2px] rounded-full" style={{ backgroundColor: 'rgba(80,75,70,0.4)' }} />
                </div>
              </div>
            )
          })}

          {/* Course blocks — lectures */}
          {allCourseBlocks.filter(b => !b.isRecitation).map(block => (
            <div
              key={block.key}
              className={cn(
                'absolute rounded-lg border px-2 py-1 overflow-visible cursor-pointer group z-20',
                'transition-shadow hover:shadow-md',
                FACULTY_COLORS[block.faculty]
              )}
              style={{ ...blockStyle(block.startHour, block.endHour, block.dayIndex), opacity: state.filters.faculties.has(block.faculty) ? 1 : 0.18 }}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                setPanel({ courseId: block.courseId, rect: e.currentTarget.getBoundingClientRect() })
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-tight truncate">{block.label}</p>
                  <p className="text-[10px] opacity-60 leading-tight">{block.code}</p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LOCK', courseId: block.courseId, semesterId }) }}
                    className={cn('p-0.5 rounded', FACULTY_BTN[block.faculty])}
                  >
                    {block.locked ? <Lock size={10} /> : <Unlock size={10} />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_COURSE', courseId: block.courseId, semesterId }) }}
                    className="p-0.5 rounded text-stone-400 hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Recitation blocks — dashed border, "Rec" label */}
          {allCourseBlocks.filter(b => b.isRecitation).map(block => (
            <div
              key={block.key}
              className={cn(
                'absolute rounded-lg px-2 py-1 cursor-pointer group z-20',
                'transition-shadow hover:shadow-md',
                FACULTY_COLORS[block.faculty]
              )}
              style={{
                ...blockStyle(block.startHour, block.endHour, block.dayIndex),
                borderStyle: 'dashed',
                borderWidth: '1.5px',
                opacity: state.filters.faculties.has(block.faculty) ? 0.85 : 0.18,
              }}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                setPanel({ courseId: block.courseId, rect: e.currentTarget.getBoundingClientRect() })
              }}
            >
              <p className="text-[10px] font-semibold leading-tight truncate opacity-80">
                <span className="opacity-60 mr-0.5">Rec</span> {block.label}
              </p>
            </div>
          ))}

          {/* Course-course collision overlays */}
          {collisionZones.map((zone, i) => (
            <div
              key={`col-${i}`}
              className="absolute pointer-events-none rounded-md z-[25] overflow-hidden"
              style={{ ...blockStyle(zone.startHour, zone.endHour, zone.dayIndex), ...COLLISION_STRIPE }}
            />
          ))}

          {/* Course-blocker collision overlays */}
          {blockerCollisionZones.map((zone, i) => (
            <div
              key={`bcol-${i}`}
              className="absolute pointer-events-none rounded-md z-[25] overflow-hidden"
              style={{ ...blockStyle(zone.startHour, zone.endHour, zone.dayIndex), ...COLLISION_STRIPE }}
            />
          ))}
        </div>
      </div>

      {/* Option panel portal */}
      {panel && panelCourse && panelPlaced && createPortal(
        <div
          className="bg-white rounded-xl shadow-2xl border border-stone-200 p-2 w-56 z-50"
          style={{
            position: 'fixed',
            top: Math.min(panel.rect.bottom + 6, window.innerHeight - 280),
            left: Math.min(panel.rect.left, window.innerWidth - 230),
          }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[11px] font-semibold text-stone-800 px-1.5 pb-2 border-b border-stone-100">
            {panelCourse.name}
          </p>

          {panelCourse.lectureOptions.length > 0 && (
            <>
              <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 px-1.5 pt-2 pb-1">
                Lecture options
              </p>
              {panelCourse.lectureOptions.map(opt => {
                const active = panelPlaced.lectureOptionId === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      dispatch({ type: 'SET_LECTURE_OPTION', courseId: panel.courseId, semesterId, optionId: opt.id })
                      setPanel(null)
                    }}
                    className={cn(
                      'w-full flex items-start gap-2 px-1.5 py-1.5 rounded-lg text-left transition-colors mb-0.5',
                      active ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-700'
                    )}
                  >
                    <span className={cn('mt-0.5 w-2.5 h-2.5 rounded-full border-2 shrink-0', active ? 'border-white bg-white' : 'border-stone-400')} />
                    <div>
                      {opt.slots.map((s, i) => (
                        <p key={i} className={cn('text-[10px] leading-relaxed', active ? 'text-white/80' : 'text-stone-500')}>
                          {DAY_LABEL[s.day]} {formatTime(s.startHour)}–{formatTime(s.endHour)}
                        </p>
                      ))}
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {panelCourse.recitationOptions && panelCourse.recitationOptions.length > 0 && (
            <>
              <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 px-1.5 pt-2 pb-1">
                Recitation options
              </p>
              {panelCourse.recitationOptions.map(opt => {
                const active = panelPlaced.recitationOptionId === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      dispatch({ type: 'SET_RECITATION_OPTION', courseId: panel.courseId, semesterId, optionId: opt.id })
                      setPanel(null)
                    }}
                    className={cn(
                      'w-full flex items-start gap-2 px-1.5 py-1.5 rounded-lg text-left transition-colors mb-0.5',
                      active ? 'bg-stone-800 text-white' : 'hover:bg-stone-100 text-stone-700'
                    )}
                  >
                    <span className={cn('mt-0.5 w-2.5 h-2.5 rounded-full border-2 shrink-0', active ? 'border-white bg-white' : 'border-stone-400')} />
                    <div>
                      {opt.slots.map((s, i) => (
                        <p key={i} className={cn('text-[10px] leading-relaxed', active ? 'text-white/80' : 'text-stone-500')}>
                          {DAY_LABEL[s.day]} {formatTime(s.startHour)}–{formatTime(s.endHour)}
                        </p>
                      ))}
                    </div>
                  </button>
                )
              })}
            </>
          )}

          <div className="border-t border-stone-100 mt-1 pt-1">
            <button
              onClick={() => { dispatch({ type: 'REMOVE_COURSE', courseId: panel.courseId, semesterId }); setPanel(null) }}
              className="w-full text-left text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-1.5 rounded-lg transition-colors"
            >
              Remove from schedule
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
