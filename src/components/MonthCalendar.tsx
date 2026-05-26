import { useRef, useEffect, useMemo } from 'react'
import { cn } from '../lib/utils'
import Tooltip from './Tooltip'
import type { Faculty } from '../types'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const WEEK_LABELS = ['S','M','T','W','T','F','S']

// Snake colours by course faculty
const FACULTY_BAR: Record<Faculty, string> = {
  cs:       'rgba(147,197,253,0.85)',
  math:     'rgba(196,181,253,0.85)',
  physics:  'rgba(252,211,77,0.85)',
  misc: 'rgba(214,211,209,0.9)',
}
const FACULTY_HEAD: Record<Faculty, string> = {
  cs:       '#3b82f6',
  math:     '#8b5cf6',
  physics:  '#f59e0b',
  misc: '#78716c',
}

export interface ExamCourse { name: string; faculty: Faculty }

interface Props {
  markedDays: Set<string>
  onToggleDay: (dateStr: string) => void
  examMap?: Map<string, ExamCourse[]>
  closeExamDates?: Set<string>
}

type SnakeDayInfo =
  | { type: 'head'; courses: ExamCourse[] }
  | { type: 'body'; forExam: string; faculty: Faculty }

function buildCells(year: number, month: number): (number | null)[] {
  const lead  = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function buildSnakeMap(examMap: Map<string, ExamCourse[]>): Map<string, SnakeDayInfo> {
  const map = new Map<string, SnakeDayInfo>()
  if (examMap.size === 0) return map

  const sortedDates = [...examMap.keys()].sort()

  // Mark all exam days as heads
  for (const [date, courses] of examMap) {
    map.set(date, { type: 'head', courses })
  }

  // Pre-exam body for the very first single-exam: 7 days before
  const firstDate = sortedDates[0]
  const firstCourses = examMap.get(firstDate)!
  if (firstCourses.length === 1) {
    let cur = shiftDate(firstDate, -7)
    while (cur < firstDate) {
      if (!map.has(cur)) map.set(cur, { type: 'body', forExam: firstCourses[0].name, faculty: firstCourses[0].faculty })
      cur = shiftDate(cur, 1)
    }
  }

  // Body days between consecutive single-exam targets, limited to 7 days before each exam
  for (let i = 1; i < sortedDates.length; i++) {
    const nextDate = sortedDates[i]
    const nextCourses = examMap.get(nextDate)!
    if (nextCourses.length > 1) continue  // multi-exam: no snake

    const prevDate = sortedDates[i - 1]
    const sevenBefore = shiftDate(nextDate, -7)
    // Start from whichever is later: day after prevExam OR 7 days before nextExam
    const bodyStart = prevDate >= sevenBefore ? shiftDate(prevDate, 1) : sevenBefore

    let cur = bodyStart
    while (cur < nextDate) {
      if (!map.has(cur)) map.set(cur, { type: 'body', forExam: nextCourses[0].name, faculty: nextCourses[0].faculty })
      cur = shiftDate(cur, 1)
    }
  }

  return map
}

// True if dateStr is a body day — used for LEFT connectivity of body days
function isBodyDay(snakeMap: Map<string, SnakeDayInfo>, dateStr: string): boolean {
  return snakeMap.get(dateStr)?.type === 'body'
}
// True if next day is body or single-head — used for RIGHT connectivity of body days
function connectsRight(snakeMap: Map<string, SnakeDayInfo>, dateStr: string): boolean {
  const info = snakeMap.get(dateStr)
  if (!info) return false
  if (info.type === 'body') return true
  return info.type === 'head' && info.courses.length === 1
}

export default function MonthCalendar({ markedDays, onToggleDay, examMap, closeExamDates }: Props) {
  const today = new Date()
  const scrollRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const snakeMap = useMemo(() => buildSnakeMap(examMap ?? new Map()), [examMap])

  // Month range: start from earlier of today or month containing first snake day
  const months = useMemo(() => {
    let fromYear = today.getFullYear()
    let fromMonth = today.getMonth()

    if (examMap && examMap.size > 0) {
      const firstExam = [...examMap.keys()].sort()[0]
      // Snake starts 7 days before first exam
      const snakeStart = shiftDate(firstExam, -7)
      const snakeDate = new Date(snakeStart + 'T12:00:00')
      if (snakeDate < new Date(fromYear, fromMonth, 1)) {
        fromYear = snakeDate.getFullYear()
        fromMonth = snakeDate.getMonth()
      }
    }

    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(fromYear, fromMonth + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }, [examMap])

  const examDatesKey = useMemo(
    () => [...(examMap?.keys() ?? [])].sort().join(','),
    [examMap]
  )

  // Auto-scroll to the month containing the first snake day
  useEffect(() => {
    if (!examMap || examMap.size === 0) return
    const firstExam = [...examMap.keys()].sort()[0]
    const snakeStart = shiftDate(firstExam, -7)
    const d = new Date(snakeStart + 'T12:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const el = monthRefs.current.get(key)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [examDatesKey])

  const isToday  = (y: number, m: number, d: number) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d
  const isMarked = (y: number, m: number, d: number) => markedDays.has(toDateStr(y, m, d))

  return (
    <div className="w-[268px] shrink-0 border-l border-stone-200 flex flex-col overflow-hidden bg-white">

      {/* Fixed weekday header */}
      <div className="h-11 shrink-0 border-b border-stone-200 grid grid-cols-7 px-2">
        {WEEK_LABELS.map((l, i) => (
          <div key={i} className="flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{l}</span>
          </div>
        ))}
      </div>

      {/* Scrollable month blocks */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {months.map(({ year, month }, mi) => {
          const cells = buildCells(year, month)
          const monthKey = `${year}-${month}`

          return (
            <div
              key={monthKey}
              ref={el => {
                if (el) monthRefs.current.set(monthKey, el)
                else monthRefs.current.delete(monthKey)
              }}
              className={cn(mi > 0 && 'border-t border-stone-200')}
            >
              <div className="px-3 pt-3 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {MONTH_NAMES[month]}&nbsp;{year}
                </span>
              </div>

              <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e-${mi}-${i}`} className="h-8" />

                  const dateStr = toDateStr(year, month, day)
                  const snake = snakeMap.get(dateStr)
                  const isHead = snake?.type === 'head'
                  const isBody = snake?.type === 'body'
                  const headCourses = isHead ? (snake as { type: 'head'; courses: ExamCourse[] }).courses : []
                  const isSingleHead = isHead && headCourses.length === 1
                  const isMultiHead = isHead && headCourses.length > 1
                  const bodyInfo = isBody ? (snake as { type: 'body'; forExam: string; faculty: Faculty }) : null

                  const prevStr = shiftDate(dateStr, -1)
                  const nextStr = shiftDate(dateStr, 1)

                  const todayDay = isToday(year, month, day)
                  const marked = isMarked(year, month, day)
                  const isCloseExam = isHead && closeExamDates?.has(dateStr)

                  // Bar rendering:
                  //  - body days: left cap at first study day (prev not a body), right connects toward next body or head
                  //  - single head: bar only from left (prev body) toward center; never extends right
                  const showBodyBar = isBody
                  const bodyLeftEdge = isBodyDay(snakeMap, prevStr) ? '0' : '50%'
                  const bodyRightEdge = connectsRight(snakeMap, nextStr) ? '0' : '50%'
                  const bodyLeftCap = bodyLeftEdge === '50%'
                  const bodyRightCap = bodyRightEdge === '50%'

                  const showHeadBar = isSingleHead && isBodyDay(snakeMap, prevStr)

                  const faculty = isSingleHead ? headCourses[0].faculty : bodyInfo?.faculty ?? null

                  const hoverTitle = isSingleHead
                    ? `Exam: ${headCourses[0].name}`
                    : isMultiHead
                      ? `Exams:\n${headCourses.map(c => c.name).join('\n')}`
                      : isBody
                        ? `Studying for: ${bodyInfo!.forExam}`
                        : undefined

                  const tooltipText = hoverTitle
                    ? hoverTitle.replace(/\n/g, ' · ')
                    : undefined

                  const btn = (
                    <button
                      onClick={() => onToggleDay(dateStr)}
                      className="relative w-full h-8 flex items-center justify-center select-none"
                    >
                      {/* Snake body bar */}
                      {showBodyBar && (
                        <div
                          className={cn(
                            'absolute top-1/2 -translate-y-1/2 h-[14px]',
                            bodyLeftCap && !bodyRightCap && 'rounded-l-full',
                            !bodyLeftCap && bodyRightCap && 'rounded-r-full',
                            bodyLeftCap && bodyRightCap && 'rounded-full',
                          )}
                          style={{
                            left: bodyLeftEdge,
                            right: bodyRightEdge,
                            backgroundColor: faculty ? FACULTY_BAR[faculty] : 'rgba(200,200,200,0.7)',
                          }}
                        />
                      )}

                      {/* Head bar: left side only, covering the full circle width */}
                      {showHeadBar && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-[14px]"
                          style={{
                            left: '0',
                            right: 'calc(50% - 16px)',
                            backgroundColor: faculty ? FACULTY_BAR[faculty] : 'rgba(200,200,200,0.7)',
                          }}
                        />
                      )}

                      {/* Day circle */}
                      <div
                        className={cn(
                          'relative z-10 w-8 h-8 flex flex-col items-center justify-center rounded-full text-[12px] leading-none transition-colors',
                          todayDay
                            ? 'text-white font-semibold'
                            : isSingleHead
                              ? 'text-white font-semibold'
                              : isMultiHead
                                ? 'font-semibold hover:bg-stone-100'
                                : marked
                                  ? 'text-stone-900 font-semibold hover:bg-stone-100'
                                  : 'text-stone-600 hover:bg-stone-100'
                        )}
                        style={{
                          backgroundColor: todayDay
                            ? '#1c1917'
                            : isSingleHead && faculty
                              ? FACULTY_HEAD[faculty]
                              : undefined,
                          outline: isCloseExam ? '2.5px solid #ef4444' : undefined,
                          outlineOffset: isCloseExam ? '2px' : undefined,
                        }}
                      >
                        <span className={cn(
                          (marked || isMultiHead) && !isSingleHead && !todayDay && '-translate-y-px'
                        )}>
                          {day}
                        </span>

                        {/* Dots for marked days / multi-exam heads */}
                        {(marked || isMultiHead) && !todayDay && !isSingleHead && (
                          <div className="absolute bottom-1 flex gap-0.5 left-1/2 -translate-x-1/2">
                            {marked && <span className="w-[4px] h-[4px] rounded-full bg-amber-400" />}
                            {isMultiHead && <span className="w-[4px] h-[4px] rounded-full bg-red-400" />}
                          </div>
                        )}
                      </div>
                    </button>
                  )

                  return tooltipText ? (
                    <Tooltip key={`${mi}-${day}`} text={tooltipText} side="top" className="h-8 flex items-center">
                      {btn}
                    </Tooltip>
                  ) : (
                    <div key={`${mi}-${day}`} className="h-8 flex items-center">
                      {btn}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="h-4" />
      </div>
    </div>
  )
}
